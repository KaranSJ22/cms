export function RolesTable({ roles, loading, error }) {
  if (loading) {
    return <div className="p-8 text-center text-slate-500 text-sm animate-pulse">Loading roles...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 text-sm font-semibold">{error}</div>;
  }

  if (!roles || roles.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
        <div className="text-slate-400 mb-2">No roles found</div>
        <div className="text-[0.75rem] text-slate-400 text-center max-w-xs">
          System roles will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 text-[0.7rem] font-grotesk tracking-wider text-slate-500 uppercase border-b border-slate-200">
            <th className="px-4 py-3 font-semibold">Role Code</th>
            <th className="px-4 py-3 font-semibold">Role Name</th>
            <th className="px-4 py-3 font-semibold">Description</th>
            <th className="px-4 py-3 font-semibold text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr 
              key={role.ROLEID} 
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors text-sm text-slate-700"
            >
              <td className="px-4 py-3 font-medium text-slate-900">{role.ROLECODE}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{role.ROLENAME}</td>
              <td className="px-4 py-3 text-slate-500">{role.DESCR || '-'}</td>
              <td className="px-4 py-3 text-center">
                <span className={`px-2 py-0.5 rounded text-[0.65rem] font-bold tracking-wide uppercase ${
                  role.ISACTIVE === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {role.ISACTIVE === 1 ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
