import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';

export default function Upsell() {
  return (
    <View style={styles.screen}>
      <Text style={styles.placeholder}>Upsell goes here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: TV_WIDTH,
    height: TV_HEIGHT,
    backgroundColor: colors.backgroundDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 29,
    lineHeight: 36,
    color: colors.textWeak,
  },
});
