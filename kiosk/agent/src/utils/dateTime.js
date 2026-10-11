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
 * Converts any date format into MySQL/SQLite DATETIME string 'YYYY-MM-DD HH:MM:SS' in exact IST (+05:30).
 */
export const toDateTimeIST = (input) => {
  if (!input) return null;

  if (typeof input === "string") {
    const trimmed = input.trim();

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(trimmed)) {
      return `${trimmed}:00`;
    }
    if (trimmed.includes("Z") || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      return dayjs(trimmed).tz(TIMEZONE_IST).format("YYYY-MM-DD HH:mm:ss");
    }
    if (trimmed.includes("T")) {
      const clean = trimmed.replace("T", " ").replace(/\.\d+/, "");
      return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(clean) ? `${clean}:00` : clean;
    }
  }

  return dayjs(input).tz(TIMEZONE_IST).format("YYYY-MM-DD HH:mm:ss");
};

/**
 * Converts any date input to DATE string 'YYYY-MM-DD' in IST.
 */
export const toDateIST = (input) => {
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
