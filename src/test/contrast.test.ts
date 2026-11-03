import { describe, expect, it } from 'vitest'
import { contrastForeground } from '@/lib/contrast'

function luminance(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((channel) => parseInt(channel, 16) / 255)
  return rgb.reduce(
    (sum, channel, index) =>
      sum +
      (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4) *
        [0.2126, 0.7152, 0.0722][index],
    0,
  )
}

describe('theme foreground contrast', () => {
  it('keeps normal text readable around the mid-luminance boundary and across grayscale', () => {
    const backgrounds = [
      '#36836a',
      '#5579bd',
      '#9864af',
      '#f17c5e',
      ...Array.from(
        { length: 256 },
        (_, channel) => `#${channel.toString(16).padStart(2, '0').repeat(3)}`,
      ),
    ]
    for (const background of backgrounds) {
      const backgroundLuminance = luminance(background)
      const foregroundLuminance = luminance(contrastForeground(background))
      expect(
        (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) /
          (Math.min(backgroundLuminance, foregroundLuminance) + 0.05),
        background,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })
})
