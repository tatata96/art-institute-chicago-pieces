const GROUPS = [
  { label: 'Scatter', field: null },
  { label: 'Movement', field: 'movement_primary' },
  { label: 'Subject', field: 'subject_primary' },
  { label: 'Century', field: 'century' },
  { label: 'Country', field: 'country' },
  { label: 'Palette', field: 'palette_primary' },
  { label: 'Medium', field: 'medium_category' },
  { label: 'Size', field: 'size_bucket' },
]

export default function TopBar({ activeGroup, onGroupChange }) {
  return (
    <div className="top-bar">
      <span className="top-bar-title">Art Universe</span>
      <div className="top-bar-pills">
        {GROUPS.map(({ label, field }) => (
          <button
            key={label}
            className={`pill${activeGroup === field ? ' pill--active' : ''}`}
            onClick={() => activeGroup !== field && onGroupChange(field)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
