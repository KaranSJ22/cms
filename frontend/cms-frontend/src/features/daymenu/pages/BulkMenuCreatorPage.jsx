import { useBulkMenuPlanner, DAY_SHORT } from '../hooks/useBulkMenuPlanner';
import PublishSummaryBanner from '../components/bulk/PublishSummaryBanner';
import BulkContextForm from '../components/bulk/BulkContextForm';
import WeekDayTabBar from '../components/bulk/WeekDayTabBar';
import DayConfigTable from '../components/bulk/DayConfigTable';
import CopyDayModal from '../components/bulk/CopyDayModal';

/**
 * Bulk Menu Creator Page (7-Day Horizon)
 * Allows Canteen Managers to bulk configure, schedule, and publish menus for Monday–Sunday
 */
export default function BulkMenuCreatorPage() {
  const {
    canteens,
    services,
    menuItems,
    dataLoading,
    canteenId,
    setCanteenId,
    serviceId,
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
    totalPendingDays,
    totalDraftDays,
    isManager,
    isAssistant,
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
  } = useBulkMenuPlanner();

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Copy from Day Modal */}
      {showCopyModal && (
        <CopyDayModal
          activeDayIndex={activeDayIndex}
          weekDates={weekDates}
          publishedDays={publishedDays}
          daySummary={daySummary}
          onCopy={copyFromDay}
          onClose={() => setShowCopyModal(false)}
        />
      )}

      {/* Header, Error Notice, and Success Toast */}
      <PublishSummaryBanner
        error={error}
        successToast={successToast}
        onDismissToast={() => setSuccessToast(null)}
        results={results}
        onReset={handleReset}
      />

      {/* Step 1: Context Form (Canteen, Service, Week, Hours) */}
      <BulkContextForm
        canteens={canteens}
        canteenId={canteenId}
        onCanteenChange={setCanteenId}
        services={services}
        serviceId={serviceId}
        onServiceChange={handleServiceChange}
        startDate={startDate}
        onStartDateChange={setStartDate}
        startTime={startTime}
        onStartTimeChange={setStartTime}
        endTime={endTime}
        onEndTimeChange={setEndTime}
        weekDates={weekDates}
        loadingExisting={loadingExisting}
        dataLoading={dataLoading}
      />

      {/* Step 2: Day Tabs + Configuration Studio */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
            2
          </span>
          <h2 className="font-semibold text-slate-800">
            Configure Menu Per Day (Mon – Sun)
          </h2>
          <span className="ml-auto text-xs text-slate-500 font-medium">
            {totalConfiguredDays} of 7 days configured
            {totalPublishedDays > 0 ? ` · ${totalPublishedDays} published` : ''}
            {totalPendingDays > 0 ? ` · ${totalPendingDays} pending` : ''}
            {totalDraftDays > 0 ? ` · ${totalDraftDays} draft` : ''}
          </span>
        </div>

        {/* 7-Day Tab Strip */}
        <WeekDayTabBar
          weekDates={weekDates}
          activeDayIndex={activeDayIndex}
          onSelectDay={(idx) => {
            setActiveDayIndex(idx);
            setItemSearch('');
          }}
          holidayMap={holidayMap}
          holidayOverrides={holidayOverrides}
          publishedDays={publishedDays}
          daySummary={daySummary}
        />

        {/* 2-Column Catalog and Day Item Configuration Studio */}
        <DayConfigTable
          activeDayIndex={activeDayIndex}
          weekDates={weekDates}
          holidayMap={holidayMap}
          holidayOverrides={holidayOverrides}
          setHolidayOverrides={setHolidayOverrides}
          publishedDays={publishedDays}
          daySummary={daySummary}
          itemSearch={itemSearch}
          setItemSearch={setItemSearch}
          filteredCatalog={filteredCatalog}
          selectedItemsList={selectedItemsList}
          activeDayMap={activeDayMap}
          selectedIds={selectedIds}
          menuItems={menuItems}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateFlag={updateFlag}
          onUpdateQty={updateQty}
          onApplyToAllDays={applyToAllDays}
          onCopyFromDayClick={() => setShowCopyModal(true)}
          onClearDay={clearDay}
        />
      </div>

      {/* 7-Day Week Overview Bottom Strip */}
      {weekDates.length === 7 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            7-Day Week Overview (Mon – Sun)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {weekDates.map((date, i) => {
              const count = daySummary[i];
              const dayStatus = publishedDays[i];
              const isPublished = Boolean(dayStatus?.isPublished);
              const isPending = Boolean(dayStatus?.isPending);
              const isDraft = Boolean(dayStatus?.isDraft);
              const isWeekend = i === 5 || i === 6;
              const isActive = activeDayIndex === i;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setActiveDayIndex(i)}
                  className={`flex flex-col items-center py-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                      : isPublished
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-300'
                      : isPending
                      ? 'bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-300'
                      : isDraft
                      ? 'bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-400'
                      : isWeekend
                      ? 'bg-indigo-50/40 border-indigo-200/80 text-indigo-900 hover:border-indigo-300'
                      : count > 0
                      ? 'bg-blue-50/50 border-blue-200 text-blue-800 hover:border-blue-300'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold opacity-75">
                      {DAY_SHORT[i]}
                    </span>
                    {isWeekend && (
                      <span
                        className={`text-[8px] font-bold px-1 py-0.2 rounded leading-none ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        W/E
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold mt-0.5">
                    {date.slice(8)}
                  </span>
                  <span
                    className={`mt-1 text-[10px] font-semibold ${
                      isActive
                        ? 'text-white/80'
                        : isPublished
                        ? 'text-emerald-600'
                        : isPending
                        ? 'text-amber-700'
                        : isDraft
                        ? 'text-slate-600'
                        : count > 0
                        ? 'text-blue-600'
                        : 'text-slate-300'
                    }`}
                  >
                    {isPublished
                      ? '✓ published'
                      : isPending
                      ? 'pending'
                      : isDraft
                      ? `draft (${count})`
                      : count > 0
                      ? `${count} item${count !== 1 ? 's' : ''}`
                      : 'empty'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky Action Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isReady ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          />
          <div className="flex flex-col">
            <span className="text-slate-700 font-medium text-xs sm:text-sm">
              {isReady
                ? `${totalPublishedDays} published · ${totalPendingDays} pending · ${totalDraftDays} draft · ${Math.max(
                    0,
                    totalConfiguredDays - (totalPublishedDays + totalPendingDays + totalDraftDays)
                  )} new day(s)`
                : 'Select canteen, service, and week to configure items'}
            </span>
            <span className="text-[11px] text-slate-400">
              {isManager
                ? 'Role: Canteen Manager (Publish or Save as Draft)'
                : 'Role: Canteen Assistant (Submit for Approval or Save as Draft)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Secondary Action: Save as Draft */}
          <button
            id="bulk-draft-btn"
            type="button"
            onClick={() => handleSubmit('DRAFT')}
            disabled={!isReady || loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer text-sm"
          >
            <svg
              className="w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            Save as Draft
          </button>

          {/* Primary Action: Assistant sends for approval; Manager publishes */}
          {!isManager ? (
            <button
              id="bulk-submit-approval-btn"
              type="button"
              onClick={() => handleSubmit('SUBMIT')}
              disabled={!isReady || loading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-sm shadow-orange-200 cursor-pointer text-sm"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Send for Manager Approval
                </>
              )}
            </button>
          ) : (
            <button
              id="bulk-publish-btn"
              type="button"
              onClick={() => handleSubmit('PUBLISH')}
              disabled={!isReady || loading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200 cursor-pointer text-sm"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  Publishing…
                </>
              ) : totalPublishedDays === 7 ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Update Slot Timings
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Publish Menu
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
