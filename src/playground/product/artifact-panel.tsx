import * as React from 'react'
import { ArtifactPanel, type ArtifactData } from '@/components/ui/artifact-panel'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { artifactData } from '../product-data'
import { productURL } from '@/components/ui/product-utils'
import { DemoNote, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [version, setVersion] = React.useState(String(v.version))
  const artifact = parseData(v, 'data', artifactData) as ArtifactData
  if (
    !artifact ||
    !Array.isArray(artifact.versions) ||
    artifact.versions.some((item) => !item || typeof item.content !== 'string')
  )
    return (
      <p role="alert" className="text-sm text-destructive">
        Artifact data needs a versions array with text content for each version.
      </p>
    )
  return (
    <div className="w-full space-y-3">
      <DemoNote>
        Original document versions demonstrate preview, source, differences and download. Code
        artifacts display source; an application can provide an isolated custom preview when
        execution is required.
      </DemoNote>
      <ArtifactPanel
        artifact={artifact}
        versionId={version}
        onVersionChange={(id) => {
          setVersion(id)
          report(props, 'version', id)
        }}
        defaultView={v.view as 'preview' | 'source' | 'diff'}
        onViewChange={(view) => report(props, 'artifact-view', view)}
        onDownload={
          v.download
            ? async (artifact, version) => {
                const image = artifact.kind === 'image'
                let blob = new Blob([version.content], { type: 'text/plain;charset=utf-8' })
                if (image) {
                  const source = productURL(version.content, true)
                  if (!source) throw new Error('Unsupported image URL.')
                  const response = await fetch(source, { credentials: 'omit' })
                  if (!response.ok)
                    throw new Error(
                      'The image could not be downloaded. Its server must allow cross-origin access.',
                    )
                  blob = await response.blob()
                }
                const href = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = href
                link.download = artifact.filename ?? `${artifact.id}${image ? '.png' : '.txt'}`
                link.click()
                setTimeout(() => URL.revokeObjectURL(href), 0)
                report(props, 'download-request', {
                  id: artifact.id,
                  version: version.id,
                  bytes: blob.size,
                })
              }
            : undefined
        }
        renderPreview={
          v.custom
            ? (artifact, version) => (
                <div className="rounded-xl bg-primary/5 p-6">
                  <p className="text-[10px] uppercase tracking-widest text-primary">
                    A custom document preview
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{artifact.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {version.label} · {version.content.length} characters
                  </p>
                  <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed">
                    {version.content}
                  </div>
                </div>
              )
            : undefined
        }
      />
    </div>
  )
}
