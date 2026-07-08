import { PlannerApp } from "./app/planner-app.js";
import { loadComponents } from "./components/component-loader.js";

const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });
    registration.update().catch(() => {});
  } catch (error) {
    console.error("No se pudo registrar el service worker.", error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadComponents()
    .then(() => {
      const app = new PlannerApp();
      app.init();
      registerServiceWorker();
    })
    .catch((error) => {
      console.error("No se pudieron cargar los componentes de la interfaz.", error);
    });
});
