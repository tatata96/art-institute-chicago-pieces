const BASE_URL = '/cma-api/api/artworks/'
const DEFAULT_LIMIT = 800
const PAGE_LIMIT = 100

let artworkRequest

export function buildImageUrl(imageUrl) {
  return imageUrl || ''
}

function getCentury(year) {
  if (!Number.isFinite(year) || year === 0) return null
  const century = Math.ceil(Math.abs(year) / 100)
  const suffix =
    century % 10 === 1 && century % 100 !== 11
      ? 'st'
      : century % 10 === 2 && century % 100 !== 12
        ? 'nd'
        : century % 10 === 3 && century % 100 !== 13
          ? 'rd'
          : 'th'
  return year < 0 ? `${century}${suffix} century BCE` : `${century}${suffix} century`
}

function getCreator(item) {
  return item.creators?.find((creator) => creator.role === 'artist') ?? item.creators?.[0]
}

function normalizeArtwork(item) {
  if (!item.images?.web?.url) return null

  const creator = getCreator(item)

  return {
    id: item.id,
    title: item.title || 'Untitled',
    artist: creator?.description || 'Unknown artist',
    year_start: item.creation_date_earliest,
    year_end: item.creation_date_latest,
    century: getCentury(item.creation_date_earliest),
    movement_primary: item.department || item.collection || 'Unknown',
    subject_primary: item.type || item.classification || 'Unknown',
    palette_primary: 'Unknown',
    medium_category: item.technique || item.type || 'Unknown',
    size_bucket: 'Unknown',
    country: item.culture?.[0] || 'Unknown',
    image_url: buildImageUrl(item.images.web.url),
    large_image_url: buildImageUrl(item.images.print?.url || item.images.web.url),
    insight: item.creation_date || item.technique || '',
  }
}

async function fetchArtworkPage(skip, pageLimit) {
  const params = new URLSearchParams({
    has_image: '1',
    limit: String(pageLimit),
    skip: String(skip),
  })
  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch Cleveland artworks: ${res.status}`)

  const json = await res.json()
  return json.data ?? []
}

export async function fetchArtworks({limit = DEFAULT_LIMIT, pageLimit = PAGE_LIMIT} = {}) {
  const artworks = []

  for (let skip = 0; artworks.length < limit; skip += pageLimit) {
    const pageItems = await fetchArtworkPage(skip, pageLimit)
    if (pageItems.length === 0) break

    artworks.push(...pageItems.map(normalizeArtwork).filter(Boolean))
  }

  return artworks.slice(0, limit)
}

export function fetchRandomArtworks(options) {
  if (!artworkRequest) {
    artworkRequest = fetchArtworks(options).catch((error) => {
      artworkRequest = null
      throw error
    })
  }

  return artworkRequest
}
