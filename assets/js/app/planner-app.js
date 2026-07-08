import { AlertService } from "../services/alert-service.js";
import { TaskManager } from "../managers/task-manager.js";
import { StorageService } from "../services/storage-service.js";
import { TaskModal } from "../ui/task-modal.js";
import { PlannerRenderer } from "../ui/planner-renderer.js";
import { get } from "../utils/dom.js";
import { fromMonthValue, getCalendarDays, toISODate, toMonthValue } from "../utils/date-utils.js";
import { buildTasksByDateMap, normalizeTaskData, sortTasksByTime } from "../utils/task-helpers.js";

export class PlannerApp {
  constructor() {
    this.storage = new StorageService("monthly-planner-tasks");
    this.taskManager = new TaskManager(this.storage);
    this.alertService = new AlertService(this.storage);
    this.activeMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    this.selectedDate = toISODate(new Date());
    this.draggedTaskId = null;
    this.monthPicker = get("#monthPicker");
    this.todayButton = get("#todayButton");
    this.newTaskButton = get("#newTaskButton");

    this.renderer = new PlannerRenderer({
      onAddTask: (selectedDate) => this.taskModal.open(null, selectedDate),
      onEditTask: (taskId) => this.handleEditTask(taskId),
      onDeleteTask: (taskId) => this.handleDeleteTask(taskId),
      onDropTask: (taskId, date) => this.handleDropTask(taskId, date),
      onSelectDate: (date) => this.handleSelectDate(date),
    });
    this.taskModal = new TaskModal((taskData) => this.handleTaskSubmit(taskData));
  }

  init() {
    this.renderer.renderWeekdays();
    this.monthPicker.value = toMonthValue(this.activeMonth);
    this.bindEvents();
    this.render();
    this.scheduleTodayRefresh();
  }

  bindEvents() {
    this.monthPicker.addEventListener("change", (event) => {
      this.activeMonth = fromMonthValue(event.target.value);
      this.selectedDate = this.getDefaultSelectedDate(this.activeMonth);
      this.render();
    });

    this.todayButton.addEventListener("click", () => {
      this.activeMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      this.monthPicker.value = toMonthValue(this.activeMonth);
      this.selectedDate = toISODate(new Date());
      this.render();
    });

    this.newTaskButton.addEventListener("click", () => {
      this.taskModal.open(null, this.selectedDate);
    });

    document.addEventListener("dragstart", (event) => {
      this.draggedTaskId = event.target.closest(".task-card")?.dataset.taskId || null;
    });

    document.addEventListener("dragend", () => {
      this.draggedTaskId = null;
    });
  }

  handleTaskSubmit(taskData) {
    const normalizedTask = normalizeTaskData(taskData);

    if (taskData.id) {
      this.taskManager.update(taskData.id, normalizedTask);
    } else {
      this.taskManager.create(normalizedTask);
    }

    this.activeMonth = fromMonthValue(taskData.date.slice(0, 7));
    this.selectedDate = taskData.date;
    this.monthPicker.value = toMonthValue(this.activeMonth);
    this.render();
  }

  handleEditTask(taskId) {
    const task = this.taskManager.getById(taskId);
    if (task) {
      this.taskModal.open(task);
    }
  }

  handleDeleteTask(taskId) {
    const task = this.taskManager.getById(taskId);
    if (!task) {
      return;
    }

    const confirmed = window.confirm(`¿Eliminar la tarea "${task.title}"?`);
    if (!confirmed) {
      return;
    }

    this.taskManager.delete(taskId);
    this.render();
  }

  handleDropTask(taskId, newDate) {
    const effectiveTaskId = taskId || this.draggedTaskId;
    if (!effectiveTaskId) {
      return;
    }

    this.taskManager.move(effectiveTaskId, newDate);
    this.selectedDate = newDate;
    this.render();
  }

  handleSelectDate(date) {
    this.selectedDate = date;
    this.render();
  }

  getTasksByDate() {
    const calendarDays = getCalendarDays(this.activeMonth);
    const startDate = calendarDays[0].iso;
    const endDate = calendarDays[calendarDays.length - 1].iso;
    const tasksByDate = buildTasksByDateMap(this.taskManager.getByRange(startDate, endDate));

    tasksByDate.forEach((tasks, dateKey) => {
      tasksByDate.set(dateKey, sortTasksByTime(tasks));
    });

    return tasksByDate;
  }

  render() {
    const monthValue = toMonthValue(this.activeMonth);
    const monthTasks = this.taskManager.getByMonth(monthValue);
    const todayTasks = this.taskManager.getByDate(toISODate(new Date()));
    const tasksByDate = this.getTasksByDate();
    const selectedTasks = this.taskManager.getByDate(this.selectedDate);

    this.renderer.renderCalendar({
      activeMonth: this.activeMonth,
      tasksByDate,
      monthTasks,
      todayTasks,
      selectedDate: this.selectedDate,
      selectedTasks,
    });
    this.alertService.notifyTodayTasks(todayTasks);
  }

  getDefaultSelectedDate(activeMonth) {
    const today = new Date();
    if (
      today.getFullYear() === activeMonth.getFullYear() &&
      today.getMonth() === activeMonth.getMonth()
    ) {
      return toISODate(today);
    }

    return toISODate(new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1));
  }

  scheduleTodayRefresh() {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeout = nextMidnight.getTime() - now.getTime();

    window.setTimeout(() => {
      this.render();
      this.scheduleTodayRefresh();
    }, timeout);
  }
}
