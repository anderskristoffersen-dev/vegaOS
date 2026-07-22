import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../Styles/colors';
import { FOCUS_OUT_DURATION, FOCUS_OUT_EASING } from '../Styles/motion';

export const GRID_TITLE_HEIGHT = 66;
export const GRID_TITLE_PADDING_LEFT = 20;
export const GRID_TITLE_PADDING_VERTICAL = 10;

export default function CountryGridTitle({
  label = 'All countries',
  selected = false,
  style,
}) {
  return (
    <View
      style={[
        styles.container,
        {
          opacity: selected ? 1 : 0.5,
          transitionProperty: 'opacity',
          transitionDuration: `${FOCUS_OUT_DURATION}ms`,
          transitionTimingFunction: FOCUS_OUT_EASING,
        },
        style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: GRID_TITLE_PADDING_LEFT,
    paddingVertical: GRID_TITLE_PADDING_VERTICAL,
  },
  label: {
    fontSize: 38,
    fontWeight: '400',
    lineHeight: 46,
    color: colors.textNorm,
  },
});
