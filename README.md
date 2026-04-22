# Art Piece Space

An interactive React/Vite gallery that places public-domain artworks from the Art Institute of Chicago into an explorable visual space. Artworks can be scattered or grouped by movement, subject, century, country, or medium, then opened for a larger artwork view.

## Tech Stack

- React 19
- Vite 8
- `gallery-universe`
- GSAP
- Vitest
- ESLint

## Getting Started

Install dependencies:

```sh
npm install
```

Start the local development server:

```sh
npm run dev
```

Build for production:

```sh
npm run build
```

## Data Source

Artwork records are loaded from the Art Institute of Chicago public API:

```text
https://api.artic.edu/api/v1/artworks
```

Images are rendered through the Art Institute IIIF image service:

```text
https://www.artic.edu/iiif/2
```

Only public-domain artworks with image IDs are included in the gallery.
