export default function BottomBar({ item }) {
  if (!item) return null

  const meta = [item.artist_display, item.medium_display, item.date_display]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="bottom-bar">
      <img className="bottom-bar-thumb" src={item.imageUrl} alt={item.title} />
      <div className="bottom-bar-info">
        <div className="bottom-bar-title">{item.title}</div>
        {meta && <div className="bottom-bar-meta">{meta}</div>}
      </div>
    </div>
  )
}
