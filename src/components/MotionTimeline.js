import { createElement, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../Styles/colors';
import {
  FOCUS_IN_DURATION,
  FOCUS_IN_EASING,
  FOCUS_OUT_DURATION,
  FOCUS_OUT_EASING,
} from '../Styles/motion';

const TIMELINE_WIDTH = 960;
const ROW_HEIGHT = 72;
const LABEL_WIDTH = 160;
const GRAPH_HEIGHT = 40;

function parseCubicBezier(easing) {
  const match = easing.match(
    /cubic-bezier\(\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*\)/,
  );

  if (!match) {
    return [0, 0, 1, 1];
  }

  return match.slice(1, 5).map(Number);
}

function cubicBezierPoint(t, p0, p1, p2, p3) {
  const inverseT = 1 - t;

  return (
    inverseT ** 3 * p0 +
    3 * inverseT ** 2 * t * p1 +
    3 * inverseT * t ** 2 * p2 +
    t ** 3 * p3
  );
}

function sampleEasing(easing, samples = 48) {
  const [x1, y1, x2, y2] = parseCubicBezier(easing);
  const points = [];

  for (let index = 0; index <= samples; index += 1) {
    const targetX = index / samples;
    let start = 0;
    let end = 1;

    for (let step = 0; step < 24; step += 1) {
      const mid = (start + end) / 2;
      const x = cubicBezierPoint(mid, 0, x1, x2, 1);

      if (x < targetX) {
        start = mid;
      } else {
        end = mid;
      }
    }

    const parameter = (start + end) / 2;
    const y = cubicBezierPoint(parameter, 0, y1, y2, 1);
    points.push({ x: targetX, y });
  }

  return points;
}

function buildPath(points, width, height, padding = 4) {
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  return points
    .map(({ x, y }, index) => {
      const px = padding + x * graphWidth;
      const py = padding + (1 - y) * graphHeight;
      return `${index === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`;
    })
    .join(' ');
}

function NumericTimelineRow({ label, restLabel, focusedLabel, points }) {
  const path = buildPath(points, TIMELINE_WIDTH, GRAPH_HEIGHT);

  return (
    <View style={styles.row}>
      <View style={styles.labelColumn}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowMeta}>
          {restLabel} → {focusedLabel}
        </Text>
      </View>
      <View style={styles.graphColumn}>
        <View style={styles.axisLabels}>
          <Text style={styles.axisLabel}>0</Text>
          <Text style={styles.axisCaption}>Rest</Text>
          <View style={styles.axisSpacer} />
          <Text style={styles.axisCaption}>Focused</Text>
          <Text style={styles.axisLabel}>1</Text>
        </View>
        <View style={styles.graphFrame}>
          {createElement(
            'svg',
            {
              width: TIMELINE_WIDTH,
              height: GRAPH_HEIGHT,
              viewBox: `0 0 ${TIMELINE_WIDTH} ${GRAPH_HEIGHT}`,
              style: { display: 'block', overflow: 'visible' },
            },
            createElement('path', {
              d: path,
              fill: 'none',
              stroke: colors.textAccent,
              strokeWidth: 3,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }),
            createElement('line', {
              x1: 4,
              y1: GRAPH_HEIGHT - 4,
              x2: TIMELINE_WIDTH - 4,
              y2: 4,
              stroke: 'rgba(167, 164, 181, 0.35)',
              strokeWidth: 1,
              strokeDasharray: '6 6',
            }),
          )}
        </View>
      </View>
    </View>
  );
}

function ColorTimelineRow({ label, restColor, focusedColor, points }) {
  const path = buildPath(points, TIMELINE_WIDTH, GRAPH_HEIGHT);

  return (
    <View style={styles.row}>
      <View style={styles.labelColumn}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.colorSwatches}>
          <View style={[styles.swatch, { backgroundColor: restColor }]} />
          <Text style={styles.rowMeta}>→</Text>
          <View style={[styles.swatch, { backgroundColor: focusedColor }]} />
        </View>
      </View>
      <View style={styles.graphColumn}>
        <View style={styles.axisLabels}>
          <Text style={styles.axisLabel}>0</Text>
          <Text style={styles.axisCaption}>Rest</Text>
          <View style={styles.axisSpacer} />
          <Text style={styles.axisCaption}>Focused</Text>
          <Text style={styles.axisLabel}>1</Text>
        </View>
        <View style={styles.graphFrame}>
          {createElement(
            'svg',
            {
              width: TIMELINE_WIDTH,
              height: GRAPH_HEIGHT,
              viewBox: `0 0 ${TIMELINE_WIDTH} ${GRAPH_HEIGHT}`,
              style: { display: 'block', overflow: 'visible' },
            },
            createElement('defs', null, createElement(
              'linearGradient',
              { id: `gradient-${label}`, x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
              createElement('stop', { offset: '0%', stopColor: restColor }),
              createElement('stop', { offset: '100%', stopColor: focusedColor }),
            )),
            createElement('rect', {
              x: 4,
              y: 8,
              width: TIMELINE_WIDTH - 8,
              height: GRAPH_HEIGHT - 16,
              rx: 8,
              fill: `url(#gradient-${label})`,
              opacity: 0.45,
            }),
            createElement('path', {
              d: path,
              fill: 'none',
              stroke: colors.textNorm,
              strokeWidth: 3,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }),
          )}
        </View>
      </View>
    </View>
  );
}

export default function MotionTimeline({ channels, direction = 'in' }) {
  const easing = direction === 'in' ? FOCUS_IN_EASING : FOCUS_OUT_EASING;
  const duration = direction === 'in' ? FOCUS_IN_DURATION : FOCUS_OUT_DURATION;
  const points = useMemo(() => sampleEasing(easing), [easing]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Focus {direction === 'in' ? 'in' : 'out'} timeline</Text>
        <Text style={styles.subtitle}>
          {duration}ms · {easing}
        </Text>
      </View>

      {channels.map((channel) => {
        if (channel.type === 'color') {
          return (
            <ColorTimelineRow
              key={channel.id}
              label={channel.label}
              restColor={channel.rest}
              focusedColor={channel.focused}
              points={points}
            />
          );
        }

        return (
          <NumericTimelineRow
            key={channel.id}
            label={channel.label}
            restLabel={channel.formatRest(channel.rest)}
            focusedLabel={channel.formatFocused(channel.focused)}
            points={points.map(({ x, y }) => ({
              x,
              y: channel.normalize(
                channel.interpolate(y, channel.rest, channel.focused),
              ),
            }))}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: LABEL_WIDTH + TIMELINE_WIDTH + 48,
    gap: 24,
  },
  header: {
    gap: 4,
    paddingLeft: LABEL_WIDTH + 24,
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 32,
    color: colors.textNorm,
  },
  subtitle: {
    fontSize: 21,
    fontWeight: '400',
    lineHeight: 28,
    color: colors.textWeak,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    minHeight: ROW_HEIGHT,
  },
  labelColumn: {
    width: LABEL_WIDTH,
    gap: 8,
  },
  rowLabel: {
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 30,
    color: colors.textNorm,
  },
  rowMeta: {
    fontSize: 19,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textWeak,
  },
  colorSwatches: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(250, 250, 251, 0.16)',
  },
  graphColumn: {
    gap: 8,
  },
  axisLabels: {
    width: TIMELINE_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    color: colors.textWeak,
  },
  axisCaption: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.textWeak,
  },
  axisSpacer: {
    flex: 1,
  },
  graphFrame: {
    width: TIMELINE_WIDTH,
    height: GRAPH_HEIGHT,
    borderRadius: 12,
    backgroundColor: colors.backgroundNorm,
    overflow: 'hidden',
  },
});
