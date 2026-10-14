export function contrastForeground(color: string) {
  const hex = color.match(/^#([\da-f]{6})$/i)?.[1]
  if (!hex) return '#ffffff'
  const channels = [0, 2, 4]
      .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
      .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)),
    luminance = channels.reduce(
      (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
      0,
    )
  return luminance > 0.179 ? '#111111' : '#ffffff'
}
export const themeAccent = (accent: string, theme: 'light' | 'dark') =>
  accent === '#b93e28' && theme === 'dark' ? '#f17c5e' : accent
