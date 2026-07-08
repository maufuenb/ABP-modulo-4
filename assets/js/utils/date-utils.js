const formatterCache = new Map();

const pad = (value) => String(value).padStart(2, "0");

export const toISODate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const toMonthValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

export const fromMonthValue = (monthValue) => {
  const [year, month] = monthValue.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

export const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export const formatDate = (date, options) => {
  const key = JSON.stringify(options);
  if (!formatterCache.has(key)) {
    formatterCache.set(key, new Intl.DateTimeFormat("es-CL", options));
  }
  return formatterCache.get(key).format(date);
};

export const getMonthName = (date) => formatDate(date, { month: "long", year: "numeric" });

export const getWeekdayNames = () => {
  const baseDate = new Date(2026, 0, 5);
  return Array.from({ length: 7 }, (_, index) =>
    formatDate(addDays(baseDate, index), { weekday: "long" })
  );
};

export const getCalendarDays = (activeMonth) => {
  const firstDayOfMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0);
  const firstWeekdayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const totalVisibleCells = Math.ceil((firstWeekdayIndex + lastDayOfMonth.getDate()) / 7) * 7;
  const startDate = addDays(firstDayOfMonth, -firstWeekdayIndex);

  return Array.from({ length: totalVisibleCells }, (_, index) => {
    const date = addDays(startDate, index);
    return {
      date,
      iso: toISODate(date),
      isCurrentMonth: date.getMonth() === activeMonth.getMonth(),
      isToday: toISODate(date) === toISODate(new Date()),
    };
  });
};
