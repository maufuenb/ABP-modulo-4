import { create, get } from "../utils/dom.js";
import { formatDate, getCalendarDays, getMonthName, getWeekdayNames } from "../utils/date-utils.js";
import { getTaskColorStyle } from "../utils/task-helpers.js";

export class PlannerRenderer {
  constructor({ onAddTask, onEditTask, onDeleteTask, onDropTask, onSelectDate }) {
    this.calendarGrid = get("#calendarGrid");
    this.calendarWeekdays = get("#calendarWeekdays");
    this.todayAlertContainer = get("#todayAlertContainer");
    this.monthLabel = get("#currentMonthLabel");
    this.monthTaskCount = get("#monthTaskCount");
    this.todayTaskCount = get("#todayTaskCount");
    this.agendaList = get("#agendaList");
    this.agendaTaskCount = get("#agendaTaskCount");
    this.agendaTitle = get("#agendaTitle");
    this.agendaCopy = get("#agendaCopy");
    this.onAddTask = onAddTask;
    this.onEditTask = onEditTask;
    this.onDeleteTask = onDeleteTask;
    this.onDropTask = onDropTask;
    this.onSelectDate = onSelectDate;
  }

  renderWeekdays() {
    this.calendarWeekdays.innerHTML = "";
    getWeekdayNames().forEach((weekday) => {
      this.calendarWeekdays.append(
        create("div", {
          className: "weekday-pill",
          text: weekday.charAt(0).toUpperCase() + weekday.slice(1),
        })
      );
    });
  }

  renderCalendar({ activeMonth, tasksByDate, monthTasks, todayTasks, selectedDate, selectedTasks }) {
    const calendarDays = getCalendarDays(activeMonth);
    this.monthLabel.textContent = getMonthName(activeMonth);
    this.monthTaskCount.textContent = String(monthTasks.length);
    this.todayTaskCount.textContent = String(todayTasks.length);
    this.calendarGrid.innerHTML = "";

    calendarDays.forEach((day) => {
      const tasks = tasksByDate.get(day.iso) || [];
      const dayCard = create("article", {
        className: `calendar-day${day.isCurrentMonth ? "" : " is-outside"}${day.isToday ? " is-today" : ""}${day.iso === selectedDate ? " is-selected" : ""}`,
        dataset: { date: day.iso },
        attributes: { tabindex: "0", role: "button", "aria-label": `Seleccionar día ${day.iso}` },
      });

      dayCard.append(this.createDayHeader(day, tasks.length));
      dayCard.append(this.createTaskList(day.iso, tasks));
      this.attachDropZone(dayCard);
      this.attachDaySelection(dayCard);
      this.calendarGrid.append(dayCard);
    });

    this.renderAgenda(selectedDate, selectedTasks);
    this.renderTodayAlert(todayTasks);
  }

  createDayHeader(day, taskCount) {
    const wrapper = create("div", { className: "day-header" });
    const dayNumber = create("span", { className: "day-number", text: String(day.date.getDate()) });
    const meta = create("div", { className: "day-meta" });

    if (day.isToday) {
      meta.append(create("span", { className: "day-today-tag", text: "Hoy" }));
    }
    if (taskCount > 0) {
      meta.append(create("span", { className: "day-count-badge", text: String(taskCount) }));
    }

    const addButton = create("button", {
      className: "task-add-button",
      text: "+",
      attributes: { type: "button", "aria-label": `Crear tarea para el ${day.iso}` },
    });

    wrapper.append(dayNumber, meta, addButton);
    addButton.addEventListener("click", () => this.onAddTask(day.iso));
    return wrapper;
  }

  createTaskList(dateISO, tasks) {
    const list = create("div", { className: "task-list", dataset: { date: dateISO } });
    tasks.forEach((task) => list.append(this.createTaskCard(task)));
    return list;
  }

  createTaskCard(task) {
    const card = create("article", {
      className: `task-card priority-${task.priority}`,
      dataset: { taskId: task.id },
      attributes: {
        draggable: "true",
        role: "button",
        tabindex: "0",
        "aria-label": `Editar tarea ${task.title}`,
        title: task.title,
        style: getTaskColorStyle(task),
      },
    });

    const title = create("h3", { className: "task-card-title", text: task.title });

    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", task.id);
      event.dataTransfer.effectAllowed = "move";
    });

    card.addEventListener("click", (event) => {
      event.stopPropagation();
      this.onEditTask(task.id);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        this.onEditTask(task.id);
      }
    });

    card.append(title);

    return card;
  }

  attachDropZone(dayCard) {
    dayCard.addEventListener("dragover", (event) => {
      event.preventDefault();
      dayCard.classList.add("is-drop-target");
    });

    dayCard.addEventListener("dragleave", () => {
      dayCard.classList.remove("is-drop-target");
    });

    dayCard.addEventListener("drop", (event) => {
      event.preventDefault();
      dayCard.classList.remove("is-drop-target");
      const taskId = event.dataTransfer.getData("text/plain");
      const { date } = dayCard.dataset;
      if (taskId && date) {
        this.onDropTask(taskId, date);
      }
    });
  }

  attachDaySelection(dayCard) {
    dayCard.addEventListener("click", (event) => {
      if (event.target.closest(".task-card, .task-action, .task-add-button")) {
        return;
      }

      this.onSelectDate(dayCard.dataset.date);
    });

    dayCard.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.onSelectDate(dayCard.dataset.date);
      }
    });
  }

  renderAgenda(selectedDate, selectedTasks) {
    this.agendaList.innerHTML = "";
    const selectedDay = new Date(`${selectedDate}T12:00:00`);
    const formattedDay = formatDate(selectedDay, { weekday: "long", day: "numeric", month: "long" });
    this.agendaTitle.textContent = formattedDay;
    this.agendaCopy.textContent = "Tareas del día seleccionado, ordenadas por hora.";
    this.agendaTaskCount.textContent = `${selectedTasks.length} ${selectedTasks.length === 1 ? "registro" : "registros"}`;

    if (!selectedTasks.length) {
      this.agendaList.append(
        create("div", {
          className: "agenda-empty-state",
          text: "No hay tareas programadas para este día.",
        })
      );
      return;
    }

    const section = create("section", { className: "agenda-day-group" });
    const heading = create("div", { className: "agenda-day-heading" });
    const title = create("h4", {
      className: "agenda-day-title",
      text: formattedDay,
    });
    const count = create("span", {
      className: "agenda-day-count",
      text: `${selectedTasks.length} ${selectedTasks.length === 1 ? "tarea" : "tareas"}`,
    });

    heading.append(title, count);
    section.append(heading);
    selectedTasks.forEach((task) => section.append(this.createAgendaCard(task)));
    this.agendaList.append(section);
  }

  createAgendaCard(task) {
    const card = create("article", {
      className: `agenda-card priority-${task.priority}`,
      dataset: { taskId: task.id },
      attributes: { style: getTaskColorStyle(task) },
    });
    const time = create("div", {
      className: "agenda-time",
      text: task.time || "Todo el dia",
    });
    const body = create("div", { className: "agenda-card-body" });
    const title = create("h5", { className: "agenda-card-title", text: task.title });
    const priority = create("span", {
      className: "agenda-priority-badge",
      text: task.priority,
    });
    const meta = create("div", { className: "agenda-card-meta" });
    meta.append(priority);

    body.append(title, meta);

    if (task.description) {
      body.append(create("p", { className: "agenda-card-description", text: task.description }));
    }

    const actions = create("div", { className: "agenda-card-actions" });
    const editButton = create("button", {
      className: "task-action",
      text: "Editar",
      attributes: { type: "button" },
    });
    const deleteButton = create("button", {
      className: "task-action",
      text: "Eliminar",
      attributes: { type: "button" },
    });

    editButton.addEventListener("click", () => this.onEditTask(task.id));
    deleteButton.addEventListener("click", () => this.onDeleteTask(task.id));

    actions.append(editButton, deleteButton);
    body.append(actions);
    card.append(time, body);
    return card;
  }

  renderTodayAlert(todayTasks) {
    this.todayAlertContainer.innerHTML = "";
    if (!todayTasks.length) {
      return;
    }

    const list = todayTasks
      .map((task) => `${task.time ? `${task.time} · ` : ""}${task.title}`)
      .join(" | ");

    const alert = create("div", {
      className: "alert today-alert mb-0",
      html: `<strong>Recordatorio de hoy:</strong> ${list}`,
    });

    this.todayAlertContainer.append(alert);
  }
}
