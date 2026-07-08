import { get } from "../utils/dom.js";

export class ConfirmModal {
  constructor() {
    this.element = get("#confirmModal");
    this.title = get("#confirmModalTitle");
    this.message = get("#confirmModalMessage");
    this.eyebrow = get("#confirmModalEyebrow");
    this.confirmButton = get("#confirmModalConfirm");
    this.cancelButton = get("#confirmModalCancel");
    this.modal = new bootstrap.Modal(this.element);
    this.resolve = null;

    this.bindEvents();
  }

  bindEvents() {
    this.confirmButton.addEventListener("click", () => {
      this.resolveAndClose(true);
    });

    this.element.addEventListener("hidden.bs.modal", () => {
      this.resolveAndClose(false);
    });
  }

  ask({
    eyebrow = "Confirmación",
    title = "Confirmar acción",
    message = "¿Quieres continuar?",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    danger = false,
  } = {}) {
    this.eyebrow.textContent = eyebrow;
    this.title.textContent = title;
    this.message.textContent = message;
    this.confirmButton.textContent = confirmText;
    this.cancelButton.textContent = cancelText;
    this.confirmButton.classList.toggle("btn-danger-soft", danger);
    this.confirmButton.classList.toggle("btn-accent", !danger);

    return new Promise((resolve) => {
      this.resolve = resolve;
      this.modal.show();
    });
  }

  resolveAndClose(result) {
    if (!this.resolve) {
      return;
    }

    const resolve = this.resolve;
    this.resolve = null;
    resolve(result);

    if (result) {
      this.modal.hide();
    }
  }
}
