import * as React from 'react'
import { Mic, MicOff, Square, Volume2, VolumeX, Pause, Play, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useControllableState } from '@/components/ui/util'
import { productId, productURL, clamp } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'
export type VoiceStatus =
  'idle' | 'requesting' | 'recording' | 'paused' | 'processing' | 'speaking' | 'error'
export interface VoiceTurn {
  id: string
  role: 'user' | 'assistant'
  text: string
}
export interface VoiceResponse {
  transcript: string
  response?: string
  audioUrl?: string
}
export interface VoiceConversationProps extends Omit<
  React.ComponentProps<'section'>,
  'onChange' | 'defaultValue'
> {
  value?: VoiceTurn[]
  defaultValue?: VoiceTurn[]
  onValueChange?: (turns: VoiceTurn[]) => void
  onProcessRecording: (audio: Blob, options: { signal: AbortSignal }) => Promise<VoiceResponse>
  /** Optional live adapter. Chunks preserve MediaRecorder's original MIME type. */
  onAudioChunk?: (chunk: Blob, options: { signal: AbortSignal }) => void | Promise<void>
  onStatusChange?: (status: VoiceStatus) => void
  disabled?: boolean
  autoSpeak?: boolean
  language?: string
  maxDurationSeconds?: number
  mimeType?: string
  label?: string
  renderTurn?: (turn: VoiceTurn) => React.ReactNode
}
interface VoiceContext {
  status: VoiceStatus
  muted: boolean
  setMuted: (value: boolean) => void
  autoSpeak: boolean
  setSpeak: (value: boolean) => void
  start: () => void
  stop: () => void
  interrupt: () => void
  pause: () => void
  disabled: boolean
  supported: boolean | null
  canvas: React.RefObject<HTMLCanvasElement | null>
}
const Context = React.createContext<VoiceContext | null>(null)
const useVoice = () => {
  const c = React.useContext(Context)
  if (!c) throw new Error('Voice parts need VoiceConversation.')
  return c
}
/** Captures audio only after an explicit click. Transcription and response generation belong to the supplied adapter. */
export function VoiceConversation({
  value,
  defaultValue = [],
  onValueChange,
  onProcessRecording,
  onAudioChunk,
  onStatusChange,
  disabled = false,
  autoSpeak = true,
  language = 'en-US',
  maxDurationSeconds = 120,
  mimeType,
  label = 'Voice conversation',
  renderTurn,
  children,
  className,
  ...props
}: VoiceConversationProps) {
  const [turns, setTurns] = useControllableState({ value, defaultValue, onChange: onValueChange }),
    [status, setStatus] = React.useState<VoiceStatus>('idle'),
    [muted, setMuted] = React.useState(false),
    [speak, setSpeak] = React.useState(autoSpeak),
    [supported, setSupported] = React.useState<boolean | null>(null),
    [error, setError] = React.useState(''),
    [audioUrl, setAudioUrl] = React.useState('')
  const recorder = React.useRef<MediaRecorder | null>(null),
    stream = React.useRef<MediaStream | null>(null),
    controller = React.useRef<AbortController | null>(null),
    audioContext = React.useRef<AudioContext | null>(null),
    frame = React.useRef<number | null>(null),
    timer = React.useRef<ReturnType<typeof setTimeout> | null>(null),
    duration = React.useRef({ remaining: 0, started: 0 }),
    canvas = React.useRef<HTMLCanvasElement>(null),
    audio = React.useRef<HTMLAudioElement>(null),
    utterance = React.useRef<SpeechSynthesisUtterance | null>(null),
    session = React.useRef(0),
    mounted = React.useRef(true),
    latest = React.useRef({
      onAudioChunk,
      onProcessRecording,
      onStatusChange,
      speak,
      language,
      muted,
    })
  React.useLayoutEffect(() => {
    latest.current = { onAudioChunk, onProcessRecording, onStatusChange, speak, language, muted }
  }, [onAudioChunk, onProcessRecording, onStatusChange, speak, language, muted])
  React.useEffect(() => {
    setSupported(typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  }, [])
  React.useEffect(() => {
    latest.current.onStatusChange?.(status)
  }, [status])
  const release = React.useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
    if (audioContext.current) void audioContext.current.close().catch(() => {})
    audioContext.current = null
  }, [])
  const interrupt = React.useCallback(() => {
    session.current++
    controller.current?.abort()
    controller.current = null
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop()
    recorder.current = null
    release()
    if (utterance.current && typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel()
      utterance.current = null
    }
    audio.current?.pause()
    if (mounted.current) setStatus('idle')
  }, [release])
  React.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      interrupt()
    }
  }, [interrupt])
  React.useEffect(() => {
    if (disabled) interrupt()
  }, [disabled, interrupt])
  React.useEffect(() => {
    stream.current?.getAudioTracks().forEach((track) => {
      track.enabled = !muted
    })
  }, [muted])
  const fail = (failure: unknown, round: number) => {
    if (mounted.current && session.current === round) {
      setError(failure instanceof Error ? failure.message : 'Voice capture failed.')
      setStatus('error')
    }
  }
  const speakText = (text: string, round: number) => {
    if (!latest.current.speak || typeof speechSynthesis === 'undefined') {
      setStatus('idle')
      return
    }
    const speech = new SpeechSynthesisUtterance(text)
    speech.lang = latest.current.language
    utterance.current = speech
    speech.onend = () => {
      if (mounted.current && session.current === round) {
        utterance.current = null
        setStatus('idle')
      }
    }
    speech.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted')
        fail(new Error(`Speech playback failed: ${event.error}`), round)
    }
    setStatus('speaking')
    speechSynthesis.speak(speech)
  }
  const start = async () => {
    if (
      disabled ||
      !supported ||
      status === 'requesting' ||
      status === 'recording' ||
      status === 'paused'
    )
      return
    interrupt()
    const round = ++session.current,
      abort = new AbortController()
    controller.current = abort
    setError('')
    setAudioUrl('')
    setStatus('requesting')
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mounted.current || abort.signal.aborted || session.current !== round) {
        media.getTracks().forEach((track) => track.stop())
        return
      }
      stream.current = media
      media.getAudioTracks().forEach((track) => {
        track.enabled = !latest.current.muted
      })
      if (mimeType && !MediaRecorder.isTypeSupported(mimeType))
        throw new Error(`Unsupported recording type: ${mimeType}`)
      const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined),
        chunks: Blob[] = [],
        chunkTasks: Promise<void>[] = []
      let turnPending = true
      const ownsSession = () =>
        mounted.current && !abort.signal.aborted && round === session.current
      recorder.current = rec
      rec.ondataavailable = (event) => {
        if (!event.data.size || !ownsSession() || !turnPending) return
        chunks.push(event.data)
        const onChunk = latest.current.onAudioChunk
        if (onChunk)
          chunkTasks.push(
            Promise.resolve()
              .then(() => onChunk(event.data, { signal: abort.signal }))
              .catch((failure) => {
                if (ownsSession() && turnPending) {
                  abort.abort()
                  release()
                  fail(failure, round)
                }
              }),
          )
      }
      rec.onerror = () => {
        if (!ownsSession() || !turnPending) return
        abort.abort()
        release()
        fail(new Error('The recording device reported an error.'), round)
      }
      rec.onstop = () => {
        if (!ownsSession()) return
        release()
        setStatus('processing')
        const blob = new Blob(chunks, {
          type: chunks.find((chunk) => chunk.type)?.type || rec.mimeType || mimeType,
        })
        if (!blob.size) {
          fail(new Error('The recording was empty.'), round)
          return
        }
        void Promise.resolve()
          .then(async () => {
            await Promise.all(chunkTasks)
            if (!ownsSession()) return
            return latest.current.onProcessRecording(blob, { signal: abort.signal })
          })
          .then((result) => {
            if (!result || !ownsSession()) return
            turnPending = false
            setTurns((previous) => [
              ...previous,
              { id: productId(), role: 'user', text: result.transcript },
              ...(result.response
                ? [{ id: productId(), role: 'assistant' as const, text: result.response }]
                : []),
            ])
            if (result.audioUrl) {
              const url = productURL(result.audioUrl, true)
              if (!url) throw new Error('The response audio URL is unsupported.')
              setAudioUrl(url)
              if (latest.current.speak) {
                setStatus('speaking')
                requestAnimationFrame(() => {
                  if (abort.signal.aborted) return
                  void audio.current?.play().catch(() => {
                    if (mounted.current && round === session.current) {
                      setStatus('idle')
                      setError('Automatic playback was blocked. Use the audio player to listen.')
                    }
                  })
                })
              } else setStatus('idle')
            } else if (result.response) speakText(result.response, round)
            else setStatus('idle')
          })
          .catch((failure) => {
            if (!abort.signal.aborted) fail(failure, round)
          })
      }
      rec.start(250)
      duration.current = {
        remaining: clamp(maxDurationSeconds, 3, 600) * 1000,
        started: Date.now(),
      }
      setStatus('recording')
      timer.current = setTimeout(() => {
        if (rec.state !== 'inactive') rec.stop()
      }, duration.current.remaining)
      try {
        if (typeof AudioContext !== 'undefined') {
          const engine = new AudioContext()
          audioContext.current = engine
          const analyser = engine.createAnalyser()
          analyser.fftSize = 128
          engine.createMediaStreamSource(media).connect(analyser)
          const bins = new Uint8Array(analyser.frequencyBinCount)
          const draw = () => {
            if (!ownsSession() || !stream.current) return
            analyser.getByteFrequencyData(bins)
            const target = canvas.current,
              ctx = target?.getContext('2d')
            if (target && ctx) {
              ctx.clearRect(0, 0, target.width, target.height)
              ctx.fillStyle = '#5579bd'
              for (let i = 0; i < 32; i++) {
                const h = Math.max(3, (bins[i * 2] / 255) * target.height * 0.85)
                ctx.fillRect(
                  (i * target.width) / 32 + 2,
                  (target.height - h) / 2,
                  Math.max(2, target.width / 32 - 4),
                  h,
                )
              }
            }
            frame.current = requestAnimationFrame(draw)
          }
          draw()
        }
      } catch {
        // Waveform visualization is optional and never determines capture success.
        if (frame.current !== null) cancelAnimationFrame(frame.current)
        frame.current = null
        if (audioContext.current) void audioContext.current.close().catch(() => {})
        audioContext.current = null
      }
    } catch (failure) {
      if (round !== session.current || !mounted.current) return
      release()
      fail(failure, round)
    }
  }
  const stop = () => {
    if (status === 'requesting') {
      interrupt()
      return
    }
    const rec = recorder.current
    if (rec && rec.state !== 'inactive') {
      setStatus('processing')
      rec.stop()
    }
  }
  const pause = () => {
    const rec = recorder.current
    if (rec?.state === 'recording') {
      rec.pause()
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      duration.current.remaining = Math.max(
        0,
        duration.current.remaining - (Date.now() - duration.current.started),
      )
      setStatus('paused')
    } else if (rec?.state === 'paused') {
      rec.resume()
      duration.current.started = Date.now()
      timer.current = setTimeout(() => {
        if (rec.state === 'recording') rec.stop()
      }, duration.current.remaining)
      setStatus('recording')
    }
  }
  React.useEffect(() => {
    if (!speak) {
      if (utterance.current && typeof speechSynthesis !== 'undefined') {
        speechSynthesis.cancel()
        utterance.current = null
      }
      audio.current?.pause()
      setStatus((current) => (current === 'speaking' ? 'idle' : current))
    }
  }, [speak])
  const valid = new Set(turns.map((turn) => turn.id)).size === turns.length
  return (
    <Context.Provider
      value={{
        status,
        muted,
        setMuted,
        autoSpeak: speak,
        setSpeak,
        start: () => void start(),
        stop,
        interrupt,
        pause,
        disabled,
        supported,
        canvas,
      }}
    >
      <section
        {...props}
        data-slot="voice-conversation"
        aria-label={label}
        className={cn('w-full min-w-0 space-y-4 rounded-2xl border bg-background p-4', className)}
      >
        {children ?? (
          <>
            <VoiceConversationWaveform />
            <VoiceConversationControls />
          </>
        )}
        {supported === false && (
          <p role="alert" className="text-xs text-destructive">
            Voice recording needs a supported browser, microphone permission and a secure
            connection.
          </p>
        )}
        {!valid ? (
          <p role="alert" className="text-xs text-destructive">
            Transcript turns need unique IDs.
          </p>
        ) : (
          <ol aria-label="Voice transcript" className="max-h-64 space-y-2 overflow-auto">
            {turns.map((turn) => (
              <li
                key={turn.id}
                className={cn(
                  'rounded-lg border p-3 text-sm',
                  turn.role === 'user' && 'bg-muted/40',
                )}
              >
                {renderTurn?.(turn) ?? (
                  <>
                    <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">
                      {turn.role}
                    </p>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{turn.text}</p>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
        {audioUrl && (
          <audio
            ref={audio}
            src={audioUrl}
            controls
            className="h-10 w-full"
            onEnded={() => setStatus('idle')}
            onError={() => {
              setError('Response audio could not be played.')
              setStatus('error')
            }}
          />
        )}{' '}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </section>
    </Context.Provider>
  )
}
export function VoiceConversationWaveform() {
  const c = useVoice(),
    active = c.status === 'recording' || c.status === 'paused'
  return (
    <div className="rounded-xl bg-muted/35 px-4 py-6 text-center">
      <div
        className={cn(
          'mx-auto mb-4 grid size-16 place-content-center rounded-full border bg-background text-primary shadow-sm',
          c.status === 'recording' && 'ring-8 ring-primary/10',
        )}
      >
        {c.status === 'requesting' || c.status === 'processing' ? (
          <LoaderCircle className="size-7 animate-spin" />
        ) : c.muted ? (
          <MicOff className="size-7" />
        ) : (
          <Mic className="size-7" />
        )}
      </div>
      <canvas
        ref={c.canvas}
        width={320}
        height={56}
        className={cn('mx-auto h-14 max-w-full', !active && 'invisible')}
        aria-label="Microphone input levels"
        role="img"
      />
      <p role="status" className="mt-3 text-xs capitalize text-muted-foreground">
        {c.status === 'idle' ? 'Ready when you are' : c.status}
      </p>
    </div>
  )
}
export function VoiceConversationControls() {
  const c = useVoice(),
    recording = c.status === 'recording' || c.status === 'paused'
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={c.muted ? 'Unmute microphone' : 'Mute microphone'}
        aria-pressed={c.muted}
        disabled={c.disabled}
        onClick={() => c.setMuted(!c.muted)}
      >
        {c.muted ? <MicOff /> : <Mic />}
      </Button>
      {recording || c.status === 'requesting' ? (
        <Button type="button" onClick={c.stop} disabled={c.disabled}>
          <Square />
          {c.status === 'requesting' ? 'Cancel microphone request' : 'Finish recording'}
        </Button>
      ) : c.status === 'processing' || c.status === 'speaking' ? (
        <Button type="button" variant="secondary" onClick={c.interrupt}>
          <Square />
          Interrupt
        </Button>
      ) : (
        <Button type="button" onClick={c.start} disabled={c.disabled || !c.supported}>
          <Mic />
          Start talking
        </Button>
      )}
      {recording && (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={c.status === 'paused' ? 'Resume recording' : 'Pause recording'}
          onClick={c.pause}
        >
          {c.status === 'paused' ? <Play /> : <Pause />}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={c.autoSpeak ? 'Disable spoken responses' : 'Enable spoken responses'}
        aria-pressed={c.autoSpeak}
        onClick={() => c.setSpeak(!c.autoSpeak)}
      >
        {c.autoSpeak ? <Volume2 /> : <VolumeX />}
      </Button>
    </div>
  )
}
