import { Extension, type Editor } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
export interface ImageUploadAnchor {
  id: string
  from: number
  to: number
  name: string
}
type AnchorChange = { add?: ImageUploadAnchor[]; remove?: string; clear?: boolean }
export const imageUploadAnchors = new PluginKey<ReadonlyMap<string, ImageUploadAnchor>>(
  'ergon-image-upload-anchors',
)
export const RichTextUploadAnchors = Extension.create({
  name: 'ergonImageUploads',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: imageUploadAnchors,
        state: {
          init: () => new Map<string, ImageUploadAnchor>(),
          apply(transaction, previous) {
            const next = new Map<string, ImageUploadAnchor>()
            previous.forEach((anchor) => {
              const from = transaction.mapping.mapResult(anchor.from, 1),
                to = transaction.mapping.mapResult(anchor.to, 1)
              if (!from.deletedAcross && !to.deletedAcross)
                next.set(anchor.id, { ...anchor, from: from.pos, to: to.pos })
            })
            const change = transaction.getMeta(imageUploadAnchors) as AnchorChange | undefined
            if (change?.clear) next.clear()
            if (change?.remove) next.delete(change.remove)
            change?.add?.forEach((anchor) => next.set(anchor.id, anchor))
            return next
          },
        },
        props: {
          decorations(state) {
            return DecorationSet.create(
              state.doc,
              Array.from(imageUploadAnchors.getState(state)?.values() ?? []).map((anchor) =>
                Decoration.widget(
                  anchor.from,
                  () => {
                    const marker = document.createElement('span')
                    marker.contentEditable = 'false'
                    marker.className = 'ergon-image-upload-anchor'
                    marker.setAttribute('role', 'status')
                    marker.textContent = `Uploading ${anchor.name}…`
                    marker.style.cssText =
                      'display:inline-block;padding:4px 8px;margin:4px;border:1px dashed var(--border);border-radius:6px;font-size:12px;color:var(--muted-foreground);background:var(--muted)'
                    return marker
                  },
                  { key: anchor.id, side: 1 },
                ),
              ),
            )
          },
        },
      }),
    ]
  },
})
export function changeImageUploadAnchors(editor: Editor, change: AnchorChange) {
  if (!editor.isDestroyed)
    editor.view.dispatch(
      editor.state.tr.setMeta(imageUploadAnchors, change).setMeta('addToHistory', false),
    )
}
export function richTextURL(value: string, kind: 'image' | 'link'): string | undefined {
  const text = value.trim()
  // eslint-disable-next-line no-control-regex -- Reject control characters in untrusted URLs.
  if (!text || /[\u0000-\u001f\u007f]/.test(text)) return
  try {
    const url = new URL(text, 'https://ergon.invalid')
    const allowed =
      kind === 'image' ? ['http:', 'https:', 'blob:'] : ['http:', 'https:', 'mailto:', 'tel:']
    if (!allowed.includes(url.protocol)) return
    return text
  } catch {
    return
  }
}
export function withUploadSignal<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Upload cancelled', 'AbortError'))
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
    promise.then(
      (value) => {
        signal.removeEventListener('abort', abort)
        resolve(value)
      },
      (error) => {
        signal.removeEventListener('abort', abort)
        reject(error)
      },
    )
  })
}
