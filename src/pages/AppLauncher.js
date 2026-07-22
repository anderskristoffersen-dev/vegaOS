import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AppTile, { TILE_HEIGHT, TILE_WIDTH } from '../components/AppTile';
import { isActivationKey } from '../utils/dispatchKey';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';

import app26 from '../assets/apps/app-26.png';
import app27 from '../assets/apps/app-27.png';
import app28 from '../assets/apps/app-28.png';
import app29 from '../assets/apps/app-29.png';
import app30 from '../assets/apps/app-30.png';

const GRID_LEFT = 146;
const GRID_TOP = 473;
const TILE_GAP_X = 32;
const TILE_GAP_Y = 84.25;
const TOP_ROW_COUNT = 5;
const ROW_COUNT = 3;

const TOP_ROW_APPS = [
  { id: '26', image: app26 },
  { id: '27', image: app27 },
  { id: '28', image: app28 },
  { id: '29', image: app29 },
  { id: '30', image: app30 },
];

function getTilePosition(columnIndex, rowIndex) {
  return {
    left: GRID_LEFT + columnIndex * (TILE_WIDTH + TILE_GAP_X),
    top: GRID_TOP + rowIndex * (TILE_HEIGHT + TILE_GAP_Y),
  };
}

export default function AppLauncher({ onOpenWelcome }) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const tileRefs = useRef([]);
  const focusedIndexRef = useRef(focusedIndex);
  focusedIndexRef.current = focusedIndex;

  const focusTile = useCallback((index) => {
    setFocusedIndex(index);
    tileRefs.current[index]?.focus?.();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        focusTile(Math.max(0, focusedIndexRef.current - 1));
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        focusTile(Math.min(TOP_ROW_COUNT - 1, focusedIndexRef.current + 1));
        return;
      }

      if (isActivationKey(event.key)) {
        const tile = tileRefs.current[focusedIndexRef.current];

        if (tile?.press) {
          event.preventDefault();
          event.stopPropagation();
          tile.press();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [focusTile]);

  return (
    <View style={styles.screen}>
      {TOP_ROW_APPS.map((app, index) => {
        const position = getTilePosition(index, 0);

        return (
          <AppTile
            key={app.id}
            ref={(node) => {
              tileRefs.current[index] = node;
            }}
            source={app.image}
            focused={focusedIndex === index}
            hasTVPreferredFocus={index === 0}
            onFocus={() => setFocusedIndex(index)}
            onPress={index === 0 ? onOpenWelcome : undefined}
            style={{ position: 'absolute', ...position }}
          />
        );
      })}

      {Array.from({ length: ROW_COUNT - 1 }).flatMap((_, rowOffset) =>
        Array.from({ length: TOP_ROW_COUNT }).map((__, columnIndex) => {
          const rowIndex = rowOffset + 1;
          const position = getTilePosition(columnIndex, rowIndex);

          return (
            <AppTile
              key={`placeholder-${rowIndex}-${columnIndex}`}
              placeholder
              focusable={false}
              style={{ position: 'absolute', ...position }}
            />
          );
        }),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: TV_WIDTH,
    height: TV_HEIGHT,
    backgroundColor: '#1E1E1E',
  },
});
