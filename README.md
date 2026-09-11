# Cell Shop

A single-page smartphone storefront built with **vanilla JavaScript** — no framework, no build step, no dependencies. Client-side routing, a persistent cart, live filtering, and a validated checkout flow in ~500 lines of plain ES modules.

**[Live demo →](https://justin-fekri.github.io/cssd1161-w4-ex1-yournam/)**

---

## Why this project

Most storefront demos lean on React and a bundler to do the heavy lifting. This one deliberately doesn't. The goal was to build the same feature set — routing, state persistence, reactive filtering, modal and drawer UI, form validation — directly against the DOM and browser APIs, to understand what the frameworks are actually doing for you.

## Features

| Feature | Implementation |
|---|---|
| **Client-side routing** | Hash-based router (`#/`, `#/checkout`) listening on `hashchange` |
| **Persistent cart** | `localStorage` with defensive parsing — corrupt or tampered state degrades to an empty cart instead of throwing |
| **Live search** | Debounced input (`debounce()`) so filtering doesn't re-render on every keystroke |
| **Faceted filtering** | Brand select + price range slider, composed against a single `state.filters` object |
| **Product quick-view** | Accessible modal dialog with `role="dialog"` and overlay dismissal |
| **Cart drawer** | Slide-out panel with quantity stepping, line removal, and live subtotal |
| **Checkout** | Native constraint validation (`reportValidity()`) with a `pattern`-validated phone field and an order summary that mirrors cart state |
| **Responsive layout** | 12-column CSS grid collapsing to 9 / 6 / 2 columns across four breakpoints |

## Architecture

```
index.html    Semantic markup + a <template> for product cards
styles.css    Design tokens as CSS custom properties, grid layout, component styles
app.js        Single ES module: state, render functions, event binding
```

The app follows a small **state → render → bind** loop:

- `state` holds the cart and active filters, and is the only mutable source of truth.
- `render*()` functions read `state` and rebuild the relevant DOM subtree — cloning `<template id="productCardTemplate">` rather than concatenating HTML strings, which avoids injection and keeps markup in the HTML file.
- `bindEvents()` wires every listener once at startup; handlers mutate `state`, persist if needed, then call the matching render function.

Money is formatted through a single `Intl.NumberFormat` instance rather than string math, so currency display stays locale-correct.

## Running locally

No install step. Because `app.js` is loaded as an ES module, it needs to be served over HTTP rather than opened with `file://`:

```bash
git clone https://github.com/Justin-Fekri/cssd1161-w4-ex1-yournam.git
cd cssd1161-w4-ex1-yournam
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## What I'd do next

- Replace the hardcoded `PRODUCTS` array with a fetched JSON catalogue, so the render layer is exercised against async data.
- Add a lightweight test suite (Vitest + jsdom) around `computeCartTotals()` and the `loadCart()` parsing guards — they're the two places where a silent bug would cost real money.
- Swap hash routing for the History API with a server-side fallback.
- Persist the checkout draft, so a refresh mid-form doesn't lose entered data.

## Tech

`HTML5` · `CSS Grid` · `CSS Custom Properties` · `JavaScript (ES2022 modules)` · `Web Storage API` · `Intl API` · `GitHub Actions` · `GitHub Pages`

## License

[MIT](LICENSE)
