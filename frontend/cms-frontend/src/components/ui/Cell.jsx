import { STATUS_META } from '../../utils/constants'

/** Single table cell — text with optional mono font */
export function Cell({ children, mono }) {
  return (
    <div className={`py-2.5 text-[0.82rem] text-slate-900 flex items-center ${mono ? 'font-mono tracking-[0.04em]' : ''}`}>
      {children}
    </div>
  )
}

/** Menu catalog table row */
export function TableRow({ item, odd }) {
  const meta = STATUS_META[item.STATUS] || STATUS_META[item.status] || STATUS_META.A
  return (
    <div
      className={`
        grid gap-0 px-5 border-b border-slate-200
        hover:bg-slate-50 transition-colors duration-150
        ${odd ? 'bg-slate-50/50' : 'bg-white'}
      `}
      style={{ gridTemplateColumns: '130px 180px 1fr 130px' }}
    >
      <Cell mono>{item.MENUCODE || item.menuCode}</Cell>
      <Cell>{item.SHORTNAME || item.shortName}</Cell>
      <Cell>{item.ITEMNAME || item.itemName}</Cell>
      <Cell>
        <span
          className="px-2 py-0.5 rounded text-[0.68rem] font-bold tracking-[0.04em] font-grotesk border"
          style={{
            backgroundColor: meta.colors.bg,
            color:           meta.colors.text,
            borderColor:     meta.colors.border,
          }}
        >
          {meta.label}
        </span>
      </Cell>
    </div>
  )
}
