import { get } from "../utils/dom.js";

export class TaskModal {
  constructor(onSubmit, onDelete) {
    this.onSubmit = onSubmit;
    this.onDelete = onDelete;
    this.form = get("#taskForm");
    this.modalElement = get("#taskModal");
    this.modalTitle = get("#taskModalLabel");
    this.deleteButton = get("#deleteTaskButton");
    this.submitButton = get("#taskSubmitButton");
    this.weeklyRecurrenceOptions = get("#weeklyRecurrenceOptions");
    this.monthlyRecurrenceOptions = get("#monthlyRecurrenceOptions");
    this.recurrenceUntilGroup = get("#recurrenceUntilGroup");
    this.recurrenceEndToggle = get("#taskHasRecurrenceEnd");
    this.modal = new bootstrap.Modal(this.modalElement);
    this.fields = {
      id: get("#taskId"),
      title: get("#taskTitle"),
      date: get("#taskDate"),
      time: get("#taskTime"),
      priority: get("#taskPriority"),
      color: get("#taskColor"),
      recurrenceType: get("#taskRecurrenceType"),
      recurrenceUntil: get("#taskRecurrenceUntil"),
      description: get("#taskDescription"),
    };

    this.bindEvents();
  }

  bindEvents() {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.onSubmit(this.getFormData());
      this.close();
    });

    this.fields.recurrenceType.addEventListener("change", () => {
      this.updateRecurrenceVisibility();
      this.applyDefaultRecurrenceSelection();
    });

    this.fields.date.addEventListener("change", () => {
      this.applyDefaultRecurrenceSelection();
    });

    this.recurrenceEndToggle.addEventListener("change", () => {
      this.updateRecurrenceEndVisibility();
    });

    this.deleteButton.addEventListener("click", () => {
      const taskId = this.fields.id.value.trim();
      if (!taskId) {
        return;
      }

      this.close();
      this.onDelete(taskId);
    });

    this.modalElement.addEventListener("hidden.bs.modal", () => {
      this.form.reset();
      this.fields.id.value = "";
      this.fields.priority.value = "media";
      this.fields.color.value = "#ffb44c";
      this.fields.recurrenceType.value = "none";
      this.recurrenceEndToggle.checked = false;
      this.submitButton.textContent = "Guardar";
      this.deleteButton.classList.add("d-none");
      this.clearRecurrenceSelections();
      this.updateRecurrenceVisibility();
    });
  }

  open(task = null, selectedDate = "") {
    const isEditing = Boolean(task);
    const isOccurrenceEdit = Boolean(task?.isRecurringOccurrence);
    this.modalTitle.textContent = isEditing ? "Editar tarea" : "Nueva tarea";
    this.submitButton.textContent = isEditing ? "Actualizar" : "Guardar";
    this.deleteButton.classList.toggle("d-none", !isEditing);
    this.fields.id.value = task?.id || "";
    this.fields.title.value = task?.title || "";
    this.fields.date.value = task?.date || selectedDate;
    this.fields.time.value = task?.time || "";
    this.fields.priority.value = task?.priority || "media";
    this.fields.color.value = task?.color || "#ffb44c";
    this.fields.recurrenceType.value = isOccurrenceEdit ? "none" : task?.recurrenceType || "none";
    this.fields.recurrenceUntil.value = isOccurrenceEdit ? "" : task?.recurrenceUntil || "";
    this.recurrenceEndToggle.checked = !isOccurrenceEdit && Boolean(task?.recurrenceUntil);
    this.fields.description.value = task?.description || "";
    this.setCheckboxValues("recurrenceWeekdays", isOccurrenceEdit ? [] : task?.recurrenceWeekdays || []);
    this.setCheckboxValues("recurrenceMonths", isOccurrenceEdit ? [] : task?.recurrenceMonths || []);
    this.updateRecurrenceVisibility();
    this.applyDefaultRecurrenceSelection();
    this.modal.show();
  }

  close() {
    this.modal.hide();
  }

  getFormData() {
    return {
      id: this.fields.id.value.trim(),
      title: this.fields.title.value.trim(),
      date: this.fields.date.value,
      time: this.fields.time.value,
      priority: this.fields.priority.value,
      color: this.fields.color.value,
      recurrenceType: this.fields.recurrenceType.value,
      recurrenceWeekdays: this.getCheckboxValues("recurrenceWeekdays"),
      recurrenceMonths: this.getCheckboxValues("recurrenceMonths"),
      recurrenceUntil: this.recurrenceEndToggle.checked ? this.fields.recurrenceUntil.value : "",
      description: this.fields.description.value.trim(),
    };
  }

  updateRecurrenceVisibility() {
    const recurrenceType = this.fields.recurrenceType.value;
    const isWeekly = recurrenceType === "weekly";
    const isMonthly = recurrenceType === "monthly";

    this.weeklyRecurrenceOptions.classList.toggle("d-none", !isWeekly);
    this.monthlyRecurrenceOptions.classList.toggle("d-none", !isMonthly);
    this.recurrenceUntilGroup.classList.toggle("d-none", recurrenceType === "none");
    if (recurrenceType === "none") {
      this.recurrenceEndToggle.checked = false;
      this.fields.recurrenceUntil.value = "";
    }
    this.updateRecurrenceEndVisibility();
  }

  applyDefaultRecurrenceSelection() {
    if (!this.fields.date.value) {
      return;
    }

    if (this.fields.recurrenceType.value === "weekly" && !this.getCheckboxValues("recurrenceWeekdays").length) {
      const selectedDate = new Date(`${this.fields.date.value}T12:00:00`);
      const weekday = (selectedDate.getDay() + 6) % 7;
      this.setCheckboxValues("recurrenceWeekdays", [weekday]);
    }

    if (this.fields.recurrenceType.value === "monthly" && !this.getCheckboxValues("recurrenceMonths").length) {
      const selectedDate = new Date(`${this.fields.date.value}T12:00:00`);
      this.setCheckboxValues("recurrenceMonths", [selectedDate.getMonth() + 1]);
    }
  }

  getCheckboxValues(name) {
    return [...this.form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
  }

  setCheckboxValues(name, values) {
    const normalized = new Set((values || []).map(String));
    this.form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.checked = normalized.has(input.value);
    });
  }

  clearRecurrenceSelections() {
    this.setCheckboxValues("recurrenceWeekdays", []);
    this.setCheckboxValues("recurrenceMonths", []);
    this.fields.recurrenceUntil.value = "";
  }

  updateRecurrenceEndVisibility() {
    const showDateField = this.recurrenceEndToggle.checked && this.fields.recurrenceType.value !== "none";
    this.fields.recurrenceUntil.classList.toggle("d-none", !showDateField);

    if (!showDateField) {
      this.fields.recurrenceUntil.value = "";
    }
  }
}
