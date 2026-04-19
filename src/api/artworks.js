const BASE_URL = 'https://api.artic.edu/api/v1/artworks'
const FIELDS = [
  'id', 'title', 'artist_display', 'date_display', 'medium_display',
  'image_id', 'department_title', 'place_of_origin', 'artwork_type_title',
  'style_title', 'classification_title',
].join(',')
const IIIF_BASE = 'https://www.artic.edu/iiif/2'

export function buildImageUrl(imageId) {
  return `${IIIF_BASE}/${imageId}/full/400,/0/default.jpg`
}

export async function fetchArtworks(page) {
  const url = `${BASE_URL}?is_public_domain=true&limit=20&page=${page}&fields=${FIELDS}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch page ${page}: ${res.status}`)
  const json = await res.json()
  return json.data.filter((item) => item.image_id)
}

export async function fetchAllArtworks() {
  const pages = await Promise.all([
    fetchArtworks(1),
    fetchArtworks(2),
    fetchArtworks(3),
    fetchArtworks(4),
    fetchArtworks(5),
  ])
  const flat = pages.flat()
  const seen = new Set()
  return flat
    .filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
    .map((item) => ({ ...item, imageUrl: buildImageUrl(item.image_id) }))
}
