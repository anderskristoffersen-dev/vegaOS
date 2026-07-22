import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../Styles/colors';
import { getFocusTransition } from '../Styles/motion';

export default function SegmentedControl({
  options,
  value,
  onChange,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isActive = option.id === value;

        return (
          <Pressable
            key={option.id}
            focusable
            onPress={() => onChange(option.id)}
            style={[
              styles.segment,
              isActive && styles.segmentActive,
              {
                transitionProperty: 'background-color',
                ...getFocusTransition(isActive),
              },
            ]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.backgroundNorm,
    gap: 4,
  },
  segment: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.backgroundSelected,
  },
  label: {
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 32,
    color: colors.textWeak,
  },
  labelActive: {
    color: colors.textInvert,
  },
});
