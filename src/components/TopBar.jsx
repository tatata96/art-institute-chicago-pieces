const GROUPS = [
  {label: "Scatter", field: null},
  {label: "Movement", field: "movement_primary"},
  {label: "Subject", field: "subject_primary"},
  {label: "Century", field: "century"},
  {label: "Country", field: "country"},
  {label: "Medium", field: "medium_category"},
];

export default function TopBar({activeGroup, onGroupChange}) {
  return (
    <aside className="top-bar" aria-label="Category filters">
      <strong className="top-bar-title">Art Institute of Chicago</strong>
      <div className="top-bar-pills">
        {GROUPS.map(({label, field}) => (
          <button
            key={label}
            className={`pill${activeGroup === field ? " pill--active" : ""}`}
            onClick={() => activeGroup !== field && onGroupChange(field)}
          >
            {label}
          </button>
        ))}
      </div>
    </aside>
  );
}
