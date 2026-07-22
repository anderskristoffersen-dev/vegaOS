import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../Styles/colors';

import magnifierIcon from '../assets/icons/ic-magnifier.svg?raw';

const ICON_SIZE = 48;

function SearchIcon({ active }) {
  const color = active ? colors.textNorm : colors.textWeak;
  const svg = magnifierIcon.replaceAll('currentColor', color);

  return (
    <Image
      source={{
        uri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      }}
      style={[styles.icon, { opacity: active ? 1 : 0.5 }]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Search"
    />
  );
}

export default function SearchInput({ query = '', style }) {
  const hasInput = query.length > 0;

  return (
    <View style={[styles.container, style]}>
      <SearchIcon active={hasInput} />
      <Text
        style={[styles.text, hasInput ? styles.textActive : styles.textPlaceholder]}
        numberOfLines={1}
      >
        {hasInput ? query : 'Search...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  text: {
    fontSize: 48,
    fontWeight: '400',
    lineHeight: 56,
  },
  textPlaceholder: {
    color: colors.textWeak,
    opacity: 0.5,
  },
  textActive: {
    color: colors.textNorm,
    opacity: 1,
  },
});
