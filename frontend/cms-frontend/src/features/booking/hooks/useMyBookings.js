import { useState, useEffect, useCallback, useMemo } from "react";
import { getBookings, getBooking } from "../api/bookingApi";
import { useAuth } from "../../../hooks/useAuth";

export const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Custom hook to manage booking history data, view switching (table/calendar),
 * pagination, search/filtering, and detail fetching.
 */
export function useMyBookings() {
  const { user, customer } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View mode: "table" | "calendar"
  const [viewMode, setViewMode] = useState("table");

  // Table filters & pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, CRT, SRV, CAN
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [serverPagination, setServerPagination] = useState({
    totalRows: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
  });

  // Calendar month state (defaults to current month)
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Detail Modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedDayBookings, setSelectedDayBookings] = useState(null); // { dateStr, bookings: [] }
  const [loadingDayDetails, setLoadingDayDetails] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!customer?.CUSTOMERID) {
        setBookings([]);
        setLoading(false);
        return;
      }

      if (viewMode === "table") {
        const params = {
          customerId: customer?.CUSTOMERID,
          page: currentPage,
          pageSize,
          status: statusFilter === "ALL" ? null : statusFilter,
        };
        const res = await getBookings(params);
        const formatted = (res || []).map((row) => ({
          HEADER: row,
          ITEMS: null,
        }));
        setBookings(formatted);
        if (res?.pagination) {
          setServerPagination(res.pagination);
        } else {
          setServerPagination({
            totalRows: formatted.length,
            totalPages: Math.max(1, Math.ceil(formatted.length / pageSize)),
            currentPage,
            pageSize,
          });
        }
      } else {
        // Calendar view: scoped to current calendar month
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

        const res = await getBookings({
          customerId: customer?.CUSTOMERID,
          startDate,
          endDate,
        });
        const formatted = (res || []).map((row) => ({
          HEADER: row,
          ITEMS: null,
        }));
        setBookings(formatted);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.MESSAGE || "Failed to load booking history.");
    } finally {
      setLoading(false);
    }
  }, [customer?.CUSTOMERID, viewMode, currentPage, statusFilter, currentCalendarDate, pageSize]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleViewBooking = async (b) => {
    if (b.ITEMS && b.ITEMS.length > 0) {
      setSelectedBooking(b);
      return;
    }
    setSelectedBooking({ ...b, loadingDetails: true });
    try {
      const detail = await getBooking(b.HEADER.BOOKID);
      setSelectedBooking(detail);
    } catch {
      setSelectedBooking({ ...b, loadingDetails: false, detailError: "Failed to load meal items" });
    }
  };

  const handleSelectDay = async (dateStr, dayBookings) => {
    if (!dayBookings || dayBookings.length === 0) return;
    setSelectedDayBookings({ dateStr, bookings: dayBookings });

    const needsFetch = dayBookings.some((b) => !b.ITEMS);
    if (needsFetch) {
      setLoadingDayDetails(true);
      try {
        const detailed = await Promise.all(
          dayBookings.map(async (b) => {
            if (b.ITEMS) return b;
            try {
              return await getBooking(b.HEADER.BOOKID);
            } catch {
              return b;
            }
          })
        );
        setSelectedDayBookings({ dateStr, bookings: detailed });
      } finally {
        setLoadingDayDetails(false);
      }
    }
  };

  // Filtered Bookings for Table View
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const header = b?.HEADER || {};
      const status = header.STATUSCODE || header.STATUS;
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (header.BOOKNO && header.BOOKNO.toLowerCase().includes(q)) ||
        (header.CANTEENNAME && header.CANTEENNAME.toLowerCase().includes(q)) ||
        (header.SERVNAME && header.SERVNAME.toLowerCase().includes(q)) ||
        (header.SERVICEDATE && header.SERVICEDATE.includes(q));

      return matchesStatus && matchesQuery;
    });
  }, [bookings, statusFilter, searchQuery]);

  // Calendar calculations
  const calendarYear = currentCalendarDate.getFullYear();
  const calendarMonth = currentCalendarDate.getMonth(); // 0-indexed

  const monthName = currentCalendarDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    setCurrentCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  const setToday = () => {
    setCurrentCalendarDate(new Date());
  };

  // Map of bookings indexed by 'YYYY-MM-DD'
  const bookingsByDate = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const dateStr = (b?.HEADER?.SERVICEDATE || "").substring(0, 10);
      if (!dateStr) return;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(b);
    });
    return map;
  }, [bookings]);

  // Monthly metrics for the currently viewed calendar month
  const monthlyMetrics = useMemo(() => {
    let spend = 0;
    let totalMeals = 0;
    let servedCount = 0;
    let cancelledCount = 0;

    bookings.forEach((b) => {
      const dateStr = (b?.HEADER?.SERVICEDATE || "").substring(0, 10);
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) {
        const status = b.HEADER.STATUSCODE || b.HEADER.STATUS;
        if (status !== "CAN") {
          spend += parseFloat(b.HEADER.TOTALAMOUNT) || 0;
          totalMeals += b.ITEMS?.length || 1;
        }
        if (status === "SRV") servedCount += 1;
        if (status === "CAN") cancelledCount += 1;
      }
    });

    return { spend, totalMeals, servedCount, cancelledCount };
  }, [bookings, calendarYear, calendarMonth]);

  // Generate Calendar Days Grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const days = [];
    // Padding from previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, isCurrentMonth: false, dateStr: null });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({
        dayNumber: day,
        isCurrentMonth: true,
        dateStr,
        dayBookings: bookingsByDate[dateStr] || [],
      });
    }

    return days;
  }, [calendarYear, calendarMonth, bookingsByDate]);

  return {
    user,
    customer,
    bookings,
    loading,
    error,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    serverPagination,
    filteredBookings,
    currentCalendarDate,
    setCurrentCalendarDate,
    monthName,
    prevMonth,
    nextMonth,
    setToday,
    monthlyMetrics,
    calendarDays,
    selectedBooking,
    setSelectedBooking,
    selectedDayBookings,
    setSelectedDayBookings,
    loadingDayDetails,
    handleViewBooking,
    handleSelectDay,
  };
}
