import { expandTasksInRange, sortTasksByTime } from "../utils/task-helpers.js";

export class TaskManager {
  constructor(storageService) {
    this.storageService = storageService;
    this.tasks = this.storageService.loadTasks();
  }

  getAll() {
    return [...this.tasks];
  }

  getById(taskId) {
    const sourceTaskId = taskId.includes("::") ? taskId.split("::")[0] : taskId;
    return this.tasks.find((task) => task.id === sourceTaskId) || null;
  }

  getByDate(dateISO) {
    return sortTasksByTime(expandTasksInRange(this.tasks, dateISO, dateISO));
  }

  getByMonth(monthValue) {
    const [year, month] = monthValue.split("-").map(Number);
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
    return sortTasksByTime(expandTasksInRange(this.tasks, monthStart, monthEnd));
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
    const sourceTaskId = taskId.includes("::") ? taskId.split("::")[0] : taskId;
    this.tasks = this.tasks.map((task) => (task.id === sourceTaskId ? { ...task, ...changes } : task));
    this.persist();
  }

  delete(taskId) {
    const sourceTaskId = taskId.includes("::") ? taskId.split("::")[0] : taskId;
    this.tasks = this.tasks.filter((task) => task.id !== sourceTaskId);
    this.persist();
  }

  move(taskId, newDate) {
    this.update(taskId, { date: newDate });
  }

  persist() {
    this.storageService.saveTasks(this.tasks);
  }
}
