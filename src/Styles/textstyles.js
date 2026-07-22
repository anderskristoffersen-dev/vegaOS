import { colors } from './colors';

export const textStyles = {
  // Heading Styles
  headingLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.textNorm,
  },
  headingMedium: {
    fontSize: 36,
    fontWeight: '600',
    color: colors.textNorm,
  },
  headingSmall: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textNorm,
  },

  // Body Styles
  bodyNormal: {
    fontSize: 18,
    color: colors.textNorm,
  },
  bodyWeak: {
    fontSize: 16,
    color: colors.textWeak,
  },

  // Caption/Instruction Styles
  caption: {
    fontSize: 14,
    color: colors.textWeak,
  },
  instruction: {
    fontSize: 16,
    color: colors.textWeak,
  },

  // Button/Action Styles
  buttonLabel: {
    fontSize: 18,
    textAlign: 'center',
  },
  buttonLabelFocused: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.textInvert,
  },
};
