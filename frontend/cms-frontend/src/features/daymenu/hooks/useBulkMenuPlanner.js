import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useBulkMenu } from '../hooks/useBulkMenu';
import { getActiveCanteens, getDaySlots } from '../../dayslot/api/daySlotsApi';
import { getDayMenuWorkspace } from '../api/daymenuApi';
import { getServices } from '../../services/api/servicesApi';
import { getMenuItems } from '../../menu/api/menuApi';
import { holidayApi } from '../../holidays/api/holidayApi';
import { getMonday, addDays } from '../../../utils/date';

export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_FULL = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function formatLocalISO(servDate, startTime, offsetHours = 1) {
  if (!servDate || !startTime) return '';
  const [y, m, d] = servDate.split('-').map(Number);
  const timeParts = startTime.split(':').map(Number);
  const hours = (timeParts[0] || 0) - offsetHours;
  const minutes = timeParts[1] || 0;
  const dt = new Date(y, m - 1, d, hours, minutes, 0);
  return dt.toISOString();
}

export function defaultBookUntil(servDate, startTime) {
  return formatLocalISO(servDate, startTime, 1);
}

export function defaultCancelUntil(servDate, startTime) {
  return formatLocalISO(servDate, startTime, 1);
}

export function makeDefaultItemConfig(menuItemId, servDate, startTime) {
  return {
    MENUITEMID: menuItemId,
    ISBASE: 1,
    ISSPECIAL: 0,
    ISPREBOOK: 1,
    ISKIOSK: 1,
    MAXQTY: 1,
    AVAILQTY: null,
    BOOKUNTIL:
      servDate && startTime ? defaultBookUntil(servDate, startTime) : '',
    CANCELUNTIL:
      servDate && startTime ? defaultCancelUntil(servDate, startTime) : '',
  };
}

export function buildEmptyWeek() {
  return Array.from({ length: 7 }, () => ({}));
}

export function useBulkMenuPlanner() {
  const { user, activeCanteenId } = useAuth();
  const { loading, error, results, submitBulkMenu, reset } = useBulkMenu();

  // Reference data
  const [canteens, setCanteens] = useState([]);
  const [services, setServices] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Context form
  const [canteenId, setCanteenId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');

  // Auto-sync default canteen from activeCanteenId
  useEffect(() => {
    if (activeCanteenId && !canteenId) {
      setCanteenId(String(activeCanteenId));
    }
  }, [activeCanteenId, canteenId]);

  // Per-day item state: array of 7 objects { [MENUITEMID]: config }
  const [weekItems, setWeekItems] = useState(buildEmptyWeek);

  // Granular per-day holiday override toggles (all 7 days)
  const [holidayOverrides, setHolidayOverrides] = useState({
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  });

  // Published / locked state per day: { [dayIndex]: { daySlotId, slotNo, isPublished, itemCount } }
  const [publishedDays, setPublishedDays] = useState({});
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [successToast, setSuccessToast] = useState(null);

  // UI state
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [itemSearch, setItemSearch] = useState('');
  const [showCopyModal, setShowCopyModal] = useState(false);

  const handleServiceChange = (e) => {
    const nextServiceId = e.target.value;
    setServiceId(nextServiceId);
    if (nextServiceId) {
      const match = services.find(
        (s) => String(s.SERVICEID) === String(nextServiceId)
      );
      if (match) {
        if (match.DEFSTART) setStartTime(match.DEFSTART.slice(0, 5));
        if (match.DEFEND) setEndTime(match.DEFEND.slice(0, 5));
      }
    }
  };

  // Load reference data
  useEffect(() => {
    async function load() {
      setDataLoading(true);
      try {
        const [canteenData, serviceData, itemData, holidayData] =
          await Promise.all([
            getActiveCanteens(),
            getServices(),
            getMenuItems(),
            holidayApi
              .getHolidays({ year: new Date().getFullYear() })
              .catch(() => ({ data: [] })),
          ]);
        const userCanteenIds = (user?.CANTEENROLES || []).map(
          (r) => r.CANTEENID
        );
        const hasAdmin = (user?.SYSTEMROLES || []).includes('SYSADM');
        const filtered = hasAdmin
          ? canteenData || []
          : (canteenData || []).filter((c) =>
              userCanteenIds.includes(c.CANTEENID)
            );
        setCanteens(filtered);
        setServices((serviceData || []).filter((s) => s.STATUSCODE === 'ACT'));
        setMenuItems((itemData || []).filter((m) => m.STATUSCODE === 'ACT'));
        const hList =
          holidayData?.data?.DATA ||
          holidayData?.data ||
          holidayData?.DATA ||
          [];
        setHolidays(Array.isArray(hList) ? hList : []);
      } catch (e) {
        console.error('Failed to load reference data', e);
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [user]);

  // Derived weekDates (Mon - Sun)
  const weekDates = useMemo(
    () =>
      startDate
        ? Array.from({ length: 7 }, (_, i) => addDays(startDate, i))
        : [],
    [startDate]
  );

  const holidayMap = useMemo(() => {
    const map = {};
    holidays.forEach((h) => {
      if (h.HOLIDAYDATE) {
        const dateStr =
          typeof h.HOLIDAYDATE === 'string' ? h.HOLIDAYDATE.slice(0, 10) : '';
        if (dateStr) map[dateStr] = h.HOLIDAYNAME;
      }
    });
    return map;
  }, [holidays]);

  // Auto-load existing slots and menus when week is selected
  useEffect(() => {
    if (!canteenId || !serviceId || !startDate || weekDates.length !== 7) {
      setPublishedDays({});
      return;
    }

    let isCancelled = false;
    async function fetchWeekData() {
      setLoadingExisting(true);
      try {
        const slots = await getDaySlots({
          canteenId: Number(canteenId),
          serviceId: Number(serviceId),
          dateFrom: weekDates[0],
          dateTo: weekDates[6],
        });

        if (isCancelled) return;

        const loadedWeekItems = buildEmptyWeek();
        const loadedPublishedDays = {};

        if (Array.isArray(slots) && slots.length > 0) {
          await Promise.all(
            slots.map(async (slot) => {
              const slotDate =
                typeof slot.SERVDATE === 'string'
                  ? slot.SERVDATE.slice(0, 10)
                  : '';
              const dayIdx = weekDates.indexOf(slotDate);
              if (dayIdx === -1) return;

              if (slot.STARTTIME) {
                setStartTime(slot.STARTTIME.slice(0, 5));
                if (slot.ENDTIME) setEndTime(slot.ENDTIME.slice(0, 5));
              }

              try {
                const workspaceItems = await getDayMenuWorkspace(
                  slot.DAYSLOTID
                );
                if (
                  Array.isArray(workspaceItems) &&
                  workspaceItems.length > 0
                ) {
                  const dayMap = {};
                  workspaceItems.forEach((item) => {
                    dayMap[item.MENUITEMID] = {
                      MENUITEMID: item.MENUITEMID,
                      ISBASE: item.ISBASE ?? 1,
                      ISSPECIAL: item.ISSPECIAL ?? 0,
                      ISPREBOOK: item.ISPREBOOK ?? 1,
                      ISKIOSK: item.ISKIOSK ?? 1,
                      MAXQTY: item.MAXQTY ?? 1,
                      AVAILQTY: item.AVAILQTY ?? null,
                      BOOKUNTIL: item.BOOKUNTIL ?? '',
                      CANCELUNTIL: item.CANCELUNTIL ?? '',
                    };
                  });
                  loadedWeekItems[dayIdx] = dayMap;
                  loadedPublishedDays[dayIdx] = {
                    daySlotId: slot.DAYSLOTID,
                    slotNo: slot.SLOTNO,
                    isPublished: true,
                    itemCount: workspaceItems.length,
                  };
                }
              } catch (err) {
                console.error(
                  `Failed to load workspace for slot ${slot.DAYSLOTID}`,
                  err
                );
              }
            })
          );
        }

        if (!isCancelled) {
          setWeekItems(loadedWeekItems);
          setPublishedDays(loadedPublishedDays);
        }
      } catch (err) {
        console.error('Failed to load existing week data', err);
      } finally {
        if (!isCancelled) setLoadingExisting(false);
      }
    }

    fetchWeekData();
    return () => {
      isCancelled = true;
    };
  }, [canteenId, serviceId, startDate, reloadCounter]);

  const activeDayMap = weekItems[activeDayIndex] || {};
  const selectedIds = Object.keys(activeDayMap).map(Number);

  const filteredCatalog = useMemo(() => {
    const q = itemSearch.toLowerCase();
    return menuItems.filter(
      (m) =>
        !activeDayMap[m.MENUITEMID] &&
        (m.ITEMNAME?.toLowerCase().includes(q) ||
          m.MENUCODE?.toLowerCase().includes(q))
    );
  }, [menuItems, activeDayMap, itemSearch]);

  const selectedItemsList = menuItems.filter(
    (m) => !!activeDayMap[m.MENUITEMID]
  );
  const daySummary = weekItems.map((dayMap) => Object.keys(dayMap).length);

  const addItem = useCallback(
    (menuItem) => {
      if (publishedDays[activeDayIndex]) return;
      const servDate = weekDates[activeDayIndex] || startDate;
      setWeekItems((prev) => {
        const copy = [...prev];
        copy[activeDayIndex] = {
          ...copy[activeDayIndex],
          [menuItem.MENUITEMID]: makeDefaultItemConfig(
            menuItem.MENUITEMID,
            servDate,
            startTime
          ),
        };
        return copy;
      });
    },
    [activeDayIndex, weekDates, startDate, startTime, publishedDays]
  );

  const removeItem = useCallback(
    (menuItemId) => {
      if (publishedDays[activeDayIndex]) return;
      setWeekItems((prev) => {
        const copy = [...prev];
        const dayMap = { ...copy[activeDayIndex] };
        delete dayMap[menuItemId];
        copy[activeDayIndex] = dayMap;
        return copy;
      });
    },
    [activeDayIndex, publishedDays]
  );

  const updateFlag = useCallback(
    (menuItemId, field, value) => {
      if (publishedDays[activeDayIndex]) return;
      setWeekItems((prev) => {
        const copy = [...prev];
        copy[activeDayIndex] = {
          ...copy[activeDayIndex],
          [menuItemId]: {
            ...copy[activeDayIndex][menuItemId],
            [field]: value,
          },
        };
        return copy;
      });
    },
    [activeDayIndex, publishedDays]
  );

  const updateQty = useCallback(
    (menuItemId, field, value) => {
      if (publishedDays[activeDayIndex]) return;
      setWeekItems((prev) => {
        const copy = [...prev];
        copy[activeDayIndex] = {
          ...copy[activeDayIndex],
          [menuItemId]: {
            ...copy[activeDayIndex][menuItemId],
            [field]: value,
          },
        };
        return copy;
      });
    },
    [activeDayIndex, publishedDays]
  );

  const applyToAllDays = () => {
    const source = weekItems[activeDayIndex];
    setWeekItems((prev) =>
      prev.map((currDay, i) => {
        if (i === activeDayIndex) return currDay;
        if (publishedDays[i]) return currDay;
        const targetDate = weekDates[i];
        if (targetDate && holidayMap[targetDate] && !holidayOverrides[i]) {
          return currDay;
        }
        const dayStart = startTime;
        const cloned = {};
        Object.entries(source).forEach(([menuItemId, cfg]) => {
          cloned[menuItemId] = {
            ...cfg,
            BOOKUNTIL:
              targetDate && dayStart
                ? defaultBookUntil(targetDate, dayStart)
                : '',
            CANCELUNTIL:
              targetDate && dayStart
                ? defaultCancelUntil(targetDate, dayStart)
                : '',
          };
        });
        return cloned;
      })
    );
  };

  const copyFromDay = (sourceIndex) => {
    if (publishedDays[activeDayIndex]) return;
    const source = weekItems[sourceIndex];
    const targetDate = weekDates[activeDayIndex];
    const dayStart = startTime;
    setWeekItems((prev) => {
      const copy = [...prev];
      const cloned = {};
      Object.entries(source).forEach(([menuItemId, cfg]) => {
        cloned[menuItemId] = {
          ...cfg,
          BOOKUNTIL:
            targetDate && dayStart
              ? defaultBookUntil(targetDate, dayStart)
              : '',
          CANCELUNTIL:
            targetDate && dayStart
              ? defaultCancelUntil(targetDate, dayStart)
              : '',
        };
      });
      copy[activeDayIndex] = cloned;
      return copy;
    });
    setShowCopyModal(false);
  };

  const clearDay = () => {
    if (publishedDays[activeDayIndex]) return;
    setWeekItems((prev) => {
      const copy = [...prev];
      copy[activeDayIndex] = {};
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!canteenId || !serviceId || !startDate || !startTime || !endTime) {
      alert('Please fill in all context fields.');
      return;
    }

    const days = weekItems.map((dayMap, idx) => {
      const targetDate = weekDates[idx] || startDate;
      return {
        DAYINDEX: idx,
        STARTTIME: startTime,
        ENDTIME: endTime,
        OVERRIDEHOLIDAY: Boolean(holidayOverrides[idx]),
        ITEMS: Object.values(dayMap).map((cfg) => ({
          ...cfg,
          BOOKUNTIL: defaultBookUntil(targetDate, startTime),
          CANCELUNTIL: defaultCancelUntil(targetDate, startTime),
        })),
      };
    });

    const res = await submitBulkMenu({
      CANTEENID: Number(canteenId),
      SERVICEID: Number(serviceId),
      STARTDATE: startDate,
      STARTTIME: startTime,
      ENDTIME: endTime,
      DAYS: days,
    });

    if (res) {
      setSuccessToast(
        `Bulk menu operation complete! Scheduled week from ${weekDates[0]} to ${weekDates[6]}.`
      );
      setReloadCounter((c) => c + 1);
      reset();
    }
  };

  const handleReset = () => {
    reset();
    setCanteenId('');
    setServiceId('');
    setStartDate('');
    setStartTime('08:00');
    setEndTime('10:00');
    setWeekItems(buildEmptyWeek());
    setPublishedDays({});
    setActiveDayIndex(0);
    setItemSearch('');
  };

  const totalConfiguredDays = daySummary.filter((n) => n > 0).length;
  const totalPublishedDays = Object.keys(publishedDays).length;
  const isReady =
    canteenId &&
    serviceId &&
    startDate &&
    startTime &&
    endTime &&
    (totalConfiguredDays > 0 || totalPublishedDays > 0);

  return {
    canteens,
    services,
    menuItems,
    dataLoading,
    canteenId,
    setCanteenId,
    serviceId,
    setServiceId,
    handleServiceChange,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    weekDates,
    holidayMap,
    holidayOverrides,
    setHolidayOverrides,
    publishedDays,
    loadingExisting,
    successToast,
    setSuccessToast,
    error,
    loading,
    results,
    activeDayIndex,
    setActiveDayIndex,
    itemSearch,
    setItemSearch,
    showCopyModal,
    setShowCopyModal,
    activeDayMap,
    selectedIds,
    filteredCatalog,
    selectedItemsList,
    daySummary,
    totalConfiguredDays,
    totalPublishedDays,
    isReady,
    addItem,
    removeItem,
    updateFlag,
    updateQty,
    applyToAllDays,
    copyFromDay,
    clearDay,
    handleSubmit,
    handleReset,
  };
}

export default useBulkMenuPlanner;
