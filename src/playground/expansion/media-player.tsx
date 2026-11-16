import { MediaPlayer } from '@/components/ui/media-player'
import type { PreviewProps } from '../preview'
import { report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    kind = v.kind as 'video' | 'audio'
  return (
    <div className="w-full max-w-2xl space-y-3">
      <MediaPlayer
        kind={kind}
        src={String(kind === 'video' ? v.video : v.audio)}
        title={String(v.title)}
        description={kind === 'audio' ? 'Original eight-second ErgonUI ambient tone.' : undefined}
        poster={kind === 'audio' ? '/demos/landscape.svg' : String(v.poster || '') || undefined}
        tracks={
          v.captions ? [{ src: '/demos/captions.vtt', label: 'English', language: 'en' }] : []
        }
        loop={!!v.loop}
        defaultMuted={!!v.muted}
        defaultVolume={Number(v.volume) / 100}
        preload={v.preload as 'none' | 'metadata' | 'auto'}
        nativeControls={!!v.native}
        disabled={!!v.disabled}
        onStateChange={(state) => {
          if (!state.playing || state.ended) report(props, 'media-state', state)
        }}
        onEnded={() => report(props, 'ended', true)}
        onError={(error) => report(props, 'media-error', error.message)}
      />
      <p className="text-xs text-muted-foreground">
        {kind === 'video'
          ? 'Flower video: MDN, CC0.'
          : 'Ambient audio is an original ErgonUI sample.'}{' '}
        Captions are sample text. Fullscreen and picture-in-picture appear when supported by the
        browser.
      </p>
    </div>
  )
}
