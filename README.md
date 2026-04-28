# Website Starter

This is a beginner-friendly starter structure for a static website.

## Folder structure

- `index.html`: Home page
- `pages/`: Extra pages (example: `about.html`)
- `styles/`: CSS files
- `scripts/`: JavaScript files
- `assets/images/`: Photos and graphics (`.jpg`, `.png`, `.webp`, `.svg`)
- `assets/fonts/`: Local font files (`.woff2`, `.woff`, `.ttf`)
- `assets/icons/`: Favicon and icon files

## Where to place files

1. Images go in `assets/images/`.
2. Fonts go in `assets/fonts/`.
3. Site icon (favicon) goes in `assets/icons/favicon.ico`.

## How to use local fonts in CSS

```css
@font-face {
  font-family: "BrandFont";
  src: url("../assets/fonts/BrandFont-Regular.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

body {
  font-family: "BrandFont", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}
```

## Next step

Open `index.html` in your browser to see the starter page.
