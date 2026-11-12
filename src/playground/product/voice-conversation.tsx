import { VoiceConversation, type VoiceTurn } from '@/components/ui/voice-conversation'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { DemoNote, simulate, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config
  return (
    <div className="mx-auto w-full max-w-xl space-y-3">
      <DemoNote>
        Click Start talking to request microphone access. Audio remains in your browser. The adapter
        returns a fixed simulated transcript and response, rather than transcribing your recording.
        Spoken responses use the browser’s speech service when enabled.
      </DemoNote>
      <VoiceConversation
        defaultValue={parseData(v, 'data', []) as VoiceTurn[]}
        autoSpeak={!!v.speak}
        language={String(v.language)}
        maxDurationSeconds={+v.duration}
        disabled={!!v.disabled}
        onStatusChange={(status) => report(props, 'voice-status', status)}
        onValueChange={(turns) => report(props, 'transcript', turns)}
        onAudioChunk={
          v.live
            ? async (blob, { signal }) => {
                if (!signal.aborted)
                  report(props, 'local-audio-chunk', { bytes: blob.size, type: blob.type })
              }
            : undefined
        }
        onProcessRecording={async (audio, { signal }) => {
          await simulate(signal, !!v.failure)
          report(props, 'local-recording', { bytes: audio.size, type: audio.type })
          return {
            transcript: 'Simulated transcript: How can we make a calmer workspace?',
            response:
              'Give the next useful action a clear place. Group related details, and leave a little room to think.',
          }
        }}
      />
    </div>
  )
}
