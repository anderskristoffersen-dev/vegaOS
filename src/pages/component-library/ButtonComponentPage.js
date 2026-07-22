import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../../components/Button';
import MotionTimeline from '../../components/MotionTimeline';
import SegmentedControl from '../../components/SegmentedControl';
import { colors } from '../../Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from '../../Styles/viewport';

export const BUTTON_FOCUS_SCALE = 1.1;

const TABS = [
  { id: 'example', label: 'Example' },
  { id: 'motion', label: 'Motion' },
];

export const BUTTON_MOTION_CHANNELS = [
  {
    id: 'scale',
    label: 'Scale',
    rest: 1,
    focused: BUTTON_FOCUS_SCALE,
    interpolate: (progress, rest, focused) => rest + (focused - rest) * progress,
    normalize: (value) => (value - 1) / (BUTTON_FOCUS_SCALE - 1),
    formatRest: (value) => value.toFixed(2),
    formatFocused: (value) => value.toFixed(2),
  },
  {
    id: 'background',
    label: 'Background',
    type: 'color',
    rest: colors.backgroundSecondary,
    focused: colors.backgroundSelected,
  },
  {
    id: 'text-color',
    label: 'Text color',
    type: 'color',
    rest: colors.textNorm,
    focused: colors.textInvert,
  },
  {
    id: 'shadow',
    label: 'Shadow',
    rest: 0,
    focused: 1,
    interpolate: (progress, rest, focused) => rest + (focused - rest) * progress,
    normalize: (value) => value,
    formatRest: () => '0%',
    formatFocused: () => '100%',
  },
];

export default function ButtonComponentPage() {
  const [activeTab, setActiveTab] = useState('example');

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <SegmentedControl
          options={TABS}
          value={activeTab}
          onChange={setActiveTab}
        />
      </View>

      <View style={styles.stage}>
        <View style={styles.buttonRow}>
          <Button buttonText="Button label" hasTVPreferredFocus />
          <Button buttonText="Button label" />
        </View>

        {activeTab === 'motion' && (
          <MotionTimeline channels={BUTTON_MOTION_CHANNELS} direction="in" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: TV_WIDTH,
    height: TV_HEIGHT,
    backgroundColor: colors.backgroundDeep,
  },
  topBar: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 80,
    overflow: 'visible',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    overflow: 'visible',
  },
});
