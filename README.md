# Planner Mensual PWA

Aplicación web para organizar tareas y reuniones en un calendario mensual, con almacenamiento local e instalación como PWA.

## Demo

[https://maufuenb.github.io/ABP-modulo-4/](https://maufuenb.github.io/ABP-modulo-4/)

## Qué es

`Planner Mensual` es una aplicación web hecha con `HTML`, `CSS` y `JavaScript` modular. Permite gestionar tareas directamente desde una vista de calendario mensual, con una interfaz responsive pensada para escritorio y móvil.

La aplicación funciona completamente en el navegador y guarda la información usando `localStorage`, por lo que no necesita backend.

## Qué incluye

- Calendario mensual con navegación entre meses.
- Selección de día y agenda diaria.
- Creación, edición y eliminación de tareas.
- Drag and drop para mover tareas entre fechas.
- Prioridad y color personalizado por tarea.
- Tareas recurrentes semanales y mensuales.
- Edición de ocurrencias recurrentes.
- Resaltado visual de domingos y feriados de Chile.
- Modal de agenda para pantallas pequeñas.
- Instalación como `PWA`.

## Cómo funciona

La app se organiza en módulos pequeños:

- `index.html`
  Punto de entrada principal.

- `components/`
  Fragmentos HTML que se cargan dinámicamente en la interfaz.

- `assets/js/app/`
  Coordinación general de la aplicación.

- `assets/js/ui/`
  Renderizado del calendario, agenda y modales.

- `assets/js/managers/`
  Gestión de tareas y recurrencias.

- `assets/js/services/`
  Persistencia de datos en `localStorage`.

- `assets/js/utils/`
  Utilidades para fechas, DOM, feriados y normalización de datos.

- `assets/css/`
  Estilos base, calendario, agenda, formularios, modales y responsive.

- `manifest.webmanifest`
  Configuración de instalación PWA.

- `service-worker.js`
  Caché del shell principal para mejorar disponibilidad offline.

## Gestión de tareas

Cada tarea puede incluir:

- título
- fecha
- hora
- prioridad
- color
- descripción
- recurrencia

Las tareas se muestran en el calendario del mes y también en la agenda del día seleccionado.

## Recurrencias

La aplicación soporta dos tipos de recurrencia:

- `Semanal`
- `Mensual`

También permite:

- definir una fecha de término
- editar una ocurrencia individual
- excluir una ocurrencia específica de una serie recurrente

## Almacenamiento

Las tareas se guardan localmente en el navegador mediante `localStorage`.

Clave usada:

```text
monthly-planner-tasks
```

Esto implica que:

- los datos permanecen en el mismo navegador y dispositivo
- no existe sincronización en la nube
- si se limpian los datos del navegador, las tareas se eliminan

## PWA

La aplicación puede instalarse desde navegadores compatibles gracias a:

- `manifest.webmanifest`
- `service-worker.js`
- iconos locales para instalación
- modo `standalone`

El caché incluye los archivos principales de la app para que la interfaz siga siendo usable sin conexión o con conectividad limitada.

## Tecnologías

- `HTML5`
- `CSS3`
- `JavaScript ES Modules`
- `Bootstrap 5.3.7`
- `localStorage`
- `Service Worker`
- `Web App Manifest`
- `GitHub Pages`

## Ejecución local

Como usa módulos ES, carga de componentes y `service worker`, debe ejecutarse con un servidor local.

Ejemplo:

```bash
npx serve .
```

Luego abrir en el navegador una ruta como:

```text
http://localhost:3000
```

## Publicación

El proyecto está publicado en `GitHub Pages` en:

[https://maufuenb.github.io/ABP-modulo-4/](https://maufuenb.github.io/ABP-modulo-4/)

