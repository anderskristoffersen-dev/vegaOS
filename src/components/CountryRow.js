import { StyleSheet, View } from 'react-native';
import { FOCUS_OUT_DURATION, FOCUS_OUT_EASING } from '../Styles/motion';
import { getHomeRevealStyle, getHomeTileRevealDelayMs } from '../utils/homeReveal';
import { buildIntentFromCountryTile, withIntentKey } from '../utils/connection';
import CountryTile from './CountryTile';

export const TILE_WIDTH = 250;
export const TILE_HEIGHT = 327;
export const TILE_GAP = 8;
export const ROW_GAP = 16;
export const ROW_WIDTH = TILE_WIDTH * 6 + TILE_GAP * 5;

export default function CountryRow({
  selected = false,
  countries = [],
  rowIndex,
  activeTile,
  connectionSourceTile = null,
  connectionIntentKey = null,
  tileIntentKeys = null,
  tileLabels = null,
  tileSubtitles = null,
  allowAllContextMenus = false,
  hideCityCount = false,
  isPlusServerAtCol = null,
  connectionState = 'unprotected',
  menuOpenOnRow = false,
  menuSourceCol = null,
  menuSource,
  shortPressPulse,
  onTileFocus,
  onTilePress,
  onTileLongPress,
  tileRefs,
  countriesRevealed = true,
  style,
}) {
  return (
    <View
      style={[
        styles.row,
        {
          opacity: selected ? 1 : 0.5,
          transitionProperty: 'opacity',
          transitionDuration: `${FOCUS_OUT_DURATION}ms`,
          transitionTimingFunction: FOCUS_OUT_EASING,
        },
        style,
      ]}
    >
      {countries.map((country, colIndex) => {
        const isActiveTile =
          activeTile?.row === rowIndex && activeTile?.col === colIndex;
        const isMenuSource =
          menuSource?.row === rowIndex && menuSource?.col === colIndex;
        const dimmed =
          menuOpenOnRow &&
          menuSourceCol !== null &&
          colIndex !== menuSourceCol;
        const canOpenMenu =
          allowAllContextMenus ||
          (country.slug !== 'fastest' &&
            !(isPlusServerAtCol?.(colIndex) ?? false));
        const tileIntentKey =
          tileIntentKeys?.[colIndex] ??
          withIntentKey(buildIntentFromCountryTile(country)).intentKey;
        const isConnectionSource =
          (connectionSourceTile?.row === rowIndex &&
            connectionSourceTile?.col === colIndex) ||
          (connectionIntentKey &&
            tileIntentKey &&
            connectionIntentKey === tileIntentKey);
        const tileConnectionState = isConnectionSource
          ? connectionState === 'connecting'
            ? 'connecting'
            : connectionState === 'protected'
              ? 'connected'
              : null
          : null;

        return (
          <View
            key={country.slug}
            style={getHomeRevealStyle(
              countriesRevealed,
              getHomeTileRevealDelayMs(rowIndex, colIndex),
            )}
          >
            <CountryTile
              ref={(node) => {
                if (tileRefs?.current?.[rowIndex]) {
                  tileRefs.current[rowIndex][colIndex] = node;
                }
              }}
              label={tileLabels?.[colIndex] ?? country.name}
              flag={country.flag}
              subtitle={tileSubtitles?.[colIndex] ?? null}
              cityCount={hideCityCount ? 0 : country.cities.length}
            tileConnectionState={tileConnectionState}
            isActiveTile={isActiveTile}
            isMenuSource={isMenuSource}
            dimmed={dimmed}
            isPlusServer={isPlusServerAtCol?.(colIndex) ?? false}
            shortPressPulse={
              shortPressPulse?.row === rowIndex &&
              shortPressPulse?.col === colIndex
                ? shortPressPulse.id
                : 0
            }
            onPress={() => onTilePress?.(rowIndex, colIndex)}
            onFocus={() => {
              if (!isActiveTile) {
                onTileFocus?.(rowIndex, colIndex);
              }
            }}
            onLongPress={
              canOpenMenu
                ? () => onTileLongPress?.(rowIndex, colIndex)
                : undefined
            }
          />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: ROW_WIDTH,
    flexDirection: 'row',
    gap: TILE_GAP,
    overflow: 'visible',
  },
});
