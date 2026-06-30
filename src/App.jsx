import {useCallback, useEffect, useMemo, useRef, useState} from "react";
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
const FOCAL_LENGTH = 800;
const ITEM_WORLD_SIZE = 50;

function getHoveredArtwork(items, animRef, camera, width, height, x, y) {
  const renderedItems = [];

  for (const item of items) {
    const animated = animRef.current[item.id];
    const worldItem = animated
      ? {
          ...item,
          x: animated.currentX,
          y: animated.currentY,
          z: animated.currentZ,
        }
      : item;
    const depth = worldItem.z - camera.z;

    if (depth <= 0) continue;

    const scale = FOCAL_LENGTH / depth;
    renderedItems.push({
      ...worldItem,
      screenX: (worldItem.x - camera.x) * scale + width / 2,
      screenY: (worldItem.y - camera.y) * scale + height / 2,
      screenSize: ITEM_WORLD_SIZE * scale,
    });
  }

  renderedItems.sort((a, b) => b.z - camera.z - (a.z - camera.z));

  for (let i = renderedItems.length - 1; i >= 0; i -= 1) {
    const item = renderedItems[i];
    const halfSize = item.screenSize / 2;

    if (
      x >= item.screenX - halfSize &&
      x <= item.screenX + halfSize &&
      y >= item.screenY - halfSize &&
      y <= item.screenY + halfSize
    ) {
      return item;
    }
  }

  return null;
}

export default function App() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [isHoveringArtwork, setIsHoveringArtwork] = useState(false);
  const [loadState, setLoadState] = useState({status: "loading", message: ""});
  const pointerRef = useRef(null);
  const isHoveringArtworkRef = useRef(false);

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

  const setArtworkHover = useCallback((isHovering) => {
    if (isHoveringArtworkRef.current === isHovering) return;

    isHoveringArtworkRef.current = isHovering;
    setIsHoveringArtwork(isHovering);
  }, []);

  const updateArtworkHover = useCallback(() => {
    const pointer = pointerRef.current;

    if (!pointer) {
      setArtworkHover(false);
      return;
    }

    const rect = pointer.canvas.getBoundingClientRect();
    const hoveredArtwork = getHoveredArtwork(
      items,
      core.animRef,
      core.cameraRef.current,
      rect.width,
      rect.height,
      pointer.clientX - rect.left,
      pointer.clientY - rect.top,
    );

    setArtworkHover(Boolean(hoveredArtwork));
  }, [core.animRef, core.cameraRef, items, setArtworkHover]);

  const handlePointerMove = useCallback(
    (event) => {
      if (!(event.target instanceof HTMLCanvasElement)) {
        pointerRef.current = null;
        setArtworkHover(false);
        return;
      }

      pointerRef.current = {
        canvas: event.target,
        clientX: event.clientX,
        clientY: event.clientY,
      };
      updateArtworkHover();
    },
    [setArtworkHover, updateArtworkHover],
  );

  const handlePointerLeave = useCallback(() => {
    pointerRef.current = null;
    setArtworkHover(false);
  }, [setArtworkHover]);

  useEffect(() => {
    let frameId;

    function trackArtworkHover() {
      updateArtworkHover();
      frameId = requestAnimationFrame(trackArtworkHover);
    }

    frameId = requestAnimationFrame(trackArtworkHover);
    return () => cancelAnimationFrame(frameId);
  }, [updateArtworkHover]);

  useEffect(() => {
    if (!selectedItem) return undefined;

    const {overflow, paddingRight} = document.body.style;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [selectedItem]);

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
    <div
      className={`app${isHoveringArtwork ? " app--image-hover" : ""}`}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
    >
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
              Art pieces loading from the Cleveland Museum of Art...
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
