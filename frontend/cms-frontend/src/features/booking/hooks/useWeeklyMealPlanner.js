import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getActiveCanteens } from '../../dayslot/api/daySlotsApi';
import {
  getWeeklyPublishedMenu,
  createWeeklyBookingBatch,
  cancelBooking,
} from '../api/bookingApi';
import { getServices } from '../../services/api/servicesApi';
import { getMondayDate, formatDateISO } from '../../../utils/date';

const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
export const MAX_WEEKS_AHEAD = 26;

export function useWeeklyMealPlanner() {
  const { customer, user } = useAuth();

  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState('');
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);

  // Default to Next Week if today is Thursday, Friday, or weekend
  const defaultWeekOffset = useMemo(() => {
    const day = new Date().getDay();
    return day >= 4 || day === 0 ? 1 : 0;
  }, []);

  const [weekOffset, setWeekOffset] = useState(defaultWeekOffset);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Dates for Monday through Sunday (Full 7-Day Scope)
  const weekDates = useMemo(() => {
    const monday = getMondayDate(weekOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const dateObj = new Date(monday);
      dateObj.setDate(monday.getDate() + i);
      const isWeekend = i === 5 || i === 6;
      return {
        dayIndex: i,
        dayName: DAY_NAMES[i],
        dateStr: formatDateISO(dateObj),
        displayDate: dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        year: dateObj.getFullYear(),
        isWeekend,
      };
    });
  }, [weekOffset]);

  const startDateStr = weekDates[0]?.dateStr || '';
  const endDateStr = weekDates[6]?.dateStr || '';

  // Menu data from backend
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Item Quantities Map: { [dateStr]: { selected: boolean, quantities: { [dayMenuId]: number } } }
  const [daySelections, setDaySelections] = useState({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelModalData, setCancelModalData] = useState(null); // { bookingId, servName, dateStr }
  const [editModalData, setEditModalData] = useState(null); // { bookingId, bookingNo, serviceId, servName, dateStr, displayDate, availableItems }
  const [actionMessage, setActionMessage] = useState('');

  // Customer type detection
  const customerType = customer?.CTYPECODE || user?.CTYPECODE || 'PRM';
  const isPayrollDeducted = ['PRM', 'PERMEMP', 'OCE', 'OCEEMP'].includes(
    customerType
  );

  // 1. Load active canteens and services on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [canteenData, serviceData] = await Promise.all([
          getActiveCanteens(),
          getServices().catch(() => []),
        ]);
        setCanteens(canteenData || []);
        if (canteenData && canteenData.length > 0) {
          setSelectedCanteen((prev) => prev || canteenData[0].CANTEENID);
        }
        const activeSrvs = (serviceData || []).filter(
          (s) => s.STATUSCODE === 'ACT' || !s.STATUSCODE
        );
        setServices(activeSrvs);
        if (activeSrvs.length > 0) {
          setSelectedServiceId((prev) => prev || activeSrvs[0].SERVICEID);
        }
      } catch (err) {
        console.error('Failed to load initial planner data', err);
      }
    }
    loadInitialData();
  }, []);

  // 1b. Derive list of available services dynamically from services API and menuData
  const availableServices = useMemo(() => {
    const map = new Map();
    (services || []).forEach((s) => {
      if (s.STATUSCODE === 'ACT' || !s.STATUSCODE) {
        map.set(String(s.SERVICEID), {
          SERVICEID: s.SERVICEID,
          SERVNAME: s.SERVNAME,
          SERVCODE: s.SERVCODE,
        });
      }
    });

    if (Array.isArray(menuData?.services)) {
      menuData.services.forEach((s) => {
        const key = String(s.SERVICEID);
        if (!map.has(key)) {
          map.set(key, {
            SERVICEID: s.SERVICEID,
            SERVNAME: s.SERVNAME,
            SERVCODE: s.SERVCODE,
          });
        }
      });
    }

    if (menuData?.daysMap) {
      Object.values(menuData.daysMap).forEach((day) => {
        if (day?.services) {
          Object.values(day.services).forEach((srv) => {
            const key = String(srv.serviceId);
            if (!map.has(key)) {
              map.set(key, {
                SERVICEID: srv.serviceId,
                SERVNAME: srv.servName,
                SERVCODE: srv.servCode,
              });
            }
          });
        }
      });
    }

    return Array.from(map.values());
  }, [services, menuData]);

  // Ensure selectedServiceId is always set to a valid available service
  useEffect(() => {
    if (availableServices.length > 0) {
      const exists = availableServices.some(
        (s) => String(s.SERVICEID) === String(selectedServiceId)
      );
      if (!exists) {
        setSelectedServiceId(availableServices[0].SERVICEID);
      }
    }
  }, [availableServices, selectedServiceId]);

  const activeServiceId =
    selectedServiceId || availableServices[0]?.SERVICEID || null;
  const activeService = availableServices.find(
    (s) => String(s.SERVICEID) === String(activeServiceId)
  );
  const activeServiceName = activeService?.SERVNAME || 'Meal';

  // 2. Fetch published menu for selected week and canteen
  const fetchMenu = useCallback(async () => {
    if (!selectedCanteen || !startDateStr || !endDateStr) return;

    setLoading(true);
    setFetchError('');
    setSubmitSuccess(null);
    setSubmitError('');

    try {
      const data = await getWeeklyPublishedMenu({
        canteenId: selectedCanteen,
        startDate: startDateStr,
        endDate: endDateStr,
      });
      setMenuData(data);
    } catch (err) {
      console.error('Failed to fetch weekly menu', err);
      setFetchError(
        err?.response?.data?.MESSAGE ||
          'Could not load weekly menu. Please try another week or canteen.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCanteen, startDateStr, endDateStr]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Reset to smart defaults: Base meals are pre-checked (qty = 1)
  const resetToSmartDefaults = useCallback(() => {
    if (!menuData || !menuData.daysMap) return;

    const now = new Date();
    const newSelections = {};

    weekDates.forEach(({ dateStr }) => {
      const dayInfo = menuData.daysMap[dateStr];
      const isHoliday = dayInfo?.isHoliday && !dayInfo?.isSpecialHolidayService;

      const quantities = {};
      let hasAnyAvailableDish = false;

      if (dayInfo && dayInfo.services && activeServiceId) {
        const srv = dayInfo.services[activeServiceId];
        if (srv && !srv.existingBooking) {
          (srv.items || []).forEach((item) => {
            const isCutoffPassed = item.BOOKUNTIL
              ? now > new Date(item.BOOKUNTIL)
              : false;
            if (!isHoliday && !isCutoffPassed) {
              if (item.ISBASE === 1) {
                quantities[item.DAYMENUID] = 1;
                hasAnyAvailableDish = true;
              } else {
                quantities[item.DAYMENUID] = 0;
              }
            } else {
              quantities[item.DAYMENUID] = 0;
            }
          });
        }
      }

      newSelections[dateStr] = {
        selected: !isHoliday && hasAnyAvailableDish,
        quantities,
      };
    });

    setDaySelections(newSelections);
  }, [menuData, weekDates, activeServiceId]);

  useEffect(() => {
    resetToSmartDefaults();
  }, [resetToSmartDefaults]);

  // 1-Click Action: Select all base items
  const handleSelectAllBaseMeals = useCallback(() => {
    if (!menuData || !menuData.daysMap) return;

    const now = new Date();
    const newSelections = { ...daySelections };

    weekDates.forEach(({ dateStr }) => {
      const dayInfo = menuData.daysMap[dateStr];
      const isHoliday = dayInfo?.isHoliday && !dayInfo?.isSpecialHolidayService;

      const currentQuantities = {
        ...(newSelections[dateStr]?.quantities || {}),
      };
      let hasAnyBaseDish = false;

      if (dayInfo && dayInfo.services && activeServiceId) {
        const srv = dayInfo.services[activeServiceId];
        if (srv && !srv.existingBooking) {
          (srv.items || []).forEach((item) => {
            const isCutoffPassed = item.BOOKUNTIL
              ? now > new Date(item.BOOKUNTIL)
              : false;
            if (!isHoliday && !isCutoffPassed) {
              if (item.ISBASE === 1) {
                currentQuantities[item.DAYMENUID] = 1;
                hasAnyBaseDish = true;
              }
            }
          });
        }
      }

      newSelections[dateStr] = {
        selected:
          !isHoliday && (hasAnyBaseDish || newSelections[dateStr]?.selected),
        quantities: currentQuantities,
      };
    });

    setDaySelections(newSelections);
    setActionMessage(
      `Selected all Base ${activeServiceName} across available days for the week!`
    );
    setTimeout(() => setActionMessage(''), 3500);
  }, [menuData, weekDates, activeServiceId, daySelections, activeServiceName]);

  // Existing confirmed bookings summary
  const existingBookingsSummary = useMemo(() => {
    if (!menuData?.existingBookings)
      return { count: 0, totalAmount: 0, bookings: [] };
    const validBookings = (menuData.existingBookings || []).filter(
      (b) => b.STATUSCODE !== 'CAN'
    );
    const totalAmount = validBookings.reduce(
      (sum, b) => sum + (Number(b.TOTALAMOUNT) || 0),
      0
    );
    return {
      count: validBookings.length,
      totalAmount,
      bookings: validBookings,
    };
  }, [menuData]);

  // Check if all available days for the currently active service are already booked
  const serviceBookingStatus = useMemo(() => {
    if (!menuData?.daysMap || !activeServiceId) {
      return { totalServiceDays: 0, bookedDays: 0, allBooked: false };
    }
    let totalServiceDays = 0;
    let bookedDays = 0;

    weekDates.forEach(({ dateStr }) => {
      const day = menuData.daysMap[dateStr];
      if (day && !day.isHoliday && day.services?.[activeServiceId]) {
        const srv = day.services[activeServiceId];
        if (srv.items && srv.items.length > 0) {
          totalServiceDays += 1;
          if (srv.existingBooking) {
            bookedDays += 1;
          }
        }
      }
    });

    const allBooked = totalServiceDays > 0 && bookedDays === totalServiceDays;
    return { totalServiceDays, bookedDays, allBooked };
  }, [menuData, activeServiceId, weekDates]);

  // Toggle entire day on / off
  const toggleDaySelection = (dateStr) => {
    setDaySelections((prev) => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        selected: !prev[dateStr]?.selected,
      },
    }));
  };

  // Toggle dish checked / unchecked
  const toggleItem = (dateStr, dayMenuId) => {
    setDaySelections((prev) => {
      const day = prev[dateStr] || { selected: true, quantities: {} };
      const currentQty = day.quantities?.[dayMenuId] || 0;
      const nextQty = currentQty > 0 ? 0 : 1;

      return {
        ...prev,
        [dateStr]: {
          ...day,
          quantities: {
            ...day.quantities,
            [dayMenuId]: nextQty,
          },
        },
      };
    });
  };

  // Stepper quantity update
  const updateItemQty = (dateStr, dayMenuId, delta, maxQty = 1) => {
    setDaySelections((prev) => {
      const day = prev[dateStr];
      if (!day) return prev;
      const currentQty = day.quantities?.[dayMenuId] || 0;
      const newQty = Math.max(1, Math.min(maxQty, currentQty + delta));

      return {
        ...prev,
        [dateStr]: {
          ...day,
          quantities: {
            ...day.quantities,
            [dayMenuId]: newQty,
          },
        },
      };
    });
  };

  // Real-time summary calculation
  const summary = useMemo(() => {
    if (!menuData || !menuData.daysMap) {
      return { totalDays: 0, totalMeals: 0, totalAmount: 0, breakdown: [] };
    }

    let totalDays = 0;
    let totalMeals = 0;
    let totalAmount = 0;
    const breakdown = [];

    weekDates.forEach(({ dateStr, dayName, displayDate }) => {
      const daySelection = daySelections[dateStr];
      if (!daySelection || !daySelection.selected) return;

      const dayInfo = menuData.daysMap[dateStr];
      if (!dayInfo || dayInfo.isHoliday) return;

      let dayTotal = 0;
      let dayItemsCount = 0;
      const dayLines = [];

      const servicesToCheck = Object.values(dayInfo.services || {}).filter(
        (srv) =>
          !activeServiceId || String(srv.serviceId) === String(activeServiceId)
      );

      servicesToCheck.forEach((srv) => {
        if (srv.existingBooking) return;

        (srv.items || []).forEach((item) => {
          const qty = daySelection.quantities?.[item.DAYMENUID] || 0;
          if (qty > 0) {
            const price = Number(item.DISPLAYPRICE) || 0;
            const lineTotal = price * qty;
            dayTotal += lineTotal;
            dayItemsCount += qty;
            dayLines.push({
              name: `${item.ITEMNAME}${qty > 1 ? ` (x${qty})` : ''}`,
              serviceName: srv.servName,
              price: lineTotal,
            });
          }
        });
      });

      if (dayLines.length > 0) {
        totalDays += 1;
        totalMeals += dayItemsCount;
        totalAmount += dayTotal;
        breakdown.push({
          dateStr,
          dayName,
          displayDate,
          dayTotal,
          lines: dayLines,
        });
      }
    });

    return { totalDays, totalMeals, totalAmount, breakdown };
  }, [menuData, weekDates, daySelections, activeServiceId]);

  // Cancel meal action
  const confirmCancelMeal = async () => {
    if (!cancelModalData) return;
    const { bookingId, servName, dateStr } = cancelModalData;

    setCancellingBookingId(bookingId);
    setSubmitError('');
    try {
      await cancelBooking(bookingId, {
        cancelReason: 'Employee cancelled meal from weekly meal planner',
      });
      setActionMessage(`Successfully cancelled ${servName} booking for ${dateStr}`);
      setTimeout(() => setActionMessage(''), 4000);
      setCancelModalData(null);
      await fetchMenu();
    } catch (err) {
      setSubmitError(
        err?.response?.data?.MESSAGE ||
          err?.response?.data?.message ||
          err.message ||
          'Failed to cancel meal booking'
      );
    } finally {
      setCancellingBookingId(null);
    }
  };

  // Submit batch weekly booking
  const handleConfirmWeeklyBooking = async () => {
    if (summary.totalDays === 0 || summary.totalMeals === 0) {
      setSubmitError('Please select at least one meal to book.');
      return;
    }

    if (!customer?.CUSTOMERID) {
      setSubmitError('Customer account not found. Please re-login.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(null);

    const bookingsPayload = [];

    weekDates.forEach(({ dateStr }) => {
      const daySelect = daySelections[dateStr];
      if (!daySelect || !daySelect.selected) return;

      const dayInfo = menuData?.daysMap?.[dateStr];
      if (!dayInfo || dayInfo.isHoliday) return;

      const servicesToBook = Object.values(dayInfo.services || {}).filter(
        (srv) =>
          !activeServiceId || String(srv.serviceId) === String(activeServiceId)
      );

      servicesToBook.forEach((srv) => {
        if (srv.existingBooking) return;

        const itemsForService = [];
        (srv.items || []).forEach((item) => {
          const qty = daySelect.quantities?.[item.DAYMENUID] || 0;
          if (qty > 0) {
            itemsForService.push({
              DAYMENUID: item.DAYMENUID,
              QTY: qty,
            });
          }
        });

        if (itemsForService.length > 0) {
          bookingsPayload.push({
            SERVICEDATE: dateStr,
            SERVICEID: srv.serviceId,
            ITEMS: itemsForService,
          });
        }
      });
    });

    try {
      const res = await createWeeklyBookingBatch({
        PBOOKTYPECODE: 'PB',
        PCUSTOMERID: customer.CUSTOMERID,
        PBOOKINGSJSON: bookingsPayload,
        PREMARKS: `7-Day Weekly ${activeServiceName} Pass (${startDateStr} to ${endDateStr})`,
      });

      setSubmitSuccess({
        message: `Successfully booked ${bookingsPayload.length} daily meal sessions!`,
        bookings: res || [],
        totalAmount: summary.totalAmount,
      });

      await fetchMenu();
    } catch (err) {
      console.error('Weekly booking error:', err);
      setSubmitError(
        err?.response?.data?.MESSAGE ||
          'Failed to place weekly booking. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    canteens,
    selectedCanteen,
    setSelectedCanteen,
    services,
    availableServices,
    selectedServiceId,
    setSelectedServiceId,
    activeServiceId,
    activeServiceName,
    weekOffset,
    setWeekOffset,
    weekDates,
    startDateStr,
    endDateStr,
    menuData,
    loading,
    fetchError,
    daySelections,
    toggleDaySelection,
    toggleItem,
    updateItemQty,
    resetToSmartDefaults,
    handleSelectAllBaseMeals,
    summary,
    existingBookingsSummary,
    serviceBookingStatus,
    isDrawerOpen,
    setIsDrawerOpen,
    isSubmitting,
    submitSuccess,
    submitError,
    actionMessage,
    cancellingBookingId,
    cancelModalData,
    setCancelModalData,
    confirmCancelMeal,
    editModalData,
    setEditModalData,
    fetchMenu,
    handleConfirmWeeklyBooking,
    isPayrollDeducted,
  };
}

export default useWeeklyMealPlanner;
