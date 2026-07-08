import { TaskManager } from "../managers/task-manager.js";
import { StorageService } from "../services/storage-service.js";
import { ConfirmModal } from "../ui/confirm-modal.js";
import { TaskModal } from "../ui/task-modal.js";
import { PlannerRenderer } from "../ui/planner-renderer.js";
import { get } from "../utils/dom.js";
import { getCalendarDays, toISODate } from "../utils/date-utils.js";
import { buildTasksByDateMap, normalizeTaskData, sortTasksByTime } from "../utils/task-helpers.js";

export class PlannerApp {
  constructor() {
    this.storage = new StorageService("monthly-planner-tasks");
    this.taskManager = new TaskManager(this.storage);
    this.confirmModal = new ConfirmModal();
    this.activeMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    this.selectedDate = toISODate(new Date());
    this.draggedTaskId = null;
    this.previousMonthButton = get("#previousMonthButton");
    this.nextMonthButton = get("#nextMonthButton");
    this.todayButton = get("#todayButton");

    this.renderer = new PlannerRenderer({
      onAddTask: (selectedDate) => this.taskModal.open(null, selectedDate),
      onEditTask: (taskId) => this.handleEditTask(taskId),
      onDeleteTask: (taskId) => this.handleDeleteTask(taskId),
      onDropTask: (taskId, date) => this.handleDropTask(taskId, date),
      onSelectDate: (date) => this.handleSelectDate(date),
    });
    this.taskModal = new TaskModal(
      (taskData) => this.handleTaskSubmit(taskData),
      (taskId) => this.handleDeleteTask(taskId)
    );
  }

  init() {
    this.renderer.renderWeekdays();
    this.bindEvents();
    this.render();
    this.scheduleTodayRefresh();
  }

  bindEvents() {
    this.previousMonthButton.addEventListener("click", () => {
      this.goToRelativeMonth(-1);
    });

    this.nextMonthButton.addEventListener("click", () => {
      this.goToRelativeMonth(1);
    });

    this.todayButton.addEventListener("click", () => {
      this.activeMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      this.selectedDate = toISODate(new Date());
      this.render();
    });

    document.addEventListener("dragstart", (event) => {
      this.draggedTaskId = event.target.closest(".task-card")?.dataset.taskId || null;
    });

    document.addEventListener("dragend", () => {
      this.draggedTaskId = null;
    });
  }

  goToRelativeMonth(offset) {
    this.activeMonth = new Date(this.activeMonth.getFullYear(), this.activeMonth.getMonth() + offset, 1);
    this.selectedDate = this.getDefaultSelectedDate(this.activeMonth);
    this.render();
  }

  handleTaskSubmit(taskData) {
    const normalizedTask = normalizeTaskData(taskData);

    if (taskData.id) {
      this.taskManager.update(taskData.id, normalizedTask);
    } else {
      this.taskManager.create(normalizedTask);
    }

    this.activeMonth = new Date(Number(taskData.date.slice(0, 4)), Number(taskData.date.slice(5, 7)) - 1, 1);
    this.selectedDate = taskData.date;
    this.render();
  }

  handleEditTask(taskId) {
    const task = this.taskManager.getById(taskId);
    if (task) {
      this.taskModal.open(task);
    }
  }

  async handleDeleteTask(taskId) {
    const task = this.taskManager.getById(taskId);
    if (!task) {
      return;
    }

    const confirmed = await this.confirmModal.ask({
      eyebrow: "Eliminar tarea",
      title: "¿Eliminar esta tarea?",
      message: `La tarea "${task.title}" se eliminará del calendario. Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      danger: true,
    });
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
    const tasksByDate = this.getTasksByDate();
    const selectedTasks = this.taskManager.getByDate(this.selectedDate);

    this.renderer.renderCalendar({
      activeMonth: this.activeMonth,
      tasksByDate,
      selectedDate: this.selectedDate,
      selectedTasks,
    });
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
