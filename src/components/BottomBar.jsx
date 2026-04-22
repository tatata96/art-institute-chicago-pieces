export default function BottomBar({ item }) {
  if (!item) return null

  const artwork = item.data ?? item
  const year =
    artwork.year_start && artwork.year_end && artwork.year_start !== artwork.year_end
      ? `${artwork.year_start}-${artwork.year_end}`
      : artwork.year_start
  const meta = [artwork.artist, artwork.medium_category, year]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="bottom-bar">
      <img className="bottom-bar-thumb" src={artwork.image_url} alt={artwork.title} />
      <div className="bottom-bar-info">
        <div className="bottom-bar-title">{artwork.title}</div>
        {meta && <div className="bottom-bar-meta">{meta}</div>}
      </div>
    </div>
  )
}
