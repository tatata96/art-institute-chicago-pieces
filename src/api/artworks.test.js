import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildImageUrl, fetchArtworks, fetchAllArtworks } from './artworks'

describe('buildImageUrl', () => {
  it('returns correct IIIF URL', () => {
    expect(buildImageUrl('abc123')).toBe(
      'https://www.artic.edu/iiif/2/abc123/full/400,/0/default.jpg'
    )
  })
})

describe('fetchArtworks', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns only artworks that have an image_id', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 1, title: 'A', image_id: 'img1', artist_display: 'Artist A' },
          { id: 2, title: 'B', image_id: null },
        ],
      }),
    })
    const result = await fetchArtworks(1)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('throws on non-ok HTTP response', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 })
    await expect(fetchArtworks(1)).rejects.toThrow('Failed to fetch page 1: 500')
  })

  it('requests the correct URL with all fields', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    })
    await fetchArtworks(3)
    const calledUrl = global.fetch.mock.calls[0][0]
    expect(calledUrl).toContain('page=3')
    expect(calledUrl).toContain('is_public_domain=true')
    expect(calledUrl).toContain('department_title')
    expect(calledUrl).toContain('style_title')
  })
})

describe('fetchAllArtworks', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  function mockPage(ids) {
    return {
      ok: true,
      json: async () => ({
        data: ids.map((id) => ({ id, title: `T${id}`, image_id: `img${id}` })),
      }),
    }
  }

  it('fetches 5 pages and attaches imageUrl to each item', async () => {
    global.fetch
      .mockResolvedValueOnce(mockPage([1, 2]))
      .mockResolvedValueOnce(mockPage([3, 4]))
      .mockResolvedValueOnce(mockPage([5, 6]))
      .mockResolvedValueOnce(mockPage([7, 8]))
      .mockResolvedValueOnce(mockPage([9, 10]))

    const result = await fetchAllArtworks()
    expect(result).toHaveLength(10)
    expect(result[0].imageUrl).toBe(
      'https://www.artic.edu/iiif/2/img1/full/400,/0/default.jpg'
    )
    expect(global.fetch).toHaveBeenCalledTimes(5)
  })

  it('deduplicates items with the same id', async () => {
    global.fetch
      .mockResolvedValueOnce(mockPage([1]))
      .mockResolvedValueOnce(mockPage([1]))
      .mockResolvedValueOnce(mockPage([2]))
      .mockResolvedValueOnce(mockPage([3]))
      .mockResolvedValueOnce(mockPage([4]))

    const result = await fetchAllArtworks()
    expect(result).toHaveLength(4)
  })
})
