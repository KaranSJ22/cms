export function MenuTable({ menus, loading, error, onEdit }) {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm animate-pulse">
        Loading menu catalog...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 text-sm font-semibold">
        {error}
      </div>
    );
  }

  if (!menus || menus.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
        <div className="text-slate-400 mb-2 font-medium">No menu items found</div>
        <div className="text-[0.75rem] text-slate-400 text-center max-w-xs">
          Your menu catalog is currently empty. Click "Add Menu Item" to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-slate-50 text-[0.7rem] font-grotesk tracking-wider text-slate-500 uppercase border-b border-slate-200">
            <th className="px-4 py-3 font-semibold">Menu Code</th>
            <th className="px-4 py-3 font-semibold">Item Name</th>
            <th className="px-4 py-3 font-semibold">Description</th>
            <th className="px-4 py-3 font-semibold text-center">Special</th>
            <th className="px-4 py-3 font-semibold text-center">Status</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {menus.map((menu) => (
            <tr 
              key={menu.MENUITEMID} 
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors text-sm text-slate-700"
            >
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{menu.MENUCODE}</div>
                <div className="text-[0.65rem] text-slate-400 mt-0.5">{menu.SHORTNAME}</div>
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">{menu.ITEMNAME}</td>
              <td className="px-4 py-3 text-slate-500 truncate max-w-[250px]" title={menu.ITEMDESCR}>
                {menu.ITEMDESCR || '-'}
              </td>
              <td className="px-4 py-3 text-center">
                {menu.ISSPECIAL === 1 ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.65rem] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
                    Special
                  </span>
                ) : (
                  <span className="text-slate-300">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wide ${
                  menu.STATUS === 'A' ? 'bg-green-100 text-green-700' : 
                  menu.STATUS === 'D' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {menu.STATUS === 'A' ? 'Active' : menu.STATUS === 'D' ? 'Inactive' : menu.STATUS}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(menu)}
                  className="text-[0.75rem] font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
