import {useEffect, useMemo, useRef, useState} from "react";
import {
  CategoryNav,
  useUniverseCore,
  UniverseCanvas,
  createItems,
  loadImage,
} from "gallery-universe";
import {fetchRandomArtworks} from "./api/artworks";
import TopBar from "./components/TopBar";
import BottomBar from "./components/BottomBar";
import "./App.css";

function getGroupValue(item, field) {
  return item.data?.[field] ?? "Unknown";
}

function getGroups(items, field) {
  const counts = new Map();
  for (const item of items) {
    const key = getGroupValue(item, field);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => ({key, count}))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function renderItem(ctx, item, selected) {
  const {screenX: x, screenY: y, screenSize: s} = item;
  const r = s / 2;
  const img = loadImage(item.data.image_url);
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, x - r, y - r, s, s);
  } else {
    ctx.fillStyle = "#ccc";
    ctx.fillRect(x - r, y - r, s, s);
  }
  if (selected) {
    ctx.strokeStyle = "#ff0";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - r - 2, y - r - 2, s + 4, s + 4);
  }
}

function getArtworkMeta(artwork) {
  const year =
    artwork.year_start && artwork.year_end && artwork.year_start !== artwork.year_end
      ? `${artwork.year_start}-${artwork.year_end}`
      : artwork.year_start;

  return [artwork.artist, artwork.medium_category, year]
    .filter(Boolean)
    .join(" · ");
}

function getLargeImageUrl(artwork) {
  return artwork.image_url?.replace("/full/400,", "/full/1200,") ?? "";
}

function ArtworkModal({item, onClose}) {
  if (!item) return null;

  const artwork = item.data ?? item;
  const meta = getArtworkMeta(artwork);

  return (
    <div className="artwork-modal-backdrop" onClick={onClose}>
      <figure
        className="artwork-modal"
        aria-label={artwork.title}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="artwork-modal-image-frame">
          <img
            className="artwork-modal-image"
            src={getLargeImageUrl(artwork)}
            alt={artwork.title}
          />
        </div>
        <figcaption className="artwork-modal-label">
          <strong>{artwork.title}</strong>
          {meta && <span>{meta}</span>}
          {artwork.insight && <span>{artwork.insight}</span>}
        </figcaption>
      </figure>
    </div>
  );
}

export default function App() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeGroup, setActiveGroup] = useState("movement_primary");
  const [artworks, setArtworks] = useState([]);
  const [loadState, setLoadState] = useState({status: "loading", message: ""});

  useEffect(() => {
    let cancelled = false;

    fetchRandomArtworks({limit: 800})
      .then((items) => {
        if (cancelled) return;
        setArtworks(items);
        setLoadState({status: "ready", message: ""});
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadState({
          status: "error",
          message: error instanceof Error ? error.message : "Failed to load artworks",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(
    () => createItems(artworks.length, (i) => artworks[i]),
    [artworks],
  );

  const core = useUniverseCore({
    items,
    onItemClick: (item) => setSelectedItem(item),
  });
  const coreRef = useRef(core);

  useEffect(() => {
    coreRef.current = core;
  });

  const groupBy = useMemo(
    () =>
      activeGroup ? (item) => getGroupValue(item, activeGroup) : null,
    [activeGroup],
  );
  const groups = useMemo(
    () => (activeGroup ? getGroups(items, activeGroup) : []),
    [activeGroup, items],
  );

  useEffect(() => {
    coreRef.current.setGroupBy(groupBy);
  }, [groupBy, items]);

  function handleGroupChange(field) {
    setActiveGroup(field);
  }

  useEffect(() => {
    if (!selectedItem) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedItem(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem]);

  return (
    <div className="app">
      <TopBar activeGroup={activeGroup} onGroupChange={handleGroupChange} />
      <UniverseCanvas
        core={core}
        width={window.innerWidth}
        height={window.innerHeight}
        renderItem={renderItem}
        groupBy={groupBy}
      />
      {loadState.status === "loading" && (
        <div className="status-overlay">Loading Art Institute artworks...</div>
      )}
      {loadState.status === "error" && (
        <div className="status-overlay status-overlay--error">
          {loadState.message}
        </div>
      )}
      {activeGroup && (
        <CategoryNav
          groups={groups}
          cameraRef={core.cameraRef}
          groupCentersRef={core.groupCentersRef}
          onSelect={(key) => core.navigateToGroup(key)}
          outerStyle={{
            bottom: selectedItem ? 92 : 24,
            left: "clamp(152px, 13vw, 190px)",
          }}
        />
      )}
      <BottomBar item={selectedItem} />
      <ArtworkModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
