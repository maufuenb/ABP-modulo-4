import { create, get } from "../utils/dom.js";
import { formatDate, getCalendarDays, getMonthName, getWeekdayNames } from "../utils/date-utils.js";
import { getChileHoliday, isSunday } from "../utils/holiday-utils.js";
import { getTaskColorStyle } from "../utils/task-helpers.js";

export class PlannerRenderer {
  constructor({ onAddTask, onEditTask, onDeleteTask, onDropTask, onSelectDate }) {
    this.calendarGrid = get("#calendarGrid");
    this.calendarWeekdays = get("#calendarWeekdays");
    this.monthLabel = get("#currentMonthLabel");
    this.agendaList = get("#agendaList");
    this.agendaTaskCount = get("#agendaTaskCount");
    this.agendaTitle = get("#agendaTitle");
    this.agendaCopy = get("#agendaCopy");
    this.mobileAgendaElement = get("#mobileAgendaModal");
    this.mobileAgendaTitle = get("#mobileAgendaTitle");
    this.mobileAgendaCount = get("#mobileAgendaCount");
    this.mobileAgendaList = get("#mobileAgendaList");
    this.mobileAgendaAddTask = get("#mobileAgendaAddTask");
    this.mobileAgendaModal = this.mobileAgendaElement ? new bootstrap.Modal(this.mobileAgendaElement) : null;
    this.mobileAgendaDate = "";
    this.mobileAgendaTasks = [];
    this.mobileAgendaFormattedDay = "";
    this.expandedAgendaTaskId = null;
    this.onAddTask = onAddTask;
    this.onEditTask = onEditTask;
    this.onDeleteTask = onDeleteTask;
    this.onDropTask = onDropTask;
    this.onSelectDate = onSelectDate;

    this.mobileAgendaAddTask?.addEventListener("click", () => {
      if (!this.mobileAgendaDate) {
        return;
      }

      this.mobileAgendaModal?.hide();
      this.onAddTask(this.mobileAgendaDate);
    });
  }

  renderWeekdays() {
    this.calendarWeekdays.innerHTML = "";
    getWeekdayNames().forEach((weekday) => {
      this.calendarWeekdays.append(
        create("div", {
          className: "weekday-pill",
          text: weekday.charAt(0).toUpperCase() + weekday.slice(1),
          dataset: { short: weekday.slice(0, 3).charAt(0).toUpperCase() + weekday.slice(1, 3) },
        })
      );
    });
  }

  renderCalendar({ activeMonth, tasksByDate, selectedDate, selectedTasks }) {
    const calendarDays = getCalendarDays(activeMonth);
    this.monthLabel.textContent = getMonthName(activeMonth);
    this.calendarGrid.innerHTML = "";

    calendarDays.forEach((day) => {
      const tasks = tasksByDate.get(day.iso) || [];
      const holidayName = getChileHoliday(day.date);
      const isRestDay = isSunday(day.date) || Boolean(holidayName);
      const dayCard = create("article", {
        className: `calendar-day${day.isCurrentMonth ? "" : " is-outside"}${day.isToday ? " is-today" : ""}${day.iso === selectedDate ? " is-selected" : ""}${tasks.length ? "" : " is-empty"}${isSunday(day.date) ? " is-sunday" : ""}${holidayName ? " is-holiday" : ""}`,
        dataset: { date: day.iso },
        attributes: {
          tabindex: "0",
          role: "button",
          "aria-label": `${holidayName || isRestDay ? "Día destacado. " : ""}Seleccionar día ${day.iso}${holidayName ? `. Festivo: ${holidayName}` : ""}`,
          title: holidayName || (isRestDay ? "Domingo" : ""),
        },
      });

      dayCard.append(this.createDayHeader(day, tasks.length, holidayName));
      dayCard.append(this.createTaskList(day.iso, tasks));
      if (holidayName) {
        dayCard.append(
          create("p", {
            className: "day-holiday-reason",
            text: holidayName,
          })
        );
      }
      this.attachDropZone(dayCard);
      this.attachDaySelection(dayCard, day, tasks);
      this.calendarGrid.append(dayCard);
    });

    this.renderAgenda(selectedDate, selectedTasks);
  }

  createDayHeader(day, taskCount, holidayName = "") {
    const wrapper = create("div", { className: "day-header" });
    const dayNumber = create("span", { className: "day-number", text: String(day.date.getDate()) });
    const meta = create("div", { className: "day-meta" });

    if (day.isToday) {
      meta.append(create("span", { className: "day-today-tag", text: "Hoy" }));
    }
    if (taskCount > 0) {
      meta.append(create("span", { className: "day-count-badge", text: String(taskCount) }));
    }

    const mobileTaskCount = create("span", {
      className: "mobile-day-task-count",
      text: String(taskCount),
      attributes: {
        "aria-label": `${taskCount} ${taskCount === 1 ? "tarea" : "tareas"}`,
      },
    });

    const addButton = create("button", {
      className: "task-add-button",
      text: "+",
      attributes: { type: "button", "aria-label": `Crear tarea para el ${day.iso}` },
    });

    wrapper.append(dayNumber, meta, mobileTaskCount, addButton);
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
        role: "presentation",
        tabindex: "-1",
        "aria-label": `Tarea ${task.title}`,
        title: task.title,
        style: getTaskColorStyle(task),
      },
    });

    const title = create("h3", { className: "task-card-title", text: task.title });

    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", task.id);
      event.dataTransfer.effectAllowed = "move";
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

  attachDaySelection(dayCard, day, tasks) {
    dayCard.addEventListener("click", (event) => {
      if (event.target.closest(".task-action, .task-add-button")) {
        return;
      }

      this.onSelectDate(dayCard.dataset.date);
      if (this.shouldUseAgendaModal()) {
        this.openMobileAgenda(day.iso, day.date, tasks);
      }
    });

    dayCard.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.onSelectDate(dayCard.dataset.date);
        if (this.shouldUseAgendaModal()) {
          this.openMobileAgenda(day.iso, day.date, tasks);
        }
      }
    });
  }

  shouldUseAgendaModal() {
    return window.matchMedia("(max-width: 1199px)").matches;
  }

  openMobileAgenda(dateISO, date, tasks) {
    if (!this.mobileAgendaModal) {
      return;
    }

    this.mobileAgendaDate = dateISO;
    this.mobileAgendaTasks = tasks;
    const formattedDay = formatDate(date, { weekday: "long", day: "numeric", month: "long" });
    this.mobileAgendaFormattedDay = formattedDay;
    this.mobileAgendaTitle.textContent = formattedDay;
    this.mobileAgendaCount.textContent = `${tasks.length} ${tasks.length === 1 ? "tarea" : "tareas"}`;
    this.renderMobileAgendaTasks();
    this.mobileAgendaModal.show();
  }

  renderMobileAgendaTasks() {
    this.mobileAgendaList.innerHTML = "";

    if (!this.mobileAgendaTasks.length) {
      this.mobileAgendaList.append(
        create("div", {
          className: "agenda-empty-state",
          text: "No hay tareas programadas para este día.",
        })
      );
    } else {
      this.mobileAgendaTasks.forEach((task) => this.mobileAgendaList.append(this.createAgendaCard(task)));
    }
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
    selectedTasks.forEach((task) => section.append(this.createAgendaCard(task)));
    this.agendaList.append(section);
  }

  createAgendaCard(task) {
    const card = create("article", {
      className: `agenda-card priority-${task.priority}`,
      dataset: { taskId: task.id },
      attributes: { style: getTaskColorStyle(task) },
    });
    const aside = create("div", { className: "agenda-card-aside-column" });
    const time = create("div", {
      className: "agenda-time",
      text: task.time || "Todo el dia",
    });
    const body = create("div", { className: "agenda-card-body" });
    const title = create("h5", { className: "agenda-card-title", text: task.title });
    const summary = create("div", { className: "agenda-card-summary" });
    const editButton = create("button", {
      className: "agenda-icon-button",
      html: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 20h4l10.5-10.5-4-4L4 16v4zm13.7-11.3 1.6-1.6a1 1 0 0 0 0-1.4l-1.3-1.3a1 1 0 0 0-1.4 0L15 6.1l2.7 2.6z"/>
        </svg>
      `,
      attributes: { type: "button", "aria-label": `Editar tarea ${task.title}`, title: "Editar" },
    });

    editButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.mobileAgendaModal?.hide();
      this.onEditTask(task.id);
    });

    summary.append(title, editButton);

    body.append(summary);
    if (this.expandedAgendaTaskId === task.id) {
      const { meta, description } = this.createAgendaDetails(task);
      aside.append(meta);
      if (description) {
        body.append(description);
      }
    }

    aside.prepend(time);
    card.append(aside, body);

    card.addEventListener("click", (event) => {
      if (event.target.closest("button, input, select, textarea, label")) {
        return;
      }

      this.expandedAgendaTaskId = this.expandedAgendaTaskId === task.id ? null : task.id;
      if (this.mobileAgendaModal && this.mobileAgendaElement.classList.contains("show")) {
        this.renderMobileAgendaTasks();
        return;
      }

      this.onSelectDate(task.date);
    });

    return card;
  }

  createAgendaDetails(task) {
    const meta = create("div", { className: "agenda-card-meta" });
    meta.append(
      create("span", { className: "agenda-priority-badge", text: task.priority }),
      create("span", {
        className: "agenda-priority-badge agenda-secondary-badge",
        text: this.getRecurrenceLabel(task),
      })
    );

    return {
      meta,
      description: task.description
        ? create("p", { className: "agenda-card-description", text: task.description })
        : null,
    };
  }

  getRecurrenceLabel(task) {
    if (!task.recurrenceType || task.recurrenceType === "none") {
      return "Unica";
    }

    return task.recurrenceType === "weekly" ? "Semanal" : "Mensual";
  }
}
