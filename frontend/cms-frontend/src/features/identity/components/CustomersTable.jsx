export function CustomersTable({ customers, loading, error }) {
  if (loading) {
    return <div className="p-8 text-center text-slate-500 text-sm animate-pulse">Loading customers...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 text-sm font-semibold">{error}</div>;
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
        <div className="text-slate-400 mb-2">No customers found</div>
        <div className="text-[0.75rem] text-slate-400 text-center max-w-xs">
          Get started by adding a new customer profile.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 text-[0.7rem] font-grotesk tracking-wider text-slate-500 uppercase border-b border-slate-200">
            <th className="px-4 py-3 font-semibold">ID</th>
            <th className="px-4 py-3 font-semibold">Display Name</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Valid From/Until</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, index) => (
            <tr 
              key={customer.CUSTOMERID || index} 
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors text-sm text-slate-700"
            >
              <td className="px-4 py-3 font-medium text-slate-900">{customer.CUSTOMERID || '-'}</td>
              <td className="px-4 py-3">{customer.DISPNAME}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold tracking-wide uppercase bg-slate-100 text-slate-600">
                  {customer.CTYPECODE}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  customer.STATUSCODE === 'ACT' ? 'bg-emerald-100 text-emerald-700' :
                  customer.STATUSCODE === 'BLK' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {customer.STATUSCODE}
                </span>
              </td>
              <td className="px-4 py-3 text-[0.75rem]">
                {customer.VALIDFROM ? new Date(customer.VALIDFROM).toLocaleDateString() : 'N/A'} 
                <span className="text-slate-400 mx-1">-</span> 
                {customer.VALIDUNTIL ? new Date(customer.VALIDUNTIL).toLocaleDateString() : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
