# Specification: Recents Feature Implementation

Please build the new **Recents** section in the TV app interface using existing components (`Country tile`, `country row`, and `title`) by following the rules below.

---

## 1. Core Definitions & Intent Logic

### What Counts as a Recent?
* A connection is only added to **Recents** upon **disconnection** after a fully established VPN connection (`protected` state).
* If a user cancels before the connection is fully established (`connecting` state), it **must not** be recorded.

### When Is a Recent Recorded?
Recents are written in these cases:

1. **Explicit disconnect** — User disconnects from a fully established connection (tile tap, Status quick-disconnect, etc.) via `resetConnection()`.
2. **Implicit disconnect (connection switch)** — User starts a new connection while already **protected**. The previous connection's intent is recorded to Recents before the new connection begins (via `startConnection()`).

These cases do **not** record a recent:

* Cancelling during `connecting` (tap same tile or Status Cancel).
* Switching to a different target while still `connecting` (the in-progress connection is abandoned, not completed).
* Any disconnect that never reached `protected`.

### Intent Types
Each connection target is identified by a stable **intent**. Three intent types exist:

| Type | Intent key | Example | Notes |
|---|---|---|---|
| `fastest` | `fastest` | Fastest tile / Fastest recent | Stored as **"Fastest"**, not the resolved country (UK/Ireland). |
| `country` | `country:{slug}` | Norway | Country tile, or country-level context menu item (Fastest/Random). |
| `city` | `city:{slug}:{cityName}` | Norway + Oslo | City selected via country context menu. |

### Stored Item Shape
```js
{
  intentKey: string,
  type: 'fastest' | 'country' | 'city',
  countrySlug: string | null,   // null for fastest
  countryName: string,
  city: string | null,
  pinned: boolean,
}
```

### Connection Intent & Duplicates
* **Country Intent:** Connecting to a country (e.g., Norway) creates a "Norway" recent item. Reconnecting to Norway updates/moves the existing Norway tile rather than creating a duplicate.
* **City Context Intent:** Connecting to a specific city via the context menu (e.g., Norway → Oslo) creates a distinct intent item.
* **Fastest Intent:** Connecting via the Fastest country tile creates a **Fastest** recent (separate from country-level UK/Ireland intents).
* **Coexistence:** "Norway" (country-level) and "Norway"/Oslo subtitle (city-level) are two separate unique intents and can coexist in the row. Duplicate intents of the exact same target trigger moving the existing tile to the front of the unpinned group.

### Connection Target (Runtime)
During an active session, `connectionTarget` carries:
```js
{
  displayLabel,    // e.g. "Norway", "Norway - Oslo", or resolved fastest country label
  intent,          // stable recent identity (with intentKey)
  sourceTile,      // { row, col } in unified row index space
  scrambleFrom,    // location-masking origin country
}
```

---

## 2. Row Layout, Ordering & Capacity Rules

### Maximum Capacity
* **Strict Cap:** The entire row (Pinned items + Unpinned Recents combined) is capped at **a maximum of 6 items total**.
* **Overflow Handling:** If a new recent item is added and the total length exceeds 6, the last unpinned item is removed from the list.
* **All-Pinned Edge Case:** If there are 6 pinned items, newly disconnected items are ignored completely and not stored.

### Structural Layout Order
`[ Pinned Item 1 ] [ Pinned Item 2 ] ... [ Pinned Item N ] | [ Unpinned Recent 1 ] [ Unpinned Recent 2 ] ...`

1. **Pinned Items:** Always occupy the front of the array (indices `0` through `P - 1`, where `P` is the number of pinned items).
2. **Unpinned Items:** Fill the remaining slots behind the pinned items (indices `P` through `5`).

### State Transition & Movement Rules
* **New Disconnect:** Item is added to position `P` (immediately behind all pinned items). If it already exists as an unpinned item, move it to position `P`.
* **Pin Item:** Moves an existing unpinned item to position `P - 1` (the end of the pinned group).
* **Unpin Item:** Pinned item is unpinned and moves to position `P - 1` (acting as the most recent unpinned item right behind any remaining pinned items).
* **Remove Item:** Tile is completely deleted from the state (works for both pinned & unpinned). Remaining tiles shift left to fill the gap.

---

## 3. UI & Visual Requirements

### Page Layout (Status → Recents → All Countries)
Section titles sit **in document flow** — they must not use negative absolute positioning that overlaps the status gap.

**Layout order:**
```
Status
100px spacer (statusToTilesGap)
Section title(s) + rows
```

**When Recents is visible:**
1. 100px gap
2. "Recents" title (66px, in flow)
3. Recents row
4. "All countries" title (0px gap below Recents row)
5. Country grid rows

**When Recents is hidden:**
1. 100px gap
2. "All countries" title (66px, in flow)
3. Country grid rows

The 100px margin must sit **between Status and the first section title**, not between Status and the tile row.

### Row & Section Visibility
* **Title Component:** Render using `CountryGridTitle` with `label="Recents"` (generalized title component; default label is `"All countries"`).
* **Conditional Rendering:** The Recents section (title + row) must **only** render if the Recents array contains at least 1 item (`length > 0`). If empty, the section must be completely hidden.

### Tile Visual Specs
* **Appearance:** Identical to standard `Country tile` (reuse `CountryRow` / `CountryTile`).
* **Fastest recent:** Label = `"Fastest"`, uses the Fastest flag asset.
* **City Subtitle:** If connected via city context menu (e.g., Oslo), render the city name directly below the country name on the tile (via `subtitle` prop).
* **No City Count:** Recents tiles must **not** show the `"X cities"` label, even for country-level recents with multiple cities.
* **Active Connection Label:** If the user is currently connected to an item present in the Recents row, display the active connection status label (Connecting / Connected) below the name, following the existing app pattern.
* **Cross-row matching:** Active connection labels match by `intentKey`, not only by `sourceTile` position. A connection started from the All countries grid still shows Connected/Connecting on the matching Recents tile, and vice versa.

### Context Menu (Long-Press on Recent Tile)
* Long-pressing a tile in the Recents row opens its context menu (including Fastest recents).
* **No City Selection Menu:** This context menu does **not** list cities.
* **Menu Options:**
  1. **Pin / Unpin Toggle:**
     * If unpinned: Show **Pin** (Icon: `ic-pin-filled.svg`).
     * If pinned: Show **Unpin** (Icon: `ic-pin-slash-filled.svg`).
  2. **Remove:**
     * Show **Remove** (Icon: `ic-trash-cross-filled.svg`). Unpins and deletes the item from the Recents state.
* **Focused icon color:** Pin, unpin, and trash icons use `currentColor` so they invert to `textInvert` when the menu item is focused (same as other context menu icons).

### Clear Recents (Remote Menu)
* The virtual TV remote menu includes a **Clear recents** item.
* Selecting it removes **all** recents from state and persistence, equivalent to manually removing every tile one at a time.
* Implementation: dispatches a `vega:clear-recents` custom event; Home listens and clears `localStorage`.

---

## 4. Connection Lifecycle

### Starting a Connection
* Short-press on a country tile, recent tile, or context menu item calls `startConnection(displayLabel, sourceTile, intent)`.
* Connection takes **2 seconds** (`CONNECTION_DURATION_MS`) to reach `protected`.

### Disconnecting
* Short-press the active source tile (or Status Disconnect) while `connecting` or `protected` calls `resetConnection()`.
* Only records to Recents if state was `protected` at the moment of reset.

### Switching While Protected
* Starting a new connection while **protected** records the current intent to Recents, then begins connecting to the new target.

### Switching While Connecting
* Tapping a **different** tile while `connecting` switches the connection target:
  * The Connecting label moves from the old tile to the new tile.
  * The 2-second timer **resets** for the new target.
  * Location masking (`scrambleFrom`) **continues** — it does not restart.
  * The abandoned in-progress connection is **not** added to Recents.
* Tapping the **same** tile while `connecting` cancels the connection (`resetConnection()`), with no recent recorded.

### Context Menu While Connecting
* Selecting a city/country from a country context menu while `connecting` is allowed and switches the target (same rules as tile switch above).

---

## 5. TV Navigation & Scroll Behavior

Maintain existing spatial focus and page scrolling behavior:

* **Unified row indexing:** When Recents is visible, Recents = row `0`; country grid rows shift down by 1. When hidden, country row `0` is the top row.
* **Row 0 Focus Scroll:** When the Recents section is visible, it becomes **Row 0**. Content scrolling must trigger when focus moves to Row 0 (scroll offset stays `0`).
* **No Recents Fallback:** If the Recents section is hidden (0 items), page scrolling triggers when focus is on **Row 0** (the first country row), preserving existing scroll anchor logic.
* **Focus adjustment:** When Recents appears or disappears, focused row indices are adjusted so focus lands on the equivalent tile (country rows shift ±1).
* **Column clamping:** Recents row supports 1–6 tiles; arrow navigation clamps columns per row.

---

## 6. Persistence & Implementation

### Persistence
* Storage key: `vega-recents` in `localStorage`.
* Loaded on mount; saved on every state change.
* Corrupt or invalid JSON falls back to `[]`.

### Key Source Files
| File | Responsibility |
|---|---|
| `src/utils/recents.js` | Intent keys, reducer ops, persistence, `useRecents()` hook |
| `src/utils/connection.js` | Intent builders, label resolver |
| `src/pages/Home.js` | Layout, connection lifecycle, nav, scroll, menus |
| `src/components/CountryGridTitle.js` | Section titles (`label` prop) |
| `src/components/CountryTile.js` | `subtitle` prop for city recents |
| `src/components/CountryRow.js` | Intent-based connection label matching |
| `src/components/ContextMenuItem.js` | Pin / unpin / trash icons |
| `src/components/VirtualTVRemote.js` | Clear recents menu item |
| `docs/home-scroll.md` | Scroll invariants with Recents row |

### Implementation Checklist
* Persist Recents state to `localStorage` so it survives page reloads.
* Reuse existing `Country tile` and `country row` components without breaking existing grid layouts.
* Ensure spatial focus handles DPAD keys correctly when Row 0 appears or disappears.
* Section titles in document flow; 100px gap between Status and first title.
* Record recents on protected disconnect **and** on protected → new connection switch.
* Do not record on connecting cancel or connecting → different target switch.

---

## 7. Manual Test Plan

1. Connect to Norway (country tile) → disconnect → Recents shows Norway at front of unpinned group; section appears with title.
2. Connect to Norway → Oslo (context menu) → disconnect → both "Norway" and "Norway"/Oslo subtitle coexist.
3. Reconnect to Norway → disconnect → existing Norway tile moves to front (no duplicate).
4. Cancel during Connecting → no new recent added.
5. Fill 6 items → add 7th → last unpinned removed.
6. Pin 6 items → disconnect new connection → list unchanged.
7. Pin / Unpin / Remove via long-press menu on Recents tile; icons invert when focused.
8. Reload page → Recents restored from localStorage.
9. With Recents visible: row 0 focus keeps scroll at 0; row 1 scrolls to anchor.
10. Remove all recents (or Clear recents) → section hidden; country row 0 becomes scroll row 0 again.
11. Connect via Fastest tile → disconnect → "Fastest" recent stored (not UK/Ireland).
12. Active Connected label appears on matching Recents tile regardless of connect source.
13. **100px gap** visible between Status and first section title (Recents or All countries).
14. **All countries title** sits flush (0px gap) below Recents row when Recents is visible.
15. **Switch while protected:** Connect to A → wait for Protected → connect to B → A appears in Recents.
16. **Switch while connecting:** Connect to A → while Connecting, tap B → label moves to B; masking continues; A not in Recents.
17. **Clear recents** from remote menu clears all items and hides the section.
