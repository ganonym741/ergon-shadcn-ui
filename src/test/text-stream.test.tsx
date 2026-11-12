import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useTextStream } from '@/components/ui/text-stream'
import { ChatMessage } from '@/components/ui/chat-message'
import { Conversation } from '@/components/ui/conversation'

afterEach(() => vi.useRealTimers())
const clock = () => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] })
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

describe('progressive AI text presentation', () => {
  it('reveals a streamed chunk progressively and keeps completed history instant', () => {
    clock()
    const { result, rerender } = renderHook(
      ({ streaming }) => useTextStream('Hello', { streaming, charactersPerSecond: 10 }),
      { initialProps: { streaming: true } },
    )
    expect(result.current.text).toBe('')
    advance(120)
    expect(result.current.text).toBe('H')
    advance(500)
    expect(result.current.text).toBe('Hello')
    expect(result.current.isRevealing).toBe(false)
    rerender({ streaming: false })
    expect(vi.getTimerCount()).toBe(0)
    const history = renderHook(() => useTextStream('Earlier message'))
    expect(history.result.current.text).toBe('Earlier message')
    expect(history.result.current.isRevealing).toBe(false)
  })

  it('continues from the displayed prefix as faster network chunks arrive', () => {
    clock()
    const { result, rerender } = renderHook(
      ({ content }) => useTextStream(content, { streaming: true, charactersPerSecond: 10 }),
      { initialProps: { content: 'A' } },
    )
    // Incoming updates faster than a presentation frame must not keep restarting its timer.
    for (let i = 1; i <= 20; i++) {
      advance(8)
      rerender({ content: 'A' + 'b'.repeat(i) })
    }
    expect(result.current.text).toBe('A')
    advance(100)
    expect(result.current.text).toBe('Ab')
  })

  it('drains buffered characters even when the network stream completes', () => {
    clock()
    const { result, rerender } = renderHook(
      ({ streaming, content }) => useTextStream(content, { streaming, charactersPerSecond: 10 }),
      { initialProps: { streaming: true, content: 'Hello' } },
    )
    advance(120)
    rerender({ streaming: false, content: 'Hello world' })
    expect(result.current.text).toBe('H')
    expect(result.current.isRevealing).toBe(true)
    advance(1100)
    expect(result.current.text).toBe('Hello world')
    expect(result.current.isRevealing).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not split emoji families, flags, or combining characters', () => {
    clock()
    const { result } = renderHook(() =>
      useTextStream('👨‍👩‍👧‍👦🇮🇩e\u0301', {
        streaming: true,
        charactersPerSecond: 10,
      }),
    )
    advance(112)
    expect(result.current.text).toBe('👨‍👩‍👧‍👦')
    advance(112)
    expect(result.current.text).toBe('👨‍👩‍👧‍👦🇮🇩')
    advance(112)
    expect(result.current.text).toBe('👨‍👩‍👧‍👦🇮🇩e\u0301')
  })

  it('resets replacement streams and message identities without leaking old characters', () => {
    clock()
    const { result, rerender } = renderHook(
      ({ content, key }) =>
        useTextStream(content, { streaming: true, streamKey: key, charactersPerSecond: 10 }),
      { initialProps: { content: 'First response', key: 'first' } },
    )
    advance(220)
    expect(result.current.text).toBe('Fi')
    rerender({ content: 'Replacement', key: 'first' })
    expect(result.current.text).toBe('')
    advance(120)
    expect(result.current.text).toBe('R')
    rerender({ content: 'Replacement', key: 'second' })
    expect(result.current.text).toBe('')
  })

  it('flushes on opt-out or cancellation and cleans up on unmount', () => {
    clock()
    const { result, rerender, unmount } = renderHook(
      ({ immediate, textAnimation }) =>
        useTextStream('A long response', {
          streaming: true,
          immediate,
          textAnimation,
          charactersPerSecond: 10,
        }),
      { initialProps: { immediate: false, textAnimation: 'typewriter' as 'typewriter' | 'none' } },
    )
    advance(120)
    rerender({ immediate: true, textAnimation: 'typewriter' })
    expect(result.current.text).toBe('A long response')
    expect(vi.getTimerCount()).toBe(0)
    rerender({ immediate: false, textAnimation: 'none' })
    expect(result.current.text).toBe('A long response')
    unmount()
    expect(vi.getTimerCount()).toBe(0)
    const active = renderHook(() => useTextStream('Still writing', { streaming: true }))
    expect(vi.getTimerCount()).toBe(1)
    active.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('honors speed changes and uses a safe default for invalid speeds', () => {
    clock()
    const { result, rerender } = renderHook(
      ({ speed }) => useTextStream('abcdefghij', { streaming: true, charactersPerSecond: speed }),
      { initialProps: { speed: 10 } },
    )
    advance(120)
    expect(result.current.text).toBe('a')
    rerender({ speed: 20 })
    advance(112)
    expect(result.current.text).toBe('abc')
    rerender({ speed: NaN })
    advance(112)
    expect(result.current.text.length).toBeGreaterThan(3)
  })

  it('falls back to intact text if the browser cannot segment graphemes', () => {
    vi.stubGlobal('Intl', Object.create(Intl, { Segmenter: { value: undefined } }))
    try {
      const { result } = renderHook(() => useTextStream('👨‍👩‍👧‍👦 hello', { streaming: true }))
      expect(result.current.text).toBe('👨‍👩‍👧‍👦 hello')
      expect(result.current.isRevealing).toBe(false)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('copies the received text while plain message content is still revealing', () => {
    clock()
    const copy = vi.fn()
    const view = render(
      <ChatMessage
        id="response"
        role="assistant"
        content="Full received response"
        status="streaming"
        charactersPerSecond={10}
        onCopy={copy}
      />,
    )
    advance(120)
    expect(view.container.querySelector('[data-revealing=true]')).toHaveTextContent('F')
    fireEvent.click(screen.getByRole('button', { name: 'Copy message' }))
    expect(copy).toHaveBeenCalledWith('Full received response')
    view.rerender(
      <ChatMessage
        id="response"
        role="assistant"
        content="Full received response"
        status="cancelled"
      />,
    )
    expect(screen.getByText('Full received response')).toBeInTheDocument()
    expect(view.container.querySelector('[data-revealing=true]')).toBeNull()
  })

  it('passes conversation defaults through while allowing per-message overrides', () => {
    clock()
    render(
      <Conversation
        textAnimation="none"
        messages={[
          { id: 'instant', role: 'assistant', content: 'Instant', status: 'streaming' },
          {
            id: 'animated',
            role: 'assistant',
            content: 'Animated',
            status: 'streaming',
            textAnimation: 'typewriter',
            charactersPerSecond: 10,
          },
        ]}
      />,
    )
    expect(screen.getByText('Instant')).toBeInTheDocument()
    expect(screen.queryByText('Animated')).not.toBeInTheDocument()
    advance(120)
    expect(screen.getByText('A')).toBeInTheDocument()
  })
})
