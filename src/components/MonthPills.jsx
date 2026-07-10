export default function MonthPills({ months, total, selected, onSelect }) {
  return (
    <div className="month-pills" role="tablist" aria-label="Filter by month">
      {months.map((m) => (
        <Pill
          key={m.key}
          label={m.label}
          count={m.count}
          active={selected === m.key}
          onClick={() => onSelect(m.key)}
        />
      ))}
      <Pill
        label="All"
        count={total}
        active={selected === 'all'}
        onClick={() => onSelect('all')}
      />
    </div>
  )
}

function Pill({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={active ? 'month-pill active' : 'month-pill'}
      onClick={onClick}
    >
      {label} <span className="count">{count}</span>
    </button>
  )
}
