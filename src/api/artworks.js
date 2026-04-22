const BASE_URL = 'https://api.artic.edu/api/v1/artworks'
const IIIF_BASE = 'https://www.artic.edu/iiif/2'
const DEFAULT_LIMIT = 800
const PAGE_LIMIT = 100
const FIELDS = [
  'id',
  'title',
  'artist_display',
  'date_start',
  'date_end',
  'date_display',
  'medium_display',
  'image_id',
  'department_title',
  'place_of_origin',
  'artwork_type_title',
  'style_title',
  'classification_title',
].join(',')

let artworkRequest

export function buildImageUrl(imageId) {
  return `${IIIF_BASE}/${imageId}/full/400,/0/default.jpg`
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

function normalizeArtwork(item) {
  if (!item.image_id) return null

  return {
    id: item.id,
    title: item.title || 'Untitled',
    artist: item.artist_display || 'Unknown artist',
    year_start: item.date_start,
    year_end: item.date_end,
    century: getCentury(item.date_start),
    movement_primary: item.style_title || item.department_title || 'Unknown',
    subject_primary: item.artwork_type_title || item.classification_title || 'Unknown',
    palette_primary: 'Unknown',
    medium_category: item.classification_title || item.medium_display || 'Unknown',
    size_bucket: 'Unknown',
    country: item.place_of_origin || 'Unknown',
    image_url: buildImageUrl(item.image_id),
    insight: item.date_display || item.medium_display || '',
  }
}

async function fetchArtworkPage(page, pageLimit) {
  const url = `${BASE_URL}/search?query[term][is_public_domain]=true&limit=${pageLimit}&page=${page}&fields=${FIELDS}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch Art Institute artworks page ${page}: ${res.status}`)

  const json = await res.json()
  return json.data ?? []
}

export async function fetchArtworks({limit = DEFAULT_LIMIT, pageLimit = PAGE_LIMIT} = {}) {
  const artworks = []
  const pagesToFetch = Math.ceil(limit / pageLimit)

  for (let page = 1; page <= pagesToFetch && artworks.length < limit; page += 1) {
    const pageItems = await fetchArtworkPage(page, pageLimit)
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
