export default class Util {
  static hexadecimalToNumber(colorCode) {
    // Make sure there is no '#' character and convert to uppercase
    colorCode = colorCode.replace('#', '').toUpperCase();
    return `0x${colorCode}`;
  }
}
