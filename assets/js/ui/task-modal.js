import { get } from "../utils/dom.js";

export class TaskModal {
  constructor(onSubmit) {
    this.onSubmit = onSubmit;
    this.form = get("#taskForm");
    this.modalElement = get("#taskModal");
    this.modalTitle = get("#taskModalLabel");
    this.weeklyRecurrenceOptions = get("#weeklyRecurrenceOptions");
    this.monthlyRecurrenceOptions = get("#monthlyRecurrenceOptions");
    this.recurrenceUntilGroup = get("#recurrenceUntilGroup");
    this.recurrenceEndToggle = get("#taskHasRecurrenceEnd");
    this.tomSelectInstances = [];
    this.modal = new bootstrap.Modal(this.modalElement);
    this.fields = {
      id: get("#taskId"),
      title: get("#taskTitle"),
      date: get("#taskDate"),
      time: get("#taskTime"),
      priority: get("#taskPriority"),
      color: get("#taskColor"),
      recurrenceType: get("#taskRecurrenceType"),
      recurrenceWeekdays: get("#taskRecurrenceWeekdays"),
      recurrenceMonths: get("#taskRecurrenceMonths"),
      recurrenceUntil: get("#taskRecurrenceUntil"),
      description: get("#taskDescription"),
    };

    this.setupEnhancedSelects();
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

    this.modalElement.addEventListener("hidden.bs.modal", () => {
      this.form.reset();
      this.fields.id.value = "";
      this.fields.priority.value = "media";
      this.fields.color.value = "#ffb44c";
      this.fields.recurrenceType.value = "none";
      this.recurrenceEndToggle.checked = false;
      this.clearRecurrenceSelections();
      this.updateRecurrenceVisibility();
    });
  }

  open(task = null, selectedDate = "") {
    const isEditing = Boolean(task);
    this.modalTitle.textContent = isEditing ? "Editar tarea" : "Nueva tarea";
    this.fields.id.value = task?.id || "";
    this.fields.title.value = task?.title || "";
    this.fields.date.value = task?.date || selectedDate;
    this.fields.time.value = task?.time || "";
    this.fields.priority.value = task?.priority || "media";
    this.fields.color.value = task?.color || "#ffb44c";
    this.fields.recurrenceType.value = task?.recurrenceType || "none";
    this.fields.recurrenceUntil.value = task?.recurrenceUntil || "";
    this.recurrenceEndToggle.checked = Boolean(task?.recurrenceUntil);
    this.fields.description.value = task?.description || "";
    this.setSelectValues(this.fields.recurrenceWeekdays, task?.recurrenceWeekdays || []);
    this.setSelectValues(this.fields.recurrenceMonths, task?.recurrenceMonths || []);
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
      recurrenceWeekdays: this.getSelectValues(this.fields.recurrenceWeekdays),
      recurrenceMonths: this.getSelectValues(this.fields.recurrenceMonths),
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

    if (this.fields.recurrenceType.value === "weekly" && !this.getSelectValues(this.fields.recurrenceWeekdays).length) {
      const selectedDate = new Date(`${this.fields.date.value}T12:00:00`);
      const weekday = (selectedDate.getDay() + 6) % 7;
      this.setSelectValues(this.fields.recurrenceWeekdays, [weekday]);
    }

    if (this.fields.recurrenceType.value === "monthly" && !this.getSelectValues(this.fields.recurrenceMonths).length) {
      const selectedDate = new Date(`${this.fields.date.value}T12:00:00`);
      this.setSelectValues(this.fields.recurrenceMonths, [selectedDate.getMonth() + 1]);
    }
  }

  getSelectValues(field) {
    if (field.tomselect) {
      const value = field.tomselect.getValue();
      return Array.isArray(value) ? value : value ? String(value).split(",") : [];
    }

    return [...field.selectedOptions].map((option) => option.value);
  }

  setSelectValues(field, values) {
    const normalized = new Set((values || []).map(String));
    const selectedValues = [...normalized];

    [...field.options].forEach((option) => {
      option.selected = normalized.has(option.value);
    });

    if (field.tomselect) {
      field.tomselect.setValue(selectedValues, true);
    }
  }

  clearRecurrenceSelections() {
    this.setSelectValues(this.fields.recurrenceWeekdays, []);
    this.setSelectValues(this.fields.recurrenceMonths, []);
    this.fields.recurrenceUntil.value = "";
  }

  updateRecurrenceEndVisibility() {
    const showDateField = this.recurrenceEndToggle.checked && this.fields.recurrenceType.value !== "none";
    this.fields.recurrenceUntil.classList.toggle("d-none", !showDateField);

    if (!showDateField) {
      this.fields.recurrenceUntil.value = "";
    }
  }

  setupEnhancedSelects() {
    if (typeof TomSelect === "undefined") {
      return;
    }

    this.tomSelectInstances = [this.fields.recurrenceWeekdays, this.fields.recurrenceMonths].map((field) =>
      new TomSelect(field, {
        plugins: {
          checkbox_options: {},
          remove_button: { title: "Quitar" },
          clear_button: { title: "Limpiar" },
        },
        hidePlaceholder: true,
        closeAfterSelect: false,
        copyClassesToDropdown: false,
        controlInput: null,
        render: {
          option(item, escape) {
            return `<div class="ts-option-row"><span class="ts-option-label">${escape(item.text)}</span></div>`;
          },
        },
      })
    );
  }
}
