import {useEffect, useMemo, useState} from "react";
import {
  CategoryNav,
  useUniverseCore,
  UniverseCanvas,
  createItems,
  loadImage,
} from "gallery-universe";
import artworksData from "./api/artworks-normalized.json";
import TopBar from "./components/TopBar";
import BottomBar from "./components/BottomBar";
import "./App.css";

const ITEMS = createItems(artworksData.length, (i) => artworksData[i]);

function getGroupValue(item, field) {
  return item.data?.[field] ?? "Unknown";
}

function getGroups(field) {
  const counts = new Map();
  for (const item of ITEMS) {
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

export default function App() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeGroup, setActiveGroup] = useState("movement_primary");

  const core = useUniverseCore({
    items: ITEMS,
    onItemClick: (item) => setSelectedItem(item),
  });

  const groupBy = useMemo(
    () =>
      activeGroup ? (item) => getGroupValue(item, activeGroup) : null,
    [activeGroup],
  );
  const groups = useMemo(
    () => (activeGroup ? getGroups(activeGroup) : []),
    [activeGroup],
  );

  useEffect(() => {
    core.setGroupBy(groupBy);
  }, [core, groupBy]);

  function handleGroupChange(field) {
    setActiveGroup(field);
  }

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
      {activeGroup && (
        <CategoryNav
          groups={groups}
          cameraRef={core.cameraRef}
          groupCentersRef={core.groupCentersRef}
          onSelect={(key) => core.navigateToGroup(key)}
          outerStyle={{bottom: selectedItem ? 92 : 24}}
        />
      )}
      <BottomBar item={selectedItem} />
    </div>
  );
}
