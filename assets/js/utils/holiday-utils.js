const pad = (value) => String(value).padStart(2, "0");

const toISODate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const getEasterSunday = (year) => {
  const goldenNumber = year % 19;
  const century = Math.floor(year / 100);
  const skippedLeapYears = Math.floor(century / 4);
  const centuryRemainder = century % 4;
  const correction = Math.floor((century + 8) / 25);
  const moonCorrection = Math.floor((century - correction + 1) / 3);
  const epact = (19 * goldenNumber + century - skippedLeapYears - moonCorrection + 15) % 30;
  const leapRemainder = Math.floor((year % 100) / 4);
  const yearRemainder = (year % 100) % 4;
  const weekdayCorrection = (32 + 2 * centuryRemainder + 2 * leapRemainder - epact - yearRemainder) % 7;
  const monthOffset = Math.floor((goldenNumber + 11 * epact + 22 * weekdayCorrection) / 451);
  const month = Math.floor((epact + weekdayCorrection - 7 * monthOffset + 114) / 31);
  const day = ((epact + weekdayCorrection - 7 * monthOffset + 114) % 31) + 1;

  return new Date(year, month - 1, day);
};

const getChileHolidaysForYear = (year) => {
  const easterSunday = getEasterSunday(year);
  const goodFriday = toISODate(addDays(easterSunday, -2));
  const holySaturday = toISODate(addDays(easterSunday, -1));

  return new Map([
    [`${year}-01-01`, "Año Nuevo"],
    [goodFriday, "Viernes Santo"],
    [holySaturday, "Sábado Santo"],
    [`${year}-05-01`, "Día del Trabajo"],
    [`${year}-05-21`, "Glorias Navales"],
    [`${year}-06-21`, "Pueblos Indígenas"],
    [`${year}-06-29`, "San Pedro y San Pablo"],
    [`${year}-07-16`, "Virgen del Carmen"],
    [`${year}-08-15`, "Asunción de la Virgen"],
    [`${year}-09-18`, "Independencia Nacional"],
    [`${year}-09-19`, "Glorias del Ejército"],
    [`${year}-10-12`, "Encuentro de Dos Mundos"],
    [`${year}-10-31`, "Iglesias Evangélicas"],
    [`${year}-11-01`, "Todos los Santos"],
    [`${year}-12-08`, "Inmaculada Concepción"],
    [`${year}-12-25`, "Navidad"],
  ]);
};

const holidayCache = new Map();

export const getChileHoliday = (date) => {
  const year = date.getFullYear();

  if (!holidayCache.has(year)) {
    holidayCache.set(year, getChileHolidaysForYear(year));
  }

  return holidayCache.get(year).get(toISODate(date)) || "";
};

export const isSunday = (date) => date.getDay() === 0;
