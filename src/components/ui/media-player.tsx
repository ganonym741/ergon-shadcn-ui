import * as React from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  Music2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useControllableState } from '@/components/ui/util'

export interface MediaPlayerSource {
  src: string
  type?: string
}
export interface MediaPlayerTrack {
  src: string
  label: string
  language: string
  kind?: 'subtitles' | 'captions'
  default?: boolean
}
export interface MediaPlayerState {
  playing: boolean
  currentTime: number
  duration: number
  buffered: number
  volume: number
  muted: boolean
  rate: number
  ended: boolean
}
export interface MediaPlayerHandle {
  play: () => Promise<void>
  pause: () => void
  seek: (time: number) => void
  getElement: () => HTMLMediaElement | null
}
export interface MediaPlayerProps extends Omit<
  React.ComponentProps<'section'>,
  'onError' | 'ref' | 'onVolumeChange' | 'onEnded'
> {
  src?: string
  sources?: MediaPlayerSource[]
  kind?: 'video' | 'audio'
  title?: string
  description?: string
  poster?: string
  tracks?: MediaPlayerTrack[]
  autoPlay?: boolean
  loop?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  crossOrigin?: 'anonymous' | 'use-credentials'
  nativeControls?: boolean
  disabled?: boolean
  volume?: number
  defaultVolume?: number
  onVolumeChange?: (volume: number) => void
  muted?: boolean
  defaultMuted?: boolean
  onMutedChange?: (muted: boolean) => void
  playbackRate?: number
  defaultPlaybackRate?: number
  onPlaybackRateChange?: (rate: number) => void
  onStateChange?: (state: MediaPlayerState) => void
  onEnded?: () => void
  onReady?: (element: HTMLMediaElement) => void
  onError?: (error: Error) => void
  ref?: React.Ref<MediaPlayerHandle>
}
const initialState: MediaPlayerState = {
  playing: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  muted: false,
  rate: 1,
  ended: false,
}
/** Formats finite media times without exposing NaN or Infinity in controls. */
export function formatMediaTime(time: number): string {
  if (!Number.isFinite(time) || time < 0) return '0:00'
  const seconds = Math.floor(time)
  return seconds >= 3600
    ? `${Math.floor(seconds / 3600)}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
interface MediaContext {
  media: React.RefObject<HTMLMediaElement | null>
  root: React.RefObject<HTMLElement | null>
  state: MediaPlayerState
  kind: 'video' | 'audio'
  title: string
  description?: string
  poster?: string
  src?: string
  sources: MediaPlayerSource[]
  tracks: MediaPlayerTrack[]
  disabled: boolean
  nativeControls: boolean
  autoPlay: boolean
  muted: boolean
  loop: boolean
  preload: 'none' | 'metadata' | 'auto'
  crossOrigin: MediaPlayerProps['crossOrigin']
  read: () => void
  loaded: () => void
  fail: () => void
  end: () => void
  toggle: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  setRate: (rate: number) => void
  busy: boolean
  setBusy: (busy: boolean) => void
  fullscreen: boolean
  toggleFullscreen: () => void
  canFullscreen: boolean
  canPip: boolean
  togglePip: () => void
  caption: number
  setCaption: (index: number) => void
  captionText: string
}
const Context = React.createContext<MediaContext | null>(null)
function useMedia() {
  const c = React.useContext(Context)
  if (!c) throw new Error('Media player parts need MediaPlayer.')
  return c
}
/** Wraps native audio/video with event-driven state, controlled volume/rate, and progressively enhanced controls. */
export function MediaPlayer({
  src,
  sources = [],
  kind = 'video',
  title = 'Media player',
  description,
  poster,
  tracks = [],
  autoPlay = false,
  loop = false,
  preload = 'metadata',
  crossOrigin,
  nativeControls = false,
  disabled = false,
  volume,
  defaultVolume = 1,
  onVolumeChange,
  muted,
  defaultMuted = false,
  onMutedChange,
  playbackRate,
  defaultPlaybackRate = 1,
  onPlaybackRateChange,
  onStateChange,
  onEnded,
  onReady,
  onError,
  ref,
  className,
  children,
  ...props
}: MediaPlayerProps) {
  const media = React.useRef<HTMLMediaElement>(null),
    root = React.useRef<HTMLElement>(null)
  const [level, setVolume] = useControllableState({
      value: volume,
      defaultValue: defaultVolume,
      onChange: onVolumeChange,
    }),
    [silent, setMuted] = useControllableState({
      value: muted,
      defaultValue: defaultMuted,
      onChange: onMutedChange,
    }),
    [rate, setRate] = useControllableState({
      value: playbackRate,
      defaultValue: defaultPlaybackRate,
      onChange: onPlaybackRateChange,
    })
  const [state, setState] = React.useState<MediaPlayerState>(initialState),
    [error, setError] = React.useState(''),
    [busy, setBusy] = React.useState(false),
    [fullscreen, setFullscreen] = React.useState(false),
    [capabilities, setCapabilities] = React.useState({ fullscreen: false, pip: false }),
    [caption, setCaption] = React.useState(() => tracks.findIndex((track) => track.default)),
    [captionText, setCaptionText] = React.useState('')
  const sourceKey = JSON.stringify([kind, src, sources]),
    previousSource = React.useRef(sourceKey),
    trackKey = JSON.stringify(tracks)
  const report = (message: string) => {
    setError(message)
    setBusy(false)
    onError?.(new Error(message))
  }
  const read = () => {
    const node = media.current
    if (!node) return
    const duration = Number.isFinite(node.duration)
        ? Math.max(0, node.duration)
        : node.duration === Infinity
          ? Infinity
          : 0,
      currentTime = Number.isFinite(node.currentTime) ? Math.max(0, node.currentTime) : 0
    let buffered = 0
    try {
      if (node.buffered.length && duration > 0 && Number.isFinite(duration))
        buffered = Math.min(1, node.buffered.end(node.buffered.length - 1) / duration)
    } catch {
      /* The media range may change between reads. */
    }
    const next = {
      playing: !node.paused && !node.ended,
      currentTime,
      duration,
      buffered,
      volume: node.volume,
      muted: node.muted,
      rate: node.playbackRate,
      ended: node.ended,
    }
    setState(next)
    setVolume(node.volume)
    setMuted(node.muted)
    setRate(node.playbackRate)
    onStateChange?.(next)
  }
  const play = async () => {
    if (disabled || !media.current) return
    setError('')
    try {
      await media.current.play()
    } catch (reason) {
      report(reason instanceof Error ? reason.message : 'Playback could not start.')
      throw reason
    }
  }
  const seek = (time: number) => {
    const node = media.current
    if (
      disabled ||
      !node ||
      !Number.isFinite(time) ||
      !Number.isFinite(node.duration) ||
      node.duration <= 0
    )
      return
    try {
      node.currentTime = Math.max(0, Math.min(node.duration, time))
      read()
    } catch {
      report('This media cannot seek to that position.')
    }
  }
  React.useImperativeHandle(ref, () => ({
    play,
    pause: () => media.current?.pause(),
    seek,
    getElement: () => media.current,
  }))
  React.useEffect(() => {
    const node = media.current
    if (!node) return
    node.volume = Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 1
    node.muted = silent
    node.playbackRate = Number.isFinite(rate) ? Math.min(4, Math.max(0.25, rate)) : 1
  }, [level, silent, rate, kind])
  React.useEffect(() => {
    if (previousSource.current !== sourceKey) {
      previousSource.current = sourceKey
      media.current?.load()
      setState(initialState)
      setError('')
      setBusy(false)
    }
  }, [sourceKey])
  React.useEffect(() => {
    if (disabled) media.current?.pause()
  }, [disabled])
  React.useEffect(() => {
    setCapabilities({
      fullscreen:
        !!document.fullscreenEnabled && typeof root.current?.requestFullscreen === 'function',
      pip:
        kind === 'video' &&
        !!document.pictureInPictureEnabled &&
        typeof (media.current as HTMLVideoElement | null)?.requestPictureInPicture === 'function',
    })
    const update = () => setFullscreen(document.fullscreenElement === root.current)
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [kind])
  React.useEffect(() => setCaption(tracks.findIndex((track) => track.default)), [trackKey])
  const applyCaptions = () => {
    const list = media.current?.textTracks
    if (!list) return
    for (let i = 0; i < list.length; i++) list[i].mode = i === caption ? 'showing' : 'disabled'
  }
  React.useEffect(() => {
    applyCaptions()
    setCaptionText('')
    const track = media.current?.textTracks?.[caption]
    if (!track) return
    const update = () =>
      setCaptionText(
        Array.from(track.activeCues ?? [], (cue) => ('text' in cue ? String(cue.text) : '')).join(
          '\n',
        ),
      )
    track.addEventListener('cuechange', update)
    return () => track.removeEventListener('cuechange', update)
  }, [caption, trackKey, kind])
  const toggleFullscreen = async () => {
    if (disabled) return
    try {
      if (document.fullscreenElement === root.current) await document.exitFullscreen()
      else await root.current?.requestFullscreen()
    } catch {
      report('Fullscreen is unavailable.')
    }
  }
  const togglePip = async () => {
    if (disabled || kind !== 'video') return
    try {
      if (document.pictureInPictureElement === media.current) await document.exitPictureInPicture()
      else await (media.current as HTMLVideoElement | null)?.requestPictureInPicture()
    } catch {
      report('Picture-in-picture is unavailable for this media.')
    }
  }
  return (
    <Context.Provider
      value={{
        media,
        root,
        state,
        kind,
        title,
        description,
        poster,
        src,
        sources,
        tracks,
        disabled,
        nativeControls,
        autoPlay,
        muted: silent,
        loop,
        preload,
        crossOrigin,
        read,
        loaded: () => {
          setBusy(false)
          setError('')
          applyCaptions()
          read()
          if (media.current) onReady?.(media.current)
        },
        fail: () =>
          report(
            media.current?.error?.message ||
              'Could not load the media. Check the source, format, and cross-origin settings.',
          ),
        end: () => {
          read()
          onEnded?.()
        },
        toggle: () => {
          if (media.current?.paused) void play().catch(() => {})
          else media.current?.pause()
        },
        seek,
        setVolume,
        setMuted,
        setRate,
        busy,
        setBusy,
        fullscreen,
        toggleFullscreen: () => void toggleFullscreen(),
        canFullscreen: capabilities.fullscreen,
        canPip: capabilities.pip,
        togglePip: () => void togglePip(),
        caption,
        setCaption,
        captionText,
      }}
    >
      <section
        {...props}
        ref={root}
        aria-label={title}
        data-slot="media-player"
        className={cn(
          'w-full min-w-0 overflow-hidden rounded-xl border bg-background [&:fullscreen]:flex [&:fullscreen]:flex-col [&:fullscreen]:justify-center',
          className,
        )}
      >
        {children ?? (
          <>
            <MediaPlayerViewport />
            {!nativeControls && <MediaPlayerControls />}
          </>
        )}
        {error && (
          <p role="alert" className="border-t p-3 text-xs text-destructive">
            {error}
          </p>
        )}
      </section>
    </Context.Provider>
  )
}
/** Mounts the native media element, optional poster/artwork, and safe text captions for audio. */
export function MediaPlayerViewport({ className, ...props }: React.ComponentProps<'div'>) {
  const c = useMedia(),
    events = {
      onPlay: () => {
        if (c.disabled) c.media.current?.pause()
        c.read()
      },
      onPause: c.read,
      onTimeUpdate: c.read,
      onDurationChange: c.read,
      onVolumeChange: c.read,
      onRateChange: c.read,
      onProgress: c.read,
      onLoadedMetadata: c.loaded,
      onLoadedData: c.loaded,
      onCanPlay: () => c.setBusy(false),
      onWaiting: () => c.setBusy(true),
      onPlaying: () => c.setBusy(false),
      onError: c.fail,
      onEnded: c.end,
      onEmptied: c.read,
    }
  const sources = (
    <>
      {c.sources.map((source, index) => (
        <source key={`${source.src}-${index}`} src={source.src} type={source.type} />
      ))}
      {c.tracks.map((track, index) => (
        <track
          key={`${track.src}-${index}`}
          src={track.src}
          label={track.label}
          srcLang={track.language}
          kind={track.kind ?? 'subtitles'}
          default={track.default}
        />
      ))}
    </>
  )
  return (
    <div {...props} className={cn('relative', className)}>
      {c.kind === 'video' ? (
        <video
          ref={(node) => {
            c.media.current = node
          }}
          src={c.src}
          poster={c.poster}
          controls={c.nativeControls && !c.disabled}
          autoPlay={c.autoPlay}
          muted={c.muted}
          loop={c.loop}
          preload={c.preload}
          crossOrigin={c.crossOrigin}
          playsInline
          aria-label={c.title}
          className="aspect-video max-h-[80vh] w-full bg-black object-contain"
          {...events}
        >
          {sources}
        </video>
      ) : (
        <>
          <audio
            ref={(node) => {
              c.media.current = node
            }}
            src={c.src}
            controls={c.nativeControls && !c.disabled}
            autoPlay={c.autoPlay}
            muted={c.muted}
            loop={c.loop}
            preload={c.preload}
            crossOrigin={c.crossOrigin}
            aria-label={c.title}
            className={c.nativeControls ? 'w-full' : 'sr-only'}
            {...events}
          >
            {sources}
          </audio>
          <div className="flex items-center gap-4 bg-gradient-to-br from-primary/10 to-muted/30 p-6">
            {c.poster ? (
              <img src={c.poster} alt="" className="size-20 rounded-xl object-cover" />
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border bg-background/70 text-primary">
                <Music2 className="size-8" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{c.title}</h3>
              {c.description && (
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              )}
            </div>
          </div>
          {c.captionText && (
            <p className="whitespace-pre-line px-5 py-2 text-center text-sm" aria-live="off">
              {c.captionText}
            </p>
          )}
        </>
      )}
      {c.busy && (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15 text-white"
        >
          <Loader2 className="size-7 animate-spin" />
          <span className="sr-only">Buffering media…</span>
        </div>
      )}
    </div>
  )
}
/** Provides keyboard-operable playback, finite-duration seeking, audio settings, captions, and supported display modes. */
export function MediaPlayerControls({ className, ...props }: React.ComponentProps<'div'>) {
  const c = useMedia(),
    s = c.state,
    id = React.useId(),
    seekable = Number.isFinite(s.duration) && s.duration > 0
  return (
    <div {...props} className={cn('space-y-3 p-4', className)}>
      <div dir="ltr" className="relative flex items-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute h-1 rounded-full bg-primary/20"
          style={{ width: `${s.buffered * 100}%` }}
        />
        <input
          aria-label="Seek media"
          aria-valuetext={`${formatMediaTime(s.currentTime)} of ${formatMediaTime(s.duration)}`}
          type="range"
          min={0}
          max={seekable ? s.duration : 1}
          step="any"
          value={seekable ? Math.min(s.currentTime, s.duration) : 0}
          disabled={c.disabled || !seekable}
          onChange={(event) => c.seek(Number(event.target.value))}
          className="relative w-full accent-primary"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={s.playing ? 'Pause' : 'Play'}
          disabled={c.disabled || (!c.src && !c.sources.length)}
          onClick={c.toggle}
        >
          {s.playing ? <Pause /> : <Play />}
        </Button>
        <span dir="ltr" className="me-auto whitespace-nowrap font-mono text-xs tabular-nums">
          {formatMediaTime(s.currentTime)} /{' '}
          {s.duration === Infinity ? 'Live' : formatMediaTime(s.duration)}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={s.muted ? 'Unmute' : 'Mute'}
          disabled={c.disabled}
          onClick={() => c.setMuted(!s.muted)}
        >
          {s.muted || s.volume === 0 ? <VolumeX /> : <Volume2 />}
        </Button>
        <input
          type="range"
          aria-label="Volume"
          dir="ltr"
          min={0}
          max={1}
          step={0.05}
          value={s.volume}
          disabled={c.disabled}
          onChange={(event) => {
            c.setVolume(Number(event.target.value))
            c.setMuted(false)
          }}
          className="w-20 accent-primary"
        />
        <label htmlFor={`${id}-speed`} className="sr-only">
          Playback speed
        </label>
        <select
          id={`${id}-speed`}
          dir="ltr"
          value={s.rate}
          disabled={c.disabled}
          onChange={(event) => c.setRate(Number(event.target.value))}
          className="h-8 rounded-md border bg-background px-1 text-xs"
        >
          {![0.5, 0.75, 1, 1.25, 1.5, 2].includes(s.rate) && (
            <option value={s.rate}>{s.rate}×</option>
          )}
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
            <option key={rate} value={rate}>
              {rate}×
            </option>
          ))}
        </select>
        {c.tracks.length > 0 && (
          <select
            aria-label="Captions"
            value={c.caption}
            disabled={c.disabled}
            className="h-8 max-w-32 rounded-md border bg-background px-1 text-xs"
            onChange={(event) => c.setCaption(Number(event.target.value))}
          >
            <option value={-1}>Captions off</option>
            {c.tracks.map((track, index) => (
              <option key={`${track.src}-${index}`} value={index}>
                {track.label}
              </option>
            ))}
          </select>
        )}
        {c.canPip && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Picture in picture"
            disabled={c.disabled}
            onClick={c.togglePip}
          >
            <PictureInPicture2 />
          </Button>
        )}
        {c.canFullscreen && c.kind === 'video' && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={c.fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            disabled={c.disabled}
            onClick={c.toggleFullscreen}
          >
            {c.fullscreen ? <Minimize /> : <Maximize />}
          </Button>
        )}
      </div>
    </div>
  )
}
