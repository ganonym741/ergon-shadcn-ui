import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoiceConversation } from '@/components/ui/voice-conversation'

const deferred = <T,>() => {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const originalMedia = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices')
class Recorder {
  static instances: Recorder[] = []
  static isTypeSupported() {
    return true
  }
  state: RecordingState = 'inactive'
  mimeType = 'audio/webm'
  onstop: (() => void) | null = null
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onerror: (() => void) | null = null
  constructor() {
    Recorder.instances.push(this)
  }
  start() {
    this.state = 'recording'
  }
  stop() {
    this.state = 'inactive'
    this.mimeType = ''
  }
  pause() {
    this.state = 'paused'
  }
  resume() {
    this.state = 'recording'
  }
}
const media = () => {
  const track = { enabled: true, stop: vi.fn() }
  return {
    track,
    stream: { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream,
  }
}
beforeEach(() => {
  Recorder.instances = []
  vi.stubGlobal('MediaRecorder', Recorder)
  vi.stubGlobal('AudioContext', undefined)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (originalMedia) Object.defineProperty(navigator, 'mediaDevices', originalMedia)
  else Reflect.deleteProperty(navigator, 'mediaDevices')
})
const permissions = (getUserMedia: unknown) =>
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })

describe('voice session ownership', () => {
  it('counts only recorded time toward the recording limit', async () => {
    vi.useFakeTimers()
    const input = media()
    permissions(vi.fn(async () => input.stream))
    render(
      <VoiceConversation
        maxDurationSeconds={3}
        onProcessRecording={async () => ({ transcript: 'Done' })}
      />,
    )
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Start talking' })))
    const recorder = Recorder.instances[0]
    act(() => vi.advanceTimersByTime(1000))
    fireEvent.click(screen.getByRole('button', { name: 'Pause recording' }))
    act(() => vi.advanceTimersByTime(20000))
    expect(recorder.state).toBe('paused')
    fireEvent.click(screen.getByRole('button', { name: 'Resume recording' }))
    act(() => vi.advanceTimersByTime(1999))
    expect(recorder.state).toBe('recording')
    act(() => vi.advanceTimersByTime(1))
    expect(recorder.state).toBe('inactive')
  })

  it('leaves speaking and offers another turn if response audio fails', async () => {
    const user = userEvent.setup(),
      input = media()
    permissions(vi.fn(async () => input.stream))
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const view = render(
      <VoiceConversation
        onProcessRecording={async () => ({
          transcript: 'Recorded',
          audioUrl: 'https://example.test/response.mp3',
        })}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Start talking' }))
    const recorder = Recorder.instances[0]
    act(() => recorder.ondataavailable?.({ data: new Blob(['sound'], { type: 'audio/webm' }) }))
    await user.click(screen.getByRole('button', { name: 'Finish recording' }))
    act(() => recorder.onstop?.())
    await screen.findByRole('button', { name: 'Interrupt' })
    fireEvent.error(view.container.querySelector('audio')!)
    expect(screen.getByRole('alert')).toHaveTextContent('Response audio could not be played')
    expect(screen.getByRole('button', { name: 'Start talking' })).toBeEnabled()
  })
  it('continues recording if optional waveform setup fails and retains the chunk MIME type', async () => {
    const user = userEvent.setup(),
      input = media(),
      process = vi.fn(async (_audio: Blob) => ({ transcript: 'Recorded' }))
    permissions(vi.fn(async () => input.stream))
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('No audio context')
        }
      },
    )
    render(<VoiceConversation autoSpeak={false} onProcessRecording={process} />)
    await user.click(screen.getByRole('button', { name: 'Start talking' }))
    expect(input.track.stop).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Finish recording' })).toBeInTheDocument()
    const rec = Recorder.instances[0]
    act(() =>
      rec.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/ogg;codecs=opus' }) }),
    )
    await user.click(screen.getByRole('button', { name: 'Finish recording' }))
    expect(rec.mimeType).toBe('')
    act(() => rec.onstop?.())
    await waitFor(() => expect(process).toHaveBeenCalledTimes(1))
    expect(process.mock.calls[0][0].type).toBe('audio/ogg;codecs=opus')
    expect(await screen.findByText('Recorded')).toBeInTheDocument()
  })

  it('does not release a newer microphone when an old permission request rejects', async () => {
    const user = userEvent.setup(),
      old = deferred<MediaStream>(),
      next = media()
    permissions(vi.fn().mockReturnValueOnce(old.promise).mockResolvedValueOnce(next.stream))
    render(<VoiceConversation onProcessRecording={async () => ({ transcript: 'Done' })} />)
    await user.click(screen.getByRole('button', { name: 'Start talking' }))
    await user.click(screen.getByRole('button', { name: 'Cancel microphone request' }))
    await user.click(screen.getByRole('button', { name: 'Start talking' }))
    await act(async () => old.reject(new Error('late denial')))
    expect(next.track.stop).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Finish recording' })).toBeInTheDocument()
  })

  it('ignores the asynchronous stop event of an interrupted session after another starts', async () => {
    const user = userEvent.setup(),
      first = media(),
      second = media()
    permissions(vi.fn().mockResolvedValueOnce(first.stream).mockResolvedValueOnce(second.stream))
    const process = vi.fn(async () => ({ transcript: 'Done' }))
    render(<VoiceConversation onProcessRecording={process} />)
    await user.click(screen.getByRole('button', { name: 'Start talking' }))
    const old = Recorder.instances[0]
    await user.click(screen.getByRole('button', { name: 'Finish recording' }))
    await user.click(screen.getByRole('button', { name: 'Interrupt' }))
    await user.click(screen.getByRole('button', { name: 'Start talking' }))
    act(() => old.onstop?.())
    expect(second.track.stop).not.toHaveBeenCalled()
    expect(process).not.toHaveBeenCalled()
  })

  it('waits for live chunks before processing and ignores failures from an interrupted turn', async () => {
    const user = userEvent.setup(),
      chunk = deferred<void>(),
      first = media(),
      second = media()
    permissions(vi.fn().mockResolvedValueOnce(first.stream).mockResolvedValueOnce(second.stream))
    const process = vi.fn(async () => ({ transcript: 'Done' }))
    render(<VoiceConversation onAudioChunk={() => chunk.promise} onProcessRecording={process} />)
    await user.click(screen.getByRole('button', { name: 'Start talking' }))
    const old = Recorder.instances[0]
    act(() => old.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) }))
    await user.click(screen.getByRole('button', { name: 'Finish recording' }))
    act(() => old.onstop?.())
    await act(async () => {})
    expect(process).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Interrupt' }))
    await user.click(screen.getByRole('button', { name: 'Start talking' }))
    await act(async () => chunk.reject(new Error('late chunk')))
    expect(second.track.stop).not.toHaveBeenCalled()
    expect(screen.queryByText('late chunk')).not.toBeInTheDocument()
  })
})
