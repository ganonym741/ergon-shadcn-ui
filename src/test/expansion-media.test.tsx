import * as React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MediaPlayer, formatMediaTime, type MediaPlayerHandle } from '@/components/ui/media-player'
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    Object.defineProperty(this, 'paused', { configurable: true, value: false })
    fireEvent.play(this)
    return Promise.resolve()
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    Object.defineProperty(this, 'paused', { configurable: true, value: true })
    fireEvent.pause(this)
  })
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())
describe('native media player', () => {
  it('formats long/invalid durations without NaN', () => {
    expect(formatMediaTime(3661)).toBe('1:01:01')
    expect(formatMediaTime(Infinity)).toBe('0:00')
    expect(formatMediaTime(-1)).toBe('0:00')
  })
  it('plays, pauses and seeks from real media events', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    const { container } = render(<MediaPlayer src="/movie.mp4" onStateChange={change} />)
    const video = container.querySelector('video')!
    Object.defineProperty(video, 'duration', { configurable: true, value: 10 })
    fireEvent.loadedMetadata(video)
    await user.click(screen.getByRole('button', { name: 'Play' }))
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider', { name: 'Seek media' }), { target: { value: '6' } })
    expect(video.currentTime).toBe(6)
    expect(change).toHaveBeenLastCalledWith(
      expect.objectContaining({ playing: true, currentTime: 6, duration: 10 }),
    )
    await user.click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })
  it('disables seeking for live media and reports rejected playback', async () => {
    const user = userEvent.setup(),
      error = vi.fn()
    const { container } = render(<MediaPlayer src="/live" onError={error} />)
    const video = container.querySelector('video')!
    Object.defineProperty(video, 'duration', { configurable: true, value: Infinity })
    fireEvent.loadedMetadata(video)
    expect(screen.getByRole('slider', { name: 'Seek media' })).toBeDisabled()
    expect(screen.getByText(/Live/)).toBeInTheDocument()
    vi.mocked(video.play).mockRejectedValueOnce(new Error('Playback blocked'))
    await user.click(screen.getByRole('button', { name: 'Play' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Playback blocked')
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ message: 'Playback blocked' }))
  })
  it('updates volume, mute, rate and caption modes', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MediaPlayer
        kind="audio"
        src="/audio.wav"
        tracks={[{ src: '/captions.vtt', language: 'en', label: 'English' }]}
      />,
    )
    const audio = container.querySelector('audio')!,
      track = Object.assign(new EventTarget(), { mode: 'disabled', activeCues: [] })
    Object.defineProperty(audio, 'textTracks', { configurable: true, value: [track] })
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '.3' } })
    await waitFor(() => expect(audio.volume).toBe(0.3))
    await user.click(screen.getByRole('button', { name: 'Mute' }))
    expect(audio.muted).toBe(true)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Playback speed' }), '1.5')
    expect(audio.playbackRate).toBe(1.5)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Captions' }), '0')
    expect(track.mode).toBe('showing')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Captions' }), '-1')
    expect(track.mode).toBe('disabled')
  })
  it('resets source state, clamps imperative seeks and disables native controls', () => {
    const ref = React.createRef<MediaPlayerHandle>()
    const { container, rerender } = render(
      <MediaPlayer ref={ref} src="/first.mp4" nativeControls />,
    )
    const video = container.querySelector('video')!
    Object.defineProperty(video, 'duration', { configurable: true, value: 10 })
    act(() => ref.current?.seek(30))
    expect(video.currentTime).toBe(10)
    rerender(<MediaPlayer ref={ref} src="/next.mp4" nativeControls disabled />)
    expect(video.load).toHaveBeenCalled()
    expect(video.pause).toHaveBeenCalled()
    expect(video.controls).toBe(false)
  })
})
