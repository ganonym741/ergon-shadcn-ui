function parts(value: string) {
  const match = value.trim().match(/^([+-]?)(\d*)(?:\.(\d*))?$/)
  if (!match || (!match[2] && !match[3])) throw new Error('Enter a decimal number')
  const decimals = match[3] ?? ''
  return {
    value: BigInt((match[1] === '-' ? '-' : '') + (match[2] || '0') + decimals),
    scale: decimals.length,
  }
}
export function addDecimal(a: string, b: string) {
  const x = parts(a),
    y = parts(b),
    scale = Math.max(x.scale, y.scale)
  const value = x.value * 10n ** BigInt(scale - x.scale) + y.value * 10n ** BigInt(scale - y.scale)
  const absolute = (value < 0n ? -value : value).toString().padStart(scale + 1, '0')
  const result =
    (value < 0n ? '-' : '') +
    (scale ? absolute.slice(0, -scale) + '.' + absolute.slice(-scale) : absolute)
  return result.includes('.') ? result.replace(/0+$/, '').replace(/\.$/, '') : result
}
export function compareDecimal(a: string, b: string) {
  const x = parts(a),
    y = parts(b),
    scale = Math.max(x.scale, y.scale),
    left = x.value * 10n ** BigInt(scale - x.scale),
    right = y.value * 10n ** BigInt(scale - y.scale)
  return left < right ? -1 : left > right ? 1 : 0
}
