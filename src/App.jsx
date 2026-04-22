import {useEffect, useMemo, useRef, useState} from "react";
import {
  CategoryNav,
  useUniverseCore,
  UniverseCanvas,
  createItems,
  createImageRenderer,
} from "gallery-universe";
import {fetchRandomArtworks} from "./api/artworks";
import TopBar from "./components/TopBar";
import BottomBar from "./components/BottomBar";
import ArtworkModal from "./components/ArtworkModal";
import {getGroups, getGroupValue} from "./utils";
import "./App.css";

const renderItem = createImageRenderer("image_url");

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
          message:
            error instanceof Error ? error.message : "Failed to load artworks",
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
    () => (activeGroup ? (item) => getGroupValue(item, activeGroup) : null),
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
        clusterLabelPosition={"center"}
      />

      {loadState.status === "loading" && (
        <div
          className="status-overlay status-overlay--loading"
          role="status"
          aria-live="polite"
        >
          <div className="loader-panel">
            <strong>
              Art pieces loading from the Art Institute of Chicago...
            </strong>
            <span className="loader-copy">
              Gathering the collection into space.
            </span>
            <span className="loader-line" aria-hidden="true" />
          </div>
        </div>
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
