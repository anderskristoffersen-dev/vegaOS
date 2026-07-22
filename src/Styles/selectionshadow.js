// Shared focus/selection shadow from Figma
// Shadow 1: x 0, y 24, blur 120, spread 0, #000000 32%
// Shadow 2: x 0, y 16, blur 48, spread 0, #000000 64%

const shadow1 = '0px 24px 120px 0px rgba(0, 0, 0, 0.32)';
const shadow2 = '0px 16px 48px 0px rgba(0, 0, 0, 0.64)';

export const selectionShadow = {
  boxShadow: `${shadow1}, ${shadow2}`,
};
