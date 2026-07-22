# Remote control

This document describes how the virtual TV remote works in the Vega prototype, how it maps to keyboard input, and how screens respond to directional and action keys.

## Core principle

**The remote always listens and responds to the same keyboard keys that operate the prototype.**

There is no separate remote-specific navigation API. The on-screen remote is a UI layer that synthesizes standard `KeyboardEvent`s and dispatches them into the same handlers used by a physical keyboard. Anything that works with the keyboard should work with the remote, and vice versa.

When adding new screens or interactions, wire them to keyboard keys — not to remote button callbacks.

## Key mapping

These mappings are the canonical contract for the prototype. Always treat them as equivalent:

| Keyboard key | Remote button | Role |
|---|---|---|
| `Enter` / `Spacebar` | **OK** | Activate / confirm focused control |
| `ArrowLeft` | **Left** | Move focus left |
| `ArrowRight` | **Right** | Move focus right |
| `ArrowUp` | **Up** | Move focus up |
| `ArrowDown` | **Down** | Move focus down |
| `Backspace` | **Back** | Go back / dismiss / close |

### Activation keys (OK)

`isActivationKey()` in `src/utils/dispatchKey.js` treats these as OK / activate:

- `Enter`
- `NumpadEnter`
- ` ` (space)
- `Spacebar`

Components and hooks that respond to OK should use `isActivationKey()` rather than checking only `Enter`.

### Back key note

Most back handlers in the app listen for **both** `Backspace` and `Escape`:

```js
if (event.key !== 'Escape' && event.key !== 'Backspace') return;
```

The virtual remote **Back** button dispatches `Escape`, while a keyboard user may press `Backspace`. Both should behave the same. When adding new back behaviour, always handle both keys unless there is a deliberate reason not to.

## Architecture

```
AppShell (src/main.jsx)
├── App                         ← screen routing + global back stack
└── VirtualTVRemote             ← on-screen remote (portal into #tv-stage)
        │
        └── dispatchKey.js      ← synthesizes KeyboardEvent(s)
                │
                └── window / document.activeElement listeners across the app
```

| File | Responsibility |
|---|---|
| `src/main.jsx` | Mounts `App` and `VirtualTVRemote` together in `AppShell` |
| `src/components/VirtualTVRemote.js` | On-screen remote UI; dispatches synthetic key events |
| `src/components/VirtualTVRemote.css` | Remote styling, z-index, drag/minimize transitions |
| `src/utils/dispatchKey.js` | `dispatchKeyDown`, `dispatchKeyUp`, `dispatchKeyPress`, `isActivationKey` |
| `src/hooks/useActivationKey.js` | Global OK handler for a focused button ref |

The remote renders via `createPortal` into `#tv-stage` so it sits above the 1920×1080 TV canvas at `z-index: 10000`.

## Event dispatch (`dispatchKey.js`)

Synthetic events are created with:

```js
new KeyboardEvent(type, { key, code, bubbles: true, cancelable: true })
```

Legacy `keyCode` and `which` properties are also set for compatibility.

### Target selection

Events are dispatched to:

1. An explicit target passed to the dispatch function, if provided and not `document.body` / `document.documentElement`
2. Otherwise `document.activeElement`, if meaningful
3. Otherwise `window`

This keeps focus on the currently focused tile, button, or nav item when the remote is used.

### Public API

| Function | Behaviour |
|---|---|
| `dispatchKeyDown(key, code?, target?)` | Fire a single `keydown` |
| `dispatchKeyUp(key, code?, target?)` | Fire a single `keyup` |
| `dispatchKeyPress(key, code?, target?)` | Fire `keydown` then `keyup` (one-shot press) |
| `isActivationKey(key)` | Returns true for OK / activation keys |

## Virtual remote buttons

The remote has three internal button types.

### D-pad directions (`RemoteRepeatButton`)

Used for **Up**, **Down**, **Left**, and **Right**.

- Fires an initial `keydown` on pointer down
- While held, repeats `keydown` after a **400 ms** initial delay, then every **50 ms**
- Fires `keyup` on pointer up / cancel / lost capture

This mimics OS keyboard auto-repeat, so holding **Down** on the remote scrolls through Home rows at the same effective rate as holding the keyboard down arrow.

### OK (`RemoteHoldButton`)

- Fires `keydown` (`Enter`) on pointer down
- Fires `keyup` on release
- Does **not** auto-repeat — a held OK is treated as one long press (used for long-press actions such as opening the Home context menu)

Keyboard **Spacebar** also activates via `isActivationKey()` but is dispatched as a discrete press from the keyboard; the remote OK maps specifically to `Enter`.

### Action buttons (`RemoteActionButton`)

Used for **Back**, **Menu**, and **Minimize**. These call custom handlers rather than dispatching arrow/enter keys directly.

| Button | Behaviour |
|---|---|
| **Back** | Closes the remote menu if open; otherwise dispatches `Escape` to the active element |
| **Menu** | Toggles a prototype-only remote menu (currently links to Component library). Not mapped to a keyboard key. |
| **Minimize** | Slides the remote to a bottom peek bar. Not mapped to a keyboard key. |

## Focus behaviour

Remote buttons use `tabIndex={-1}` and `onMouseDown={preventFocus}` so clicking the remote does **not** steal DOM focus from the TV UI.

On pointer down, each D-pad / OK button captures `document.activeElement` and dispatches events to that element for the duration of the press.

## Remote UI features (non-keyboard)

These are convenience features of the on-screen remote only:

- **Draggable** — reposition anywhere within the TV stage
- **Minimizable** — collapses to a 40 px peek bar at the bottom; click or drag up to restore
- **Momentum scrolling** — flicking the remote while dragging applies deceleration
- **Menu** — opens a small popover with prototype shortcuts (e.g. Component library)

None of these affect TV navigation keys.

## Global back stack (`App.js`)

A capture-phase `window` listener handles back for top-level screen routing:

| Current screen | Back (`Backspace` or `Escape`) goes to |
|---|---|
| `Apps` (AppLauncher) | `Home` |
| `Welcome` | `Apps` |
| `SignIn` | `Welcome` |
| `FallbackSignIn` | `SignIn` |

`Home` and `ComponentLibrary` handle back in their own listeners (see below).

## Screen-by-screen key handling

### Home (`src/pages/Home.js`)

Capture-phase listener on `window`. This is the most complex navigation surface.

| Key | Behaviour |
|---|---|
| `ArrowDown` | From Status button → first tile (row 0, col 0). Between rows → move down (with column clamping). |
| `ArrowUp` | From row 0 → Status button. Between rows → move up. |
| `ArrowLeft` / `ArrowRight` | Move between tiles in a row. |
| `ArrowLeft` at col 0 | Hand off to SideNav (clears tile focus ref; scroll position is preserved). |
| `Enter` (hold ≥ 500 ms) | Open context menu on tile (except "Fastest" tile). |
| `Enter` (short press) | Short-press pulse / connect on tile. |
| `Escape` / `Backspace` | Close context menu if open. |

When SideNav is expanded, Home's arrow handler yields; SideNav owns directional keys until the user presses **Right** to exit back to content.

See also [home-scroll.md](./home-scroll.md) for how `ArrowDown` / `ArrowUp` drive vertical scroll.

### SideNav (`src/components/SideNav.js`)

Bubble-phase listener on `window`.

| Key | Behaviour |
|---|---|
| `ArrowLeft` | Open nav (when no tile is focused) |
| `ArrowUp` / `ArrowDown` | Move between Home / Search / Settings |
| `ArrowRight` | Collapse nav and return focus to last content position |

### AppLauncher (`src/pages/AppLauncher.js`)

Capture-phase listener. Only the **first row** of five app tiles is focusable.

| Key | Behaviour |
|---|---|
| `ArrowLeft` / `ArrowRight` | Move between tiles 0–4 |
| `ArrowUp` / `ArrowDown` | Swallowed (no vertical navigation) |
| OK (`Enter` / `Spacebar`) | Activates focused tile (tile 0 opens Welcome) |

Navigation reads `focusedIndexRef.current` to avoid stale closure bugs.

### Welcome / SignIn

Use `useActivationKey(buttonRef)` to press the primary button on OK from anywhere on the screen (capture phase). No arrow navigation.

### Component library (`src/pages/ComponentLibrary.js`)

| Key | Behaviour |
|---|---|
| `Escape` / `Backspace` | Close open component detail, or navigate back to Home |

### Shared components

| Component / hook | OK behaviour |
|---|---|
| `Button` | `onPress` on activation key when focused |
| `AppTile` | `onPress` on activation key when focused |
| `useActivationKey` | Calls `.press()` on a ref'd button when any activation key is pressed globally |

## Key listener phases

Most app listeners use the **capture** phase (`addEventListener(..., true)`) so they run before individual component handlers. SideNav uses the **bubble** phase so Home can clear tile focus on `ArrowLeft` before SideNav opens.

Order matters when handing focus between regions (e.g. Home grid → SideNav). Prefer capture for screen-level routing and be deliberate about `preventDefault` / `stopImmediatePropagation`.

## Adding new screens or controls

1. **Use keyboard keys** — map D-pad to `Arrow*` keys, OK to `Enter`/`Spacebar`, back to `Backspace` (and usually `Escape`).
2. **Use `isActivationKey()`** for OK handling.
3. **Handle both `Backspace` and `Escape`** for back/dismiss unless intentionally different.
4. **Do not read remote state** — the remote is transparent; only keyboard events matter.
5. **Preserve focus** — remote buttons will dispatch to `document.activeElement`; ensure your control is focusable (`focusable` on `Pressable`).
6. **Support key repeat** — if rapid repeated `ArrowDown` should do something (e.g. fast scroll), do not require `!event.repeat`; repeated keydowns are intentional.
7. **Test both inputs** — verify behaviour with keyboard and with the on-screen remote, including hold-to-repeat on D-pad directions and hold-to-long-press on OK.

## Quick reference

```
ENTER / SPACEBAR  →  OK
ARROW LEFT        →  Left
ARROW RIGHT       →  Right
ARROW UP          →  Up
ARROW DOWN        →  Down
BACKSPACE         →  Back   (Escape also handled in most back paths)
```

The remote is not a separate input system. It is a keyboard simulator layered on top of the same event-driven TV navigation used throughout the prototype.
