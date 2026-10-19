export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsb'
export function colorChannels(hex: string, format: ColorFormat) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255),
    max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    l = (max + min) / 2,
    h =
      d === 0
        ? 0
        : (max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60
  if (format === 'rgb') return [r * 255, g * 255, b * 255]
  return [
    h,
    format === 'hsb' ? (max ? d / max : 0) * 100 : (d ? d / (1 - Math.abs(2 * l - 1)) : 0) * 100,
    (format === 'hsb' ? max : l) * 100,
  ]
}
export function channelsToHex(channels: number[], format: ColorFormat) {
  let rgb: number[]
  if (format === 'rgb') rgb = channels
  else {
    const [h, s, v] = [channels[0], channels[1] / 100, channels[2] / 100],
      c = format === 'hsb' ? v * s : (1 - Math.abs(2 * v - 1)) * s,
      x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
      m = format === 'hsb' ? v - c : v - c / 2
    rgb = (
      h < 60
        ? [c, x, 0]
        : h < 120
          ? [x, c, 0]
          : h < 180
            ? [0, c, x]
            : h < 240
              ? [0, x, c]
              : h < 300
                ? [x, 0, c]
                : [c, 0, x]
    ).map((n) => (n + m) * 255)
  }
  return (
    '#' +
    rgb
      .map((n) =>
        Math.round(Math.max(0, Math.min(255, n)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}
