import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export const TIMEZONE_IST = "Asia/Kolkata";

/**
 * Returns current dayjs instance in Indian Standard Time (IST).
 */
export const getNowIST = () => {
  return dayjs().tz(TIMEZONE_IST);
};

/**
 * Returns current calendar date in IST formatted as 'YYYY-MM-DD'.
 * Guaranteed not to lag behind between midnight and 05:30 AM.
 */
export const getTodayIST = () => {
  return dayjs().tz(TIMEZONE_IST).format("YYYY-MM-DD");
};

/**
 * Returns tomorrow's calendar date in IST formatted as 'YYYY-MM-DD'.
 */
export const getTomorrowIST = () => {
  return dayjs().tz(TIMEZONE_IST).add(1, "day").format("YYYY-MM-DD");
};

/**
 * Returns current calendar year in IST (e.g. 2026).
 */
export const getCurrentYearIST = () => {
  return dayjs().tz(TIMEZONE_IST).year();
};

/**
 * Converts any date format (ISO UTC string with Z, offset, local string, Date object)
 * into MySQL DATETIME string 'YYYY-MM-DD HH:MM:SS' in exact IST (+05:30).
 *
 * Example:
 *   toMySQLDateTime("2026-09-17T02:30:00.000Z") -> "2026-09-17 08:00:00"
 *   toMySQLDateTime("2026-09-17 08:00:00")       -> "2026-09-17 08:00:00"
 */
export const toMySQLDateTime = (input) => {
  if (!input) return null;

  if (typeof input === "string") {
    const trimmed = input.trim();

    // Already in exact YYYY-MM-DD HH:mm:ss format
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    // YYYY-MM-DD HH:mm
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(trimmed)) {
      return `${trimmed}:00`;
    }

    // Explicit UTC string or string with offset (e.g. 2026-09-17T02:30:00.000Z)
    if (trimmed.includes("Z") || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      return dayjs(trimmed).tz(TIMEZONE_IST).format("YYYY-MM-DD HH:mm:ss");
    }

    // Local ISO string without timezone offset (e.g. 2026-09-17T08:00:00)
    if (trimmed.includes("T")) {
      const clean = trimmed.replace("T", " ").replace(/\.\d+/, "");
      return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(clean) ? `${clean}:00` : clean;
    }
  }

  // Fallback for Date instances or numeric timestamps
  return dayjs(input).tz(TIMEZONE_IST).format("YYYY-MM-DD HH:mm:ss");
};

/**
 * Converts any date input to MySQL DATE string 'YYYY-MM-DD' in IST.
 */
export const toMySQLDate = (input) => {
  if (!input) return null;

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.includes("Z") || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      return dayjs(trimmed).tz(TIMEZONE_IST).format("YYYY-MM-DD");
    }
    return trimmed.slice(0, 10);
  }

  return dayjs(input).tz(TIMEZONE_IST).format("YYYY-MM-DD");
};

/**
 * Checks whether current IST time is strictly past the given cutoff deadline.
 * Handles both MySQL DATETIME strings (already in IST) and UTC ISO strings.
 */
export const isPastCutoff = (cutoffStr) => {
  if (!cutoffStr) return false;

  const now = dayjs().tz(TIMEZONE_IST);
  let cutoff;

  if (typeof cutoffStr === "string") {
    const trimmed = cutoffStr.trim();
    if (trimmed.includes("Z") || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      cutoff = dayjs(trimmed).tz(TIMEZONE_IST);
    } else {
      cutoff = dayjs.tz(trimmed, TIMEZONE_IST);
    }
  } else {
    cutoff = dayjs(cutoffStr).tz(TIMEZONE_IST);
  }

  return now.isAfter(cutoff);
};

/**
 * Returns date range boundaries for a calendar month in IST.
 *
 * @param {number|string} [year] - e.g. 2026
 * @param {number|string} [month] - 1-12
 * @returns {{ startDate: string, endDate: string, targetYear: number, targetMonth: number }}
 */
export const getMonthDateRange = (year, month) => {
  const now = dayjs().tz(TIMEZONE_IST);
  const targetYear = year ? parseInt(year, 10) : now.year();
  const targetMonth = month ? parseInt(month, 10) : now.month() + 1;

  const start = dayjs.tz(`${targetYear}-${String(targetMonth).padStart(2, "0")}-01`, TIMEZONE_IST);
  const startDate = start.format("YYYY-MM-DD");
  const endDate = start.endOf("month").format("YYYY-MM-DD");

  return {
    startDate,
    endDate,
    targetYear,
    targetMonth,
  };
};

/**
 * Adds N calendar days to an IST date string ('YYYY-MM-DD') without timezone drift.
 */
export const addDaysIST = (dateStr, days) => {
  return dayjs.tz(dateStr, TIMEZONE_IST).add(days, "day").format("YYYY-MM-DD");
};
