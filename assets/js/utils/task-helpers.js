export const DEFAULT_TASK_COLOR = "#ffb44c";

export const sortTasksByTime = (tasks) =>
  [...tasks].sort((first, second) => (first.time || "23:59").localeCompare(second.time || "23:59"));

const pad = (value) => String(value).padStart(2, "0");

const toISODate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fromISODate = (dateISO) => {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const getWeekdayIndex = (date) => (date.getDay() + 6) % 7;

const getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

const normalizeHexColor = (value) => {
  if (typeof value !== "string") {
    return DEFAULT_TASK_COLOR;
  }

  const normalized = value.trim();
  return /^#[\da-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : DEFAULT_TASK_COLOR;
};

const normalizeNumericList = (values, min, max) =>
  [...new Set((Array.isArray(values) ? values : []).map(Number).filter((value) => value >= min && value <= max))]
    .sort((first, second) => first - second);

export const normalizeTaskData = (taskData) => {
  const recurrenceType = taskData.recurrenceType || "none";
  const recurrenceUntil =
    recurrenceType !== "none" && taskData.recurrenceUntil && taskData.recurrenceUntil >= taskData.date
      ? taskData.recurrenceUntil
      : "";

  return {
    title: taskData.title,
    date: taskData.date,
    time: taskData.time,
    priority: taskData.priority,
    description: taskData.description,
    color: normalizeHexColor(taskData.color),
    recurrenceType,
    recurrenceWeekdays:
      recurrenceType === "weekly" ? normalizeNumericList(taskData.recurrenceWeekdays, 0, 6) : [],
    recurrenceMonths:
      recurrenceType === "monthly" ? normalizeNumericList(taskData.recurrenceMonths, 1, 12) : [],
    recurrenceUntil,
  };
};

export const buildTasksByDateMap = (tasks) =>
  tasks.reduce((accumulator, task) => {
    if (!accumulator.has(task.date)) {
      accumulator.set(task.date, []);
    }

    accumulator.get(task.date).push(task);
    return accumulator;
  }, new Map());

const buildOccurrence = (task, dateISO) => ({
  ...task,
  id: `${task.id}::${dateISO}`,
  sourceTaskId: task.id,
  date: dateISO,
  originalDate: task.date,
  isRecurringOccurrence: task.recurrenceType !== "none",
});

const expandWeeklyTask = (task, rangeStart, rangeEnd) => {
  const selectedWeekdays = task.recurrenceWeekdays.length
    ? task.recurrenceWeekdays
    : [getWeekdayIndex(fromISODate(task.date))];
  const startDate = fromISODate(task.date);
  const endLimit = task.recurrenceUntil ? fromISODate(task.recurrenceUntil) : null;
  const effectiveStart = rangeStart > startDate ? rangeStart : startDate;
  const effectiveEnd = endLimit && endLimit < rangeEnd ? endLimit : rangeEnd;
  const occurrences = [];

  for (let cursor = new Date(effectiveStart); cursor <= effectiveEnd; cursor = addDays(cursor, 1)) {
    if (selectedWeekdays.includes(getWeekdayIndex(cursor))) {
      occurrences.push(buildOccurrence(task, toISODate(cursor)));
    }
  }

  return occurrences;
};

const expandMonthlyTask = (task, rangeStart, rangeEnd) => {
  const startDate = fromISODate(task.date);
  const endLimit = task.recurrenceUntil ? fromISODate(task.recurrenceUntil) : null;
  const effectiveEnd = endLimit && endLimit < rangeEnd ? endLimit : rangeEnd;
  const targetMonths = task.recurrenceMonths.length ? task.recurrenceMonths : [startDate.getMonth() + 1];
  const targetDay = startDate.getDate();
  const occurrences = [];
  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);

  while (cursor <= effectiveEnd) {
    const monthNumber = cursor.getMonth() + 1;

    if (targetMonths.includes(monthNumber)) {
      const safeDay = Math.min(targetDay, getDaysInMonth(cursor.getFullYear(), cursor.getMonth()));
      const occurrenceDate = new Date(cursor.getFullYear(), cursor.getMonth(), safeDay);

      if (occurrenceDate >= startDate && occurrenceDate >= rangeStart && occurrenceDate <= effectiveEnd) {
        occurrences.push(buildOccurrence(task, toISODate(occurrenceDate)));
      }
    }

    cursor.setMonth(cursor.getMonth() + 1, 1);
  }

  return occurrences;
};

export const expandTasksInRange = (tasks, startISO, endISO) => {
  const rangeStart = fromISODate(startISO);
  const rangeEnd = fromISODate(endISO);

  return tasks.flatMap((task) => {
    if (!task.recurrenceType || task.recurrenceType === "none") {
      return task.date >= startISO && task.date <= endISO
        ? [{ ...task, sourceTaskId: task.id, isRecurringOccurrence: false }]
        : [];
    }

    if (task.recurrenceType === "weekly") {
      return expandWeeklyTask(task, rangeStart, rangeEnd);
    }

    if (task.recurrenceType === "monthly") {
      return expandMonthlyTask(task, rangeStart, rangeEnd);
    }

    return [];
  });
};

export const getTaskColorStyle = (task) => {
  const color = normalizeHexColor(task.color);
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);

  return `--task-color-rgb: ${red}, ${green}, ${blue}; --task-color-solid: ${color};`;
};
