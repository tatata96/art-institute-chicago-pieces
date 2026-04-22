import {getArtworkMeta, getLargeImageUrl} from "../utils";

export default function ArtworkModal({item, onClose}) {
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
