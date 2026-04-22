export function getGroupValue(item, field) {
  return item.data?.[field] ?? "Unknown";
}

export function getGroups(items, field) {
  const counts = new Map();
  for (const item of items) {
    const key = getGroupValue(item, field);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => ({key, count}))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function getArtworkMeta(artwork) {
  const year =
    artwork.year_start &&
    artwork.year_end &&
    artwork.year_start !== artwork.year_end
      ? `${artwork.year_start}-${artwork.year_end}`
      : artwork.year_start;

  return [artwork.artist, artwork.medium_category, year]
    .filter(Boolean)
    .join(" · ");
}

export function getLargeImageUrl(artwork) {
  return artwork.image_url?.replace("/full/400,", "/full/1200,") ?? "";
}
