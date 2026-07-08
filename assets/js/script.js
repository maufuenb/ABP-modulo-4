import { PlannerApp } from "./app/planner-app.js";
import { loadComponents } from "./components/component-loader.js";

document.addEventListener("DOMContentLoaded", () => {
  loadComponents()
    .then(() => {
      const app = new PlannerApp();
      app.init();
    })
    .catch((error) => {
      console.error("No se pudieron cargar los componentes de la interfaz.", error);
    });
});
