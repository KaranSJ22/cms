import {
  MagnifyingGlassIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

export default function ItemAggregationTable({
  searchQuery,
  setSearchQuery,
  filteredDishes = [],
  totalDishesCount = 0,
}) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search dish or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-xs"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredDishes.length} recipe{filteredDishes.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Dish Production Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse print-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Recipe / Dish Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-center">In Bookings</th>
                <th className="py-3.5 px-4 text-right">Total Prep Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredDishes.map((dish) => {
                const itemKey = dish.ITEMID || dish.MENUITEMID;
                return (
                  <tr
                    key={itemKey}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {dish.ITEMNAME}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {dish.CATNAME || dish.CATCODE || "General"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                      <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                        {dish.TOTAL_ORDERS_COUNT || dish.ORDER_COUNT || 1} booking
                        {(dish.TOTAL_ORDERS_COUNT || dish.ORDER_COUNT) > 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-sm font-black text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                        {dish.TOTAL_PREP_QTY} portions
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="w-4 h-4 text-orange-500" />
            <span>
              Quantities account for combo contents multiplied by the total confirmed headcount.
            </span>
          </div>
          <div>
            Showing <strong>{filteredDishes.length}</strong> of <strong>{totalDishesCount}</strong> items
          </div>
        </div>
      </div>
    </div>
  );
}
