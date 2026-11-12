import * as React from 'react'

export interface TextStreamOptions {
  /** Reveal incoming text progressively, or display each received chunk immediately. */
  textAnimation?: 'typewriter' | 'none'
  /** Graphemes revealed per second, from 1 to 1,000. Defaults to 60. */
  charactersPerSecond?: number
}

/** Keeps network chunks separate from presentation. Completed history is displayed immediately. */
export function useTextStream(
  content: string,
  {
    streaming = false,
    textAnimation = 'typewriter',
    charactersPerSecond = 60,
    streamKey,
    immediate = false,
  }: TextStreamOptions & {
    streaming?: boolean
    streamKey?: string | number
    immediate?: boolean
  } = {},
) {
  // Older engines without grapheme segmentation fall back to immediate, intact text.
  const enabled =
    textAnimation === 'typewriter' && !immediate && typeof Intl.Segmenter === 'function'
  const boundaries = React.useMemo(() => {
    const offsets = [0]
    if (!enabled) return content ? [0, content.length] : offsets
    // Segment once per received chunk, never once per animation frame.
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    for (const part of segmenter.segment(content)) offsets.push(part.index + part.segment.length)
    return offsets
  }, [content, enabled])
  const length = boundaries.length - 1
  const [state, setState] = React.useState(() => ({
    content,
    streamKey,
    enabled,
    streaming,
    index: enabled && streaming ? 0 : length,
    session: enabled && streaming,
    epoch: 0,
  }))
  if (
    state.content !== content ||
    state.streamKey !== streamKey ||
    state.enabled !== enabled ||
    state.streaming !== streaming
  ) {
    const reset = state.streamKey !== streamKey || !content.startsWith(state.content)
    const session = enabled && (streaming || (!reset && state.session))
    const index = session && state.enabled ? (reset ? 0 : Math.min(state.index, length)) : length
    setState({
      content,
      streamKey,
      enabled,
      streaming,
      index,
      session: session && (streaming || index < length),
      epoch: reset ? state.epoch + 1 : state.epoch,
    })
  }
  const latest = React.useRef({ length, streaming })
  React.useLayoutEffect(() => {
    latest.current = { length, streaming }
  })
  const pending = enabled && state.session && state.index < length
  const rate = Number.isFinite(charactersPerSecond)
    ? Math.min(1000, Math.max(1, charactersPerSecond))
    : 60
  React.useEffect(() => {
    if (!pending) return
    let previous = performance.now(),
      credit = 0
    const timer = setInterval(() => {
      const now = performance.now()
      credit += ((now - previous) * rate) / 1000
      previous = now
      const count = Math.floor(credit)
      if (!count) return
      credit -= count
      setState((current) => {
        const index = Math.min(latest.current.length, current.index + count)
        return {
          ...current,
          index,
          session: latest.current.streaming || index < latest.current.length,
        }
      })
    }, 16)
    return () => clearInterval(timer)
  }, [pending, rate, state.epoch])
  return {
    text:
      enabled && state.session
        ? content.slice(0, boundaries[Math.min(state.index, length)])
        : content,
    isRevealing: pending,
  }
}
