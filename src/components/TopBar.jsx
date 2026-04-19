const GROUPS = [
  { label: 'Scatter', field: null },
  { label: 'Artist', field: 'artist_display' },
  { label: 'Medium', field: 'medium_display' },
  { label: 'Date', field: 'date_display' },
  { label: 'Department', field: 'department_title' },
  { label: 'Origin', field: 'place_of_origin' },
  { label: 'Type', field: 'artwork_type_title' },
  { label: 'Style', field: 'style_title' },
  { label: 'Classification', field: 'classification_title' },
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
