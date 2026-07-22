import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';
import { CLEAR_RECENTS_EVENT } from '../utils/recents';
import { dispatchKeyDown, dispatchKeyUp } from '../utils/dispatchKey';
import './VirtualTVRemote.css';

const PEEK_HEIGHT = 40;
const PEEK_HOVER_LIFT = 10;
const FRICTION = 0.9;
const MIN_VELOCITY = 0.35;
const DEFAULT_MARGIN = 100;

const REMOTE_MENU_ITEMS = [
  { id: 'component-library', label: 'Component library' },
  { id: 'clear-recents', label: 'Clear recents' },
];

const USER_TYPE_OPTIONS = [
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
];

const FREE_COUNTRY_SORT_OPTIONS = [
  { id: 'alphabetical', label: '#1 - Alphabetical' },
  { id: 'free-row', label: '#2 - Free row' },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getBounds(width, height, containerWidth, containerHeight, minimized = false) {
  if (minimized) {
    return {
      minX: 0,
      maxX: containerWidth - width,
      minY: 0,
      maxY: containerHeight - PEEK_HEIGHT,
    };
  }

  return {
    minX: 0,
    maxX: containerWidth - width,
    minY: 0,
    maxY: containerHeight - height,
  };
}

function clampPosition(
  x,
  y,
  width,
  height,
  containerWidth,
  containerHeight,
  minimized = false,
) {
  const bounds = getBounds(
    width,
    height,
    containerWidth,
    containerHeight,
    minimized,
  );

  return {
    x: clamp(x, bounds.minX, bounds.maxX),
    y: clamp(y, bounds.minY, bounds.maxY),
  };
}

function getDefaultPosition(width, height, containerWidth, containerHeight) {
  return {
    x: containerWidth - width - DEFAULT_MARGIN,
    y: containerHeight - height - DEFAULT_MARGIN,
  };
}

function getMinimizedPosition(width, height, containerWidth, containerHeight) {
  return {
    x: containerWidth - width - DEFAULT_MARGIN,
    y: containerHeight - PEEK_HEIGHT,
  };
}

function getVisibleHeight(y, height, containerHeight) {
  const visibleTop = Math.max(y, 0);
  const visibleBottom = Math.min(y + height, containerHeight);

  return Math.max(0, visibleBottom - visibleTop);
}

function getVisibleRatio(y, height, containerHeight) {
  if (height <= 0) {
    return 0;
  }

  return getVisibleHeight(y, height, containerHeight) / height;
}

function clientToLocal(clientX, clientY, stageRect, scale) {
  return {
    x: (clientX - stageRect.left) / scale,
    y: (clientY - stageRect.top) / scale,
  };
}

function preventFocus(event) {
  event.preventDefault();
}

function RemoteRepeatButton({ className, label, ariaLabel, keyName, codeName, children }) {
  const isHeldRef = useRef(false);
  const focusTargetRef = useRef(null);
  const repeatTimerRef = useRef(null);

  const clearRepeatTimer = useCallback(() => {
    if (repeatTimerRef.current) {
      clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  }, []);

  const releaseKey = useCallback(() => {
    if (!isHeldRef.current) {
      return;
    }

    isHeldRef.current = false;
    clearRepeatTimer();
    dispatchKeyUp(keyName, codeName ?? keyName, focusTargetRef.current);
    focusTargetRef.current = null;
  }, [clearRepeatTimer, codeName, keyName]);

  const startRepeat = useCallback(() => {
    const INITIAL_DELAY_MS = 400;
    const REPEAT_INTERVAL_MS = 50;

    clearRepeatTimer();
    repeatTimerRef.current = setTimeout(function tick() {
      if (!isHeldRef.current) {
        return;
      }

      dispatchKeyDown(keyName, codeName ?? keyName, focusTargetRef.current);
      repeatTimerRef.current = setTimeout(tick, REPEAT_INTERVAL_MS);
    }, INITIAL_DELAY_MS);
  }, [clearRepeatTimer, codeName, keyName]);

  useEffect(() => () => clearRepeatTimer(), [clearRepeatTimer]);

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel ?? label}
      tabIndex={-1}
      onMouseDown={preventFocus}
      onPointerDown={(event) => {
        event.stopPropagation();
        focusTargetRef.current = document.activeElement;
        isHeldRef.current = true;
        dispatchKeyDown(keyName, codeName ?? keyName, focusTargetRef.current);
        startRepeat();
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        releaseKey();
      }}
      onPointerCancel={(event) => {
        event.stopPropagation();
        releaseKey();
      }}
      onLostPointerCapture={() => {
        releaseKey();
      }}
    >
      {children ?? label}
    </button>
  );
}

function RemoteHoldButton({ className, label, ariaLabel, keyName, codeName, children }) {
  const isHeldRef = useRef(false);

  const focusTargetRef = useRef(null);

  const releaseKey = useCallback(() => {
    if (!isHeldRef.current) {
      return;
    }

    isHeldRef.current = false;
    dispatchKeyUp(keyName, codeName ?? keyName, focusTargetRef.current);
    focusTargetRef.current = null;
  }, [codeName, keyName]);

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel ?? label}
      tabIndex={-1}
      onMouseDown={preventFocus}
      onPointerDown={(event) => {
        event.stopPropagation();
        focusTargetRef.current = document.activeElement;
        isHeldRef.current = true;
        dispatchKeyDown(keyName, codeName ?? keyName, focusTargetRef.current);
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        releaseKey();
      }}
      onPointerCancel={(event) => {
        event.stopPropagation();
        releaseKey();
      }}
      onLostPointerCapture={() => {
        releaseKey();
      }}
    >
      {children ?? label}
    </button>
  );
}

function RemoteActionButton({ className, label, ariaLabel, onPress, children }) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel ?? label}
      tabIndex={-1}
      onMouseDown={preventFocus}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onPress?.();
      }}
    >
      {children ?? label}
    </button>
  );
}

function ChevronIcon({ direction }) {
  const rotation =
    direction === 'up'
      ? 0
      : direction === 'right'
        ? 90
        : direction === 'down'
          ? 180
          : 270;

  return (
    <svg
      className="vtr-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path d="M8.12 9.29 12 5.41l3.88 3.88a.996.996 0 1 0 1.41-1.41l-4.59-4.59a.996.996 0 0 0-1.41 0L6.7 7.88a.996.996 0 0 0 0 1.41c.39.39 1.02.39 1.42 0Z" />
    </svg>
  );
}

function FreeCountrySortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (containerRef.current?.contains(event.target)) {
        return;
      }

      setOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [open]);

  const selected =
    FREE_COUNTRY_SORT_OPTIONS.find((option) => option.id === value) ??
    FREE_COUNTRY_SORT_OPTIONS[0];

  return (
    <div className="vtr-dropdown" ref={containerRef}>
      <button
        type="button"
        className="vtr-dropdown-trigger"
        tabIndex={-1}
        aria-expanded={open}
        onMouseDown={preventFocus}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <span className="vtr-dropdown-trigger-label">{selected.label}</span>
        <ChevronIcon direction={open ? 'up' : 'down'} />
      </button>
      {open && (
        <ul className="vtr-dropdown-list">
          {FREE_COUNTRY_SORT_OPTIONS.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className={[
                  'vtr-dropdown-item',
                  value === option.id ? 'vtr-dropdown-item--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                tabIndex={-1}
                onMouseDown={preventFocus}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange?.(option.id);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RemoteMenu({
  items,
  userType,
  onUserTypeChange,
  activeSection,
  freeCountrySort,
  onFreeCountrySortChange,
  onSelect,
}) {
  const showFreeSortSelector =
    userType === 'free' && activeSection === 'Home';

  return (
    <div className="vtr-menu" role="menu" aria-label="Remote menu">
      <p className="vtr-menu-title">Remote</p>
      <div className="vtr-menu-section">
        <p className="vtr-menu-label">User type</p>
        <div className="vtr-user-type-selector" role="group" aria-label="User type">
          {USER_TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={[
                'vtr-user-type-option',
                userType === option.id ? 'vtr-user-type-option--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              tabIndex={-1}
              aria-pressed={userType === option.id}
              onMouseDown={preventFocus}
              onClick={() => onUserTypeChange?.(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {showFreeSortSelector && (
        <div className="vtr-menu-section">
          <p className="vtr-menu-label">Country sort</p>
          <FreeCountrySortDropdown
            value={freeCountrySort}
            onChange={onFreeCountrySortChange}
          />
        </div>
      )}
      <ul className="vtr-menu-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="vtr-menu-item"
              role="menuitem"
              tabIndex={-1}
              onMouseDown={preventFocus}
              onClick={() => onSelect(item)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function VirtualTVRemote({
  onNavigate,
  activeSection = 'Apps',
  userType = 'paid',
  onUserTypeChange,
  freeCountrySort = 'alphabetical',
  onFreeCountrySortChange,
}) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const activePositionRef = useRef(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const dragStateRef = useRef(null);
  const momentumFrameRef = useRef(null);
  const suppressHandleClickRef = useRef(false);
  const suppressRootClickRef = useRef(false);

  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [minimized, setMinimized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [peekHover, setPeekHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState(false);

  const stopMomentum = useCallback(() => {
    if (momentumFrameRef.current) {
      cancelAnimationFrame(momentumFrameRef.current);
      momentumFrameRef.current = null;
    }
  }, []);

  const measure = useCallback(() => {
    const stage = stageRef.current ?? document.getElementById('tv-stage');
    const root = rootRef.current;
    const stageRect = stage?.getBoundingClientRect();
    const scale = stageRect ? stageRect.width / TV_WIDTH : 1;
    const width = root?.offsetWidth ?? 168;
    const height = root?.offsetHeight ?? 520;

    return {
      stage,
      stageRect,
      scale,
      containerWidth: TV_WIDTH,
      containerHeight: TV_HEIGHT,
      width,
      height,
    };
  }, []);

  const applyPosition = useCallback(
    (nextPosition, { animate = false } = {}) => {
      stopMomentum();
      positionRef.current = nextPosition;
      setAnimating(animate);
      setPosition(nextPosition);
    },
    [stopMomentum],
  );

  const initializePosition = useCallback(() => {
    const { containerWidth, containerHeight, width, height } = measure();
    const next = getDefaultPosition(width, height, containerWidth, containerHeight);

    activePositionRef.current = next;
    applyPosition(next, { animate: false });
  }, [applyPosition, measure]);

  const resetPosition = useCallback(() => {
    const { containerWidth, containerHeight, width, height } = measure();
    const next = getDefaultPosition(width, height, containerWidth, containerHeight);

    setMinimized(false);
    setMenuOpen(false);
    activePositionRef.current = next;
    applyPosition(next, { animate: true });
  }, [applyPosition, measure]);

  const finalizeMinimizedPosition = useCallback(() => {
    const { containerWidth, containerHeight, width, height } = measure();
    const current = positionRef.current;
    const visibleRatio = getVisibleRatio(current.y, height, containerHeight);

    if (visibleRatio > 0.5) {
      const fallback = getDefaultPosition(
        width,
        height,
        containerWidth,
        containerHeight,
      );
      const saved = activePositionRef.current ?? fallback;
      const next = clampPosition(
        current.x,
        saved.y,
        width,
        height,
        containerWidth,
        containerHeight,
        false,
      );

      setMinimized(false);
      setPeekHover(false);
      activePositionRef.current = next;
      applyPosition(next, { animate: true });
      return;
    }

    const next = clampPosition(
      current.x,
      containerHeight - PEEK_HEIGHT,
      width,
      height,
      containerWidth,
      containerHeight,
      true,
    );

    applyPosition(next, { animate: true });
  }, [applyPosition, measure]);

  useEffect(() => {
    stageRef.current = document.getElementById('tv-stage');
    setMounted(true);
    initializePosition();
  }, [initializePosition]);

  useEffect(() => {
    const handleResize = () => {
      const { containerWidth, containerHeight, width, height } = measure();

      if (minimized) {
        const current = positionRef.current;
        const next = clampPosition(
          current.x,
          containerHeight - PEEK_HEIGHT,
          width,
          height,
          containerWidth,
          containerHeight,
          true,
        );
        applyPosition(next, { animate: true });
        return;
      }

      const base = activePositionRef.current ?? positionRef.current;
      const next = clampPosition(
        base.x,
        base.y,
        width,
        height,
        containerWidth,
        containerHeight,
        false,
      );

      activePositionRef.current = next;
      applyPosition(next, { animate: false });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [applyPosition, measure, minimized]);

  useEffect(
    () => () => {
      stopMomentum();
    },
    [stopMomentum],
  );

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) {
        return;
      }

      setMenuOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [menuOpen]);

  const runMomentum = useCallback(
    (startPosition, velocity, isMinimized) => {
      stopMomentum();

      let current = { ...startPosition };
      let vx = velocity.x;
      let vy = velocity.y;

      const step = () => {
        vx *= FRICTION;
        vy *= FRICTION;

        if (Math.abs(vx) < MIN_VELOCITY && Math.abs(vy) < MIN_VELOCITY) {
          momentumFrameRef.current = null;
          activePositionRef.current = isMinimized
            ? activePositionRef.current
            : current;
          setAnimating(false);
          return;
        }

        const { containerWidth, containerHeight, width, height } = measure();
        current = clampPosition(
          current.x + vx,
          current.y + vy,
          width,
          height,
          containerWidth,
          containerHeight,
          isMinimized,
        );

        positionRef.current = current;
        setPosition(current);
        momentumFrameRef.current = requestAnimationFrame(step);
      };

      setAnimating(false);
      momentumFrameRef.current = requestAnimationFrame(step);
    },
    [measure, stopMomentum],
  );

  const startDrag = useCallback(
    (clientX, clientY, pointerId, target) => {
      const { stageRect, scale } = measure();

      if (!stageRect) {
        return;
      }

      stopMomentum();
      setAnimating(false);
      setDragging(true);
      setMenuOpen(false);

      const startLocal = clientToLocal(clientX, clientY, stageRect, scale);

      dragStateRef.current = {
        pointerId,
        stageRect,
        scale,
        startLocal,
        origin: { ...positionRef.current },
        lastLocal: startLocal,
        lastTime: performance.now(),
        velocity: { x: 0, y: 0 },
        minimized,
      };

      target.setPointerCapture?.(pointerId);
    },
    [measure, minimized, stopMomentum],
  );

  const moveDrag = useCallback(
    (clientX, clientY) => {
      const dragState = dragStateRef.current;

      if (!dragState) {
        return;
      }

      const local = clientToLocal(
        clientX,
        clientY,
        dragState.stageRect,
        dragState.scale,
      );
      const now = performance.now();
      const dt = Math.max(now - dragState.lastTime, 1);
      const dx = local.x - dragState.lastLocal.x;
      const dy = local.y - dragState.lastLocal.y;

      dragState.velocity = {
        x: (dx / dt) * 16,
        y: (dy / dt) * 16,
      };
      dragState.lastLocal = local;
      dragState.lastTime = now;

      const { containerWidth, containerHeight, width, height } = measure();
      const next = clampPosition(
        dragState.origin.x + (local.x - dragState.startLocal.x),
        dragState.origin.y + (local.y - dragState.startLocal.y),
        width,
        height,
        containerWidth,
        containerHeight,
        dragState.minimized,
      );

      positionRef.current = next;
      setPosition(next);
    },
    [measure],
  );

  const endDrag = useCallback(() => {
    const dragState = dragStateRef.current;

    if (!dragState) {
      return;
    }

    const finalPosition = { ...positionRef.current };
    const velocity = { ...dragState.velocity };
    const movedDistance = Math.hypot(
      dragState.lastLocal.x - dragState.startLocal.x,
      dragState.lastLocal.y - dragState.startLocal.y,
    );
    const wasMinimized = dragState.minimized;

    dragStateRef.current = null;
    setDragging(false);
    suppressHandleClickRef.current = movedDistance >= 4;
    suppressRootClickRef.current = movedDistance >= 4;

    if (!wasMinimized) {
      activePositionRef.current = finalPosition;
    }

    if (wasMinimized) {
      if (movedDistance < 4) {
        setAnimating(false);
        return;
      }

      finalizeMinimizedPosition();
      return;
    }

    if (movedDistance < 4) {
      setAnimating(false);
      return;
    }

    runMomentum(finalPosition, velocity, false);
  }, [finalizeMinimizedPosition, runMomentum]);

  const handlePointerDown = useCallback(
    (event) => {
      if (event.button !== 0) {
        return;
      }

      if (
        event.target.closest('button') ||
        event.target.closest('[data-handle="true"]') ||
        event.target.closest('.vtr-menu')
      ) {
        return;
      }

      startDrag(event.clientX, event.clientY, event.pointerId, event.currentTarget);
    },
    [startDrag],
  );

  const handleHandlePointerDown = useCallback(
    (event) => {
      if (event.button !== 0) {
        return;
      }

      startDrag(event.clientX, event.clientY, event.pointerId, event.currentTarget);
    },
    [startDrag],
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (dragStateRef.current?.pointerId !== event.pointerId) {
        return;
      }

      moveDrag(event.clientX, event.clientY);
    },
    [moveDrag],
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (dragStateRef.current?.pointerId !== event.pointerId) {
        return;
      }

      endDrag();
    },
    [endDrag],
  );

  const minimizeRemote = useCallback(() => {
    const { containerWidth, containerHeight, width, height } = measure();

    if (!minimized) {
      activePositionRef.current = positionRef.current;
    }

    const next = clampPosition(
      positionRef.current.x,
      containerHeight - PEEK_HEIGHT,
      width,
      height,
      containerWidth,
      containerHeight,
      true,
    );

    setMinimized(true);
    setMenuOpen(false);
    setPeekHover(false);
    applyPosition(next, { animate: true });
  }, [applyPosition, measure, minimized]);

  const restoreRemote = useCallback(() => {
    const { containerWidth, containerHeight, width, height } = measure();
    const fallback = getDefaultPosition(
      width,
      height,
      containerWidth,
      containerHeight,
    );
    const saved = activePositionRef.current ?? fallback;
    const next = clampPosition(
      positionRef.current.x,
      saved.y,
      width,
      height,
      containerWidth,
      containerHeight,
      false,
    );

    setMinimized(false);
    setMenuOpen(false);
    setPeekHover(false);
    activePositionRef.current = next;
    applyPosition(next, { animate: true });
  }, [applyPosition, measure]);

  const toggleMinimize = useCallback(() => {
    if (minimized) {
      restoreRemote();
      return;
    }

    minimizeRemote();
  }, [minimizeRemote, minimized, restoreRemote]);

  const handleRootClick = useCallback(
    (event) => {
      if (!minimized) {
        return;
      }

      if (suppressRootClickRef.current) {
        suppressRootClickRef.current = false;
        return;
      }

      event.stopPropagation();
      restoreRemote();
    },
    [minimized, restoreRemote],
  );

  const handleHandleClick = useCallback(
    (event) => {
      event.stopPropagation();

      if (suppressHandleClickRef.current) {
        suppressHandleClickRef.current = false;
        return;
      }

      toggleMinimize();
    },
    [toggleMinimize],
  );

  const handleBackPress = useCallback(() => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }

    dispatchKeyDown('Escape', 'Escape', document.activeElement);
  }, [menuOpen]);

  const handleMenuSelect = useCallback(
    (item) => {
      if (item.id === 'component-library') {
        onNavigate?.('ComponentLibrary');
      }

      if (item.id === 'clear-recents') {
        window.dispatchEvent(new CustomEvent(CLEAR_RECENTS_EVENT));
      }

      setMenuOpen(false);
    },
    [onNavigate],
  );

  if (!mounted) {
    return null;
  }

  const portalTarget = stageRef.current ?? document.getElementById('tv-stage');

  if (!portalTarget) {
    return null;
  }

  const transform = minimized
    ? `translate3d(${position.x}px, ${position.y - (peekHover ? PEEK_HOVER_LIFT : 0)}px, 0)`
    : `translate3d(${position.x}px, ${position.y}px, 0)`;

  const rootClassName = [
    'vtr-root',
    dragging ? 'vtr-root--dragging' : '',
    animating ? 'vtr-root--animating' : '',
    minimized ? 'vtr-root--minimized' : '',
    minimized && peekHover ? 'vtr-root--peek-hover' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div
      ref={rootRef}
      className={rootClassName}
      style={{ transform }}
      tabIndex={-1}
      aria-hidden="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleRootClick}
      onMouseEnter={() => minimized && setPeekHover(true)}
      onMouseLeave={() => minimized && setPeekHover(false)}
    >
      {menuOpen && (
        <RemoteMenu
          items={REMOTE_MENU_ITEMS}
          userType={userType}
          onUserTypeChange={onUserTypeChange}
          activeSection={activeSection}
          freeCountrySort={freeCountrySort}
          onFreeCountrySortChange={onFreeCountrySortChange}
          onSelect={handleMenuSelect}
        />
      )}

      <div className="vtr-shell">
        <div
          className="vtr-handle"
          data-handle="true"
          tabIndex={-1}
          onPointerDown={handleHandlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleHandleClick}
        >
          <span className="vtr-handle-bar" />
        </div>

        <div className="vtr-spacer" />

        <div className="vtr-dpad" aria-label="Directional pad">
          <RemoteRepeatButton
            className="vtr-dpad-btn vtr-dpad-btn--up"
            ariaLabel="Up"
            keyName="ArrowUp"
            codeName="ArrowUp"
          >
            <ChevronIcon direction="up" />
          </RemoteRepeatButton>
          <RemoteRepeatButton
            className="vtr-dpad-btn vtr-dpad-btn--right"
            ariaLabel="Right"
            keyName="ArrowRight"
            codeName="ArrowRight"
          >
            <ChevronIcon direction="right" />
          </RemoteRepeatButton>
          <RemoteRepeatButton
            className="vtr-dpad-btn vtr-dpad-btn--down"
            ariaLabel="Down"
            keyName="ArrowDown"
            codeName="ArrowDown"
          >
            <ChevronIcon direction="down" />
          </RemoteRepeatButton>
          <RemoteRepeatButton
            className="vtr-dpad-btn vtr-dpad-btn--left"
            ariaLabel="Left"
            keyName="ArrowLeft"
            codeName="ArrowLeft"
          >
            <ChevronIcon direction="left" />
          </RemoteRepeatButton>
          <RemoteHoldButton
            className="vtr-dpad-ok"
            label="OK"
            ariaLabel="OK"
            keyName="Enter"
            codeName="Enter"
          />
        </div>

        <div className="vtr-spacer vtr-spacer--large" />

        <div className="vtr-actions">
          <RemoteActionButton
            className="vtr-action-btn"
            label="Back"
            onPress={handleBackPress}
          />
          <RemoteActionButton
            className="vtr-action-btn"
            label="Menu"
            onPress={() => setMenuOpen((open) => !open)}
          />
        </div>

        <div className="vtr-spacer vtr-spacer--xlarge" />

        <RemoteActionButton
          className="vtr-minimize"
          ariaLabel="Minimize remote"
          onPress={minimizeRemote}
        >
          <ChevronIcon direction="down" />
        </RemoteActionButton>
      </div>
    </div>,
    portalTarget,
  );
}
