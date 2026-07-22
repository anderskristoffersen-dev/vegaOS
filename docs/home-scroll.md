# Home scroll behaviour

This document describes how vertical scrolling works on the Home screen (`src/pages/Home.js`). The goal is to keep the **focused country row** aligned to a fixed anchor on screen while the user moves focus up and down the grid.

## Overview

Home does **not** use a native scroll view. Instead:

1. The focused row index is derived from keyboard / remote focus state.
2. A **target scroll offset** is calculated from that row’s document position.
3. A `requestAnimationFrame` loop **smoothly animates** the current offset toward the target.
4. The scroll content is moved with `transform: translateY(-displayScrollOffset)`.

Row **0** is special: scroll offset is always `0`, so the first row (and the grid title above it) stay in their resting layout position.

When the **Recents** section is visible (`recents.length > 0`), Recents occupies row **0** and the country grid starts at row **1**. When Recents is hidden, the first country row is row **0** again — preserving the original scroll anchor behaviour.

Rows **1 and above** scroll until the top of the focused row sits at **`SCROLL_ANCHOR_Y` (280 px)** from the top of the viewport.

## Layout hierarchy

```
screen
└── scrollLayer                    ← shifts horizontally when SideNav expands
    └── scrollViewport             ← clips overflow; applies top fade mask
        └── scrollContent          ← ref: scrollContentRef; translateY(-displayScrollOffset)
            ├── Status
            └── countrySection     ← position: relative
                ├── sectionTitle   ← in document flow (Recents or All countries)
                ├── recents row wrapper (when Recents visible)
                ├── sectionTitle   ← All countries (when Recents visible)
                └── rows           ← ref: rowsContainerRef; country rows only
                    ├── CountryRow (row 0 or 1 — first country row)
                    └── …
```

### Key layout constants

| Constant | Value | Role |
|---|---:|---|
| `STATUS_TOP` | 120 px | Status block top margin |
| `STATUS_HEIGHT` | 300 px | Expected Status block height (used in fallback row math) |
| `STATUS_TO_ROW_GAP` | 100 px | Gap between Status and country grid section |
| `CONTENT_LEFT` | 70 px | Country section left margin (`STATUS_LEFT - NAV_COLLAPSED_WIDTH`) |
| `SCROLL_ANCHOR_Y` | 280 px | Viewport Y where focused row top should land |
| `SHADOW_BLEED_LEFT` | 120 px | Extra viewport width so tile shadows are not clipped |
| `SCROLL_FADE_RATIO` | 0.2 | Height of the top fade when scrolled |
| `GRID_TITLE_HEIGHT` | 66 px | Title height (10 + 46 + 10 padding); used for absolute placement only |

### Fallback first-row top

When DOM measurement is unavailable, row tops are computed as:

```
firstRowTop = STATUS_TOP + STATUS_HEIGHT + STATUS_TO_ROW_GAP + GRID_TITLE_HEIGHT
            // 520 + 66 = 586 px (first row starts after the section title)

if recents visible:
  rowTop[0] = firstRowTop                                    // Recents row
  rowTop[1] = firstRowTop + TILE_HEIGHT + GRID_TITLE_HEIGHT  // first country row
else:
  rowTop[0] = firstRowTop                                    // first country row
```

Row tops are re-measured when `recents.length` transitions between 0 and 1+ (layout height changes).

## What drives scrolling

Scroll target is derived from **`activeTile`**, not `focusedTile` directly:

| State | `activeTile` source |
|---|---|
| Context menu open | Menu source tile `{ row, col }` |
| Context menu closing | `returnTo` tile (keeps row highlighted during close animation) |
| Otherwise | `focusedTile` |

When `activeTile.row` changes, `getScrollOffset` produces a new target. Row/column changes from arrow keys, Enter long-press menu open/close, and SideNav exit all flow through this.

Row **0** or no tile focused (`null`) → scroll target **0**.

## Row position measurement

Row tops are stored in `layoutRowTops` and used for both scroll and context-menu positioning.

### 1. Fallback: `getRowTops()`

Pure math based on layout constants and `ROW_CONFIGS` length. Used:

- As initial state before content is ready.
- When DOM refs or row children are missing.

### 2. Measured: `measureRowTopsFromDom(rowsContainer, scrollContent, hasRecents)`

Runs in a `useLayoutEffect` when `isContentReady` becomes `true` and when Recents visibility changes.

For each `CountryRow` child in `rowsContainer`:

```js
rowTop = rowEl.getBoundingClientRect().top - scrollContent.getBoundingClientRect().top
```

**Why `getBoundingClientRect`?**  
Row tops must be relative to `scrollContent`, not an intermediate wrapper. Using `offsetTop` breaks when a parent (e.g. `countrySection` with `position: 'relative'`) becomes the `offsetParent` — measured values become too small and rows land below the scroll anchor.

The transform on `scrollContent` cancels out when both rects are taken from the same frame, so measurement reflects layout positions at scroll offset `0`.

## Scroll offset calculation

### `getScrollOffset(focusedRowIndex, rowTops)`

```
if focusedRowIndex is null or 0  →  0
if focusedRowIndex is last row   →  getMaxScroll(rowTops)
else                             →  min(rowTops[i] - SCROLL_ANCHOR_Y, getMaxScroll)
```

**Intent:** after scrolling by this amount, row `i`’s top edge is at viewport Y = `SCROLL_ANCHOR_Y`:

```
viewportRowTop = rowTops[i] - scrollOffset = SCROLL_ANCHOR_Y
```

### `getMaxScroll(rowTops)`

Caps scrolling so the grid cannot scroll past a useful end position:

```
maxScroll = max(0, rowTops[secondToLastRow] - SCROLL_ANCHOR_Y)
```

When the **last row** is focused, offset clamps to this maximum instead of scrolling the final row all the way to the anchor (which would leave empty space below the grid).

Requires at least 3 rows (`secondToLastRowIndex >= 1`); otherwise max scroll is `0`.

## Smooth scroll animation

Scroll uses **exponential easing** in a continuous `requestAnimationFrame` loop (started when `isContentReady`):

| Ref / state | Purpose |
|---|---|
| `scrollTargetRef` | Latest target from `getScrollOffset` (updated every render) |
| `displayScrollRef` | Current animated offset (mutable, avoids stale closures) |
| `displayScrollOffset` | React state driving the CSS transform |

Per frame:

```js
alpha = 1 - exp(-dt / SCROLL_SMOOTH_TIME_S)
next  = current + (target - current) * alpha
```

- `SCROLL_SMOOTH_TIME_S = SCROLL_DURATION / 1000 / 4.6` (~98 ms time constant)
- `SCROLL_DURATION = 450 ms` (from `src/Styles/motion.js`) — chosen so one row step settles in ~450 ms
- Snaps to target when within **0.5 px**

The transform applied to scroll content:

```js
transform: [{ translateY: -displayScrollOffset }]
```

## Visual effects tied to scroll

### Top fade mask

When `displayScrollOffset > 0`, `scrollViewport` gets a CSS mask:

```
linear-gradient(to bottom,
  rgba(0,0,0,0) 0%,
  rgba(0,0,0,1) 20%)
```

This fades content near the top edge as rows scroll under the Status area.

### Shadow bleed

`scrollViewport` extends `SHADOW_BLEED_LEFT` (120 px) to the left so focused tile shadows are not clipped by `overflow: hidden`. `scrollContent` has matching `paddingLeft` so layout is unchanged.

## Section titles

Section titles (`CountryGridTitle`) sit **in document flow** inside `countrySection`, directly after the 100 px `statusToTilesGap` spacer.

**Layout order when Recents is visible:**
1. `statusToTilesGap` (100 px)
2. Recents title (66 px)
3. Recents row
4. All countries title (0 px gap below Recents row)
5. Country rows

**Layout order when Recents is hidden:**
1. `statusToTilesGap` (100 px)
2. All countries title (66 px)
3. Country rows

Titles are no longer absolutely positioned above rows, so they do not overlap the status-to-content gap.


## Horizontal offset (related, not vertical scroll)

`scrollLayer` also shifts horizontally when SideNav expands:

```js
contentOffset = NAV_COLLAPSED_WIDTH + (navExpanded ? NAV_EXPAND_DELTA : 0)
marginLeft: contentOffset on scrollLayer
```

This uses `SCROLL_DURATION` / `SCROLL_EASING` for its CSS transition. It does not affect vertical scroll offset but does affect context-menu X positioning via `contentOffset`.

## Context menu positioning

`getContextMenuPosition` (in `src/components/ContextMenu.js`) depends on scroll state:

```js
tileY = rowTops[row] - scrollOffset   // uses displayScrollOffset (animated value)
tileX = contentOffset + contentLeft + col × (tileWidth + tileGap)
```

The menu is positioned relative to the **currently visible** tile position, so it tracks the smooth scroll animation.

## Keyboard navigation affecting scroll

Vertical scroll changes when arrow keys move focus between rows:

| Key | Effect on scroll |
|---|---|
| `ArrowDown` from Status button | Focus row 0 → scroll stays 0 (Recents if visible, else first country row) |
| `ArrowUp` on row 0 | Focus Status button → scroll stays 0 |
| `ArrowDown` / `ArrowUp` between rows | Updates `focusedTile.row` → new scroll target |
| Context menu open | `activeTile` locks to menu source row |
| Context menu close | Returns focus to tile; row may change scroll |

Column clamping when changing rows uses `getTargetColumn(currentCol, targetRow, hasRecents, recentsCount)` so focus stays within each row's tile count (Recents: 1–6 items; country rows: `ROW_CONFIGS[row].itemCount`).

## Timing and readiness

Scroll measurement and animation start only after the home reveal sequence:

1. `HOME_LOADING_DELAY_MS` — loading overlay
2. `countriesRevealed` — fade/slide-in of content
3. `getHomeRevealCompleteDelayMs()` — wait for last tile reveal
4. `isContentReady = true` → measure row tops, start scroll loop, focus Status button

Until `isContentReady`, fallback `getRowTops()` values are used.

## Invariants and pitfalls

1. **Row 0 scroll is always zero.** Do not scroll the first row to the anchor. When Recents is hidden, row 0 is the first country row (same as pre-Recents behaviour).
2. **Focused rows 1+ land at Y = 280 px** from the viewport top (after animation settles).
3. **Do not put section titles in document flow** above the rows without updating scroll math — it would push row tops down and break anchor alignment.
4. **Measure row tops relative to `scrollContent`**, not via `offsetTop` on nested positioned wrappers.
5. **Use `displayScrollOffset`** (animated) for anything that must track visible tile positions during scroll (e.g. context menu).
6. **Use `rowTops` from `layoutRowTops`** for scroll target calculation; targets update immediately on focus change while the display value catches up smoothly.
7. **Re-measure row tops** when Recents visibility changes (`recents.length` 0 ↔ 1+).

## Source reference

| File | Responsibility |
|---|---|
| `src/pages/Home.js` | Scroll constants, row measurement, offset math, animation loop, layout, Recents row |
| `src/utils/recents.js` | Recents state, localStorage persistence, pin/unpin/remove |
| `src/components/CountryRow.js` | `TILE_HEIGHT`, `ROW_GAP`, row dimensions |
| `src/components/CountryGridTitle.js` | `GRID_TITLE_HEIGHT`; absolute title placement |
| `src/components/ContextMenu.js` | Menu position using `rowTops` and `scrollOffset` |
| `src/Styles/motion.js` | `SCROLL_DURATION`, `SCROLL_EASING` |
| `src/data/countries.js` | `ROW_CONFIGS` (number of rows and tiles per row) |
