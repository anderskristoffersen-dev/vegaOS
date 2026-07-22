import { Image, StyleSheet, Text, View } from 'react-native';
import StageBackground from '../components/StageBackground';
import { colors } from '../Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';

import plusBadgeImage from '../assets/country-tile/plus-badge.svg';
import qrcodeImage from '../assets/sign-in/qrcode.png';
import checkIcon from '../assets/upsell/check-icon.svg';
import crossIcon from '../assets/upsell/cross-icon.svg';

const PLUS_GREEN = '#1C9C7C';
const PLUS_COLUMN_BG = 'rgba(57, 227, 185, 0.16)';
const TABLE_BORDER = 'rgba(0, 0, 0, 0.1)';

const FEATURE_ROWS = [
  { label: 'Available countries', free: '10', plus: '140+' },
  { label: 'Streaming', free: 'cross', plus: 'check' },
  { label: 'High-speed servers', free: 'cross', plus: 'check' },
];

function ComparisonCell({ children, isPlusColumn = false, isHeader = false }) {
  return (
    <View
      style={[
        styles.tableCell,
        isHeader && styles.tableHeaderCell,
        isPlusColumn && styles.plusTableCell,
      ]}
    >
      {children}
    </View>
  );
}

function ComparisonValue({ value, isPlusColumn = false }) {
  if (value === 'cross') {
    return (
      <Image
        source={crossIcon}
        style={styles.tableIcon}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Not included"
      />
    );
  }

  if (value === 'check') {
    return (
      <Image
        source={checkIcon}
        style={styles.tableIcon}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Included"
      />
    );
  }

  return (
    <Text
      style={[
        styles.tableValue,
        isPlusColumn ? styles.plusTableValue : styles.freeTableValue,
      ]}
    >
      {value}
    </Text>
  );
}

export default function Upsell({ countryName = 'United States' }) {
  const title = `Unlock ${countryName} with VPN\u00A0Plus`;

  return (
    <View style={styles.screen}>
      <StageBackground />

      <View style={styles.layout}>
        <View style={styles.contentColumn}>
          <View style={styles.titleBlock}>
            <Image
              source={plusBadgeImage}
              style={styles.titlePlusBadge}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="VPN Plus"
            />

            <Text style={styles.title}>{title}</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.featureColumn}>
              <View style={styles.featureHeaderSpacer}>
                <Text style={styles.featureHeaderLabel}>Benefits</Text>
              </View>
              {FEATURE_ROWS.map((row) => (
                <View key={row.label} style={styles.featureRow}>
                  <Text style={styles.featureLabel}>{row.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.freeColumn}>
              <ComparisonCell isHeader>
                <Text style={styles.columnHeader}>Free</Text>
              </ComparisonCell>
              {FEATURE_ROWS.map((row) => (
                <ComparisonCell key={row.label}>
                  <ComparisonValue value={row.free} />
                </ComparisonCell>
              ))}
            </View>

            <View style={styles.plusColumn}>
              <ComparisonCell isHeader isPlusColumn>
                <Text style={styles.plusBadgeLabel}>Plus</Text>
              </ComparisonCell>
              {FEATURE_ROWS.map((row) => (
                <ComparisonCell key={row.label} isPlusColumn>
                  <ComparisonValue value={row.plus} isPlusColumn />
                </ComparisonCell>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.qrColumn}>
          <View style={styles.qrFrame}>
            <Image
              source={qrcodeImage}
              style={styles.qrCode}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          </View>

          <View style={styles.qrTextBlock}>
            <Text style={styles.qrInstruction}>Scan the code or visit:</Text>
            <Text style={styles.qrUrl}>protonvpn.com/upgrade-tv</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: TV_WIDTH,
    height: TV_HEIGHT,
    backgroundColor: colors.backgroundDeep,
    overflow: 'hidden',
  },
  layout: {
    position: 'absolute',
    top: 216,
    left: 0,
    width: TV_WIDTH,
    paddingHorizontal: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 100,
  },
  contentColumn: {
    flex: 1,
    gap: 56,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 36,
  },
  titlePlusBadge: {
    width: 136,
    height: 75,
  },
  title: {
    width: '100%',
    fontSize: 57,
    fontWeight: '700',
    lineHeight: 66,
    color: colors.textNorm,
    textAlign: 'center',
  },
  table: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
  },
  featureColumn: {
    alignItems: 'flex-start',
  },
  featureHeaderSpacer: {
    paddingVertical: 24,
    paddingRight: 24,
    height: 88,
    justifyContent: 'center',
    opacity: 0,
  },
  featureHeaderLabel: {
    fontSize: 28,
    lineHeight: 40,
    color: colors.textWeak,
  },
  featureRow: {
    height: 88,
    paddingVertical: 24,
    paddingRight: 32,
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: TABLE_BORDER,
  },
  featureLabel: {
    fontSize: 29,
    lineHeight: 36,
    color: colors.textNorm,
  },
  freeColumn: {
    width: 140,
  },
  plusColumn: {
    width: 180,
    backgroundColor: PLUS_COLUMN_BG,
    borderRadius: 32,
    overflow: 'hidden',
  },
  tableCell: {
    height: 88,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: TABLE_BORDER,
  },
  tableHeaderCell: {
    borderBottomWidth: 0,
  },
  plusTableCell: {
    borderBottomColor: TABLE_BORDER,
  },
  columnHeader: {
    fontSize: 29,
    lineHeight: 36,
    color: colors.textWeak,
  },
  tableValue: {
    fontSize: 29,
    lineHeight: 36,
  },
  freeTableValue: {
    color: colors.textWeak,
  },
  plusTableValue: {
    color: PLUS_GREEN,
  },
  plusBadgeLabel: {
    fontSize: 29,
    fontWeight: '700',
    lineHeight: 36,
    color: PLUS_GREEN,
  },
  tableIcon: {
    width: 48,
    height: 48,
  },
  qrColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 84,
  },
  qrFrame: {
    width: 440,
    height: 440,
    padding: 11.579,
    borderRadius: 27.789,
    backgroundColor: colors.backgroundSelected,
    overflow: 'hidden',
  },
  qrCode: {
    width: 416.842,
    height: 416.842,
  },
  qrTextBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  qrInstruction: {
    width: '100%',
    fontSize: 38,
    lineHeight: 46,
    color: colors.textWeak,
    textAlign: 'center',
  },
  qrUrl: {
    width: '100%',
    fontSize: 48,
    lineHeight: 56,
    color: colors.textNorm,
    textAlign: 'center',
  },
});
