import { expandTasksInRange, sortTasksByTime } from "../utils/task-helpers.js";

const splitOccurrenceId = (taskId) => {
  const [sourceTaskId, occurrenceDate] = taskId.split("::");
  return { sourceTaskId, occurrenceDate: occurrenceDate || "" };
};

const withoutRecurrence = (task) => ({
  ...task,
  recurrenceType: "none",
  recurrenceWeekdays: [],
  recurrenceMonths: [],
  recurrenceUntil: "",
  recurrenceExceptions: [],
});

export class TaskManager {
  constructor(storageService) {
    this.storageService = storageService;
    this.tasks = this.storageService.loadTasks();
  }

  getById(taskId) {
    const { sourceTaskId, occurrenceDate } = splitOccurrenceId(taskId);
    const task = this.tasks.find((currentTask) => currentTask.id === sourceTaskId) || null;

    if (!task || !occurrenceDate) {
      return task;
    }

    return {
      ...task,
      id: taskId,
      sourceTaskId,
      date: occurrenceDate,
      originalDate: task.date,
      isRecurringOccurrence: task.recurrenceType !== "none",
    };
  }

  getByDate(dateISO) {
    return sortTasksByTime(expandTasksInRange(this.tasks, dateISO, dateISO));
  }

  getByRange(startISO, endISO) {
    return sortTasksByTime(expandTasksInRange(this.tasks, startISO, endISO));
  }

  create(taskData) {
    const newTask = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...taskData,
    };
    this.tasks.push(newTask);
    this.persist();
    return newTask;
  }

  update(taskId, changes) {
    const { sourceTaskId, occurrenceDate } = splitOccurrenceId(taskId);

    if (occurrenceDate) {
      this.detachOccurrence(sourceTaskId, occurrenceDate, changes);
      this.persist();
      return;
    }

    this.tasks = this.tasks.map((task) => (task.id === sourceTaskId ? { ...task, ...changes } : task));
    this.persist();
  }

  delete(taskId) {
    const { sourceTaskId, occurrenceDate } = splitOccurrenceId(taskId);

    if (occurrenceDate) {
      this.addRecurrenceException(sourceTaskId, occurrenceDate);
      this.persist();
      return;
    }

    this.tasks = this.tasks.filter((task) => task.id !== sourceTaskId);
    this.persist();
  }

  move(taskId, newDate) {
    this.update(taskId, { date: newDate });
  }

  persist() {
    this.storageService.saveTasks(this.tasks);
  }

  detachOccurrence(sourceTaskId, occurrenceDate, changes) {
    const sourceTask = this.tasks.find((task) => task.id === sourceTaskId);
    if (!sourceTask) {
      return;
    }

    this.addRecurrenceException(sourceTaskId, occurrenceDate);

    const detachedTask = withoutRecurrence({
      ...sourceTask,
      ...changes,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      sourceTaskId,
      detachedFromDate: occurrenceDate,
    });

    this.tasks.push(detachedTask);
  }

  addRecurrenceException(sourceTaskId, dateISO) {
    this.tasks = this.tasks.map((task) => {
      if (task.id !== sourceTaskId) {
        return task;
      }

      const recurrenceExceptions = [...new Set([...(task.recurrenceExceptions || []), dateISO])].sort();
      return { ...task, recurrenceExceptions };
    });
  }
}
