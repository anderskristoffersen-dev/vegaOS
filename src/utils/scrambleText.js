export function getScramblableIndices(text) {
  return text
    .split('')
    .map((char, index) => (char !== '.' ? index : -1))
    .filter((index) => index !== -1);
}

export function scrambleTextAtIndices(text, scrambledIndices) {
  const scrambled = new Set(scrambledIndices);

  return text
    .split('')
    .map((char, index) => {
      if (char === '.') {
        return char;
      }

      return scrambled.has(index) ? '*' : char;
    })
    .join('');
}
