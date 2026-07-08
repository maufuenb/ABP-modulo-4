import { toISODate } from "../utils/date-utils.js";

export class AlertService {
  constructor(storageService) {
    this.storageService = storageService;
    this.lastAlertKey = "monthly-planner-last-alert-date";
  }

  notifyTodayTasks(todayTasks) {
    if (!todayTasks.length) {
      return;
    }

    const today = toISODate(new Date());
    const lastAlertDate = this.storageService.getItem(this.lastAlertKey);

    if (lastAlertDate === today) {
      return;
    }

    const taskNames = todayTasks
      .map((task) => (task.time ? `${task.time} - ${task.title}` : task.title))
      .join("\n");

    window.alert(`Tareas para hoy (${today}):\n${taskNames}`);
    this.storageService.setItem(this.lastAlertKey, today);
  }
}
