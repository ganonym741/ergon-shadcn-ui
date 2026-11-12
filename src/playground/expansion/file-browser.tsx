import * as React from 'react'
import { FileBrowser, type FileBrowserEntry } from '@/components/ui/file-browser'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { fileData } from '../expansion-data'
import { report, simulate } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [entries, setEntries] = React.useState(parseData(v, 'data', fileData) as FileBrowserEntry[]),
    operations = !!v.operations
  return (
    <div className="w-full space-y-3">
      <p className="text-xs text-muted-foreground">
        All operations are simulated in memory. Uploads add local metadata; downloads contain
        demonstration text. Nothing is sent to a storage service.
      </p>
      <FileBrowser
        entries={entries}
        defaultView={v.view as 'grid' | 'list'}
        defaultSortBy={v.sort as 'name' | 'size' | 'modified'}
        defaultSortDirection={v.direction as 'asc' | 'desc'}
        searchScope={v.searchScope as 'folder' | 'all'}
        pageSize={Number(v.pageSize)}
        multiple={!!v.multiple}
        disabled={!!v.disabled}
        onSelectionChange={(value) => report(props, 'selection', value)}
        onFolderChange={(value) => report(props, 'folder', value)}
        onError={(error) => report(props, 'operation-error', error.message)}
        onCreateFolder={
          operations
            ? async (name, parentId, { signal }) => {
                await simulate(signal, !!v.failure)
                setEntries((previous) => [
                  ...previous,
                  { id: crypto.randomUUID(), name, parentId, kind: 'folder' },
                ])
                report(props, 'create-folder', { name, parentId })
              }
            : undefined
        }
        onRename={
          operations
            ? async (entry, name, { signal }) => {
                await simulate(signal, !!v.failure)
                setEntries((previous) =>
                  previous.map((item) => (item.id === entry.id ? { ...item, name } : item)),
                )
                report(props, 'rename', { id: entry.id, name })
              }
            : undefined
        }
        onMove={
          operations
            ? async (items, parentId, { signal }) => {
                await simulate(signal, !!v.failure)
                setEntries((previous) =>
                  previous.map((item) =>
                    items.some((entry) => entry.id === item.id) ? { ...item, parentId } : item,
                  ),
                )
                report(props, 'move', { ids: items.map((item) => item.id), parentId })
              }
            : undefined
        }
        onDelete={
          operations
            ? async (items, { signal }) => {
                await simulate(signal, !!v.failure)
                setEntries((previous) => {
                  const removed = new Set(items.map((item) => item.id))
                  let added = true
                  while (added) {
                    added = false
                    for (const item of previous)
                      if (item.parentId && removed.has(item.parentId) && !removed.has(item.id)) {
                        removed.add(item.id)
                        added = true
                      }
                  }
                  return previous.filter((item) => !removed.has(item.id))
                })
                report(
                  props,
                  'delete',
                  items.map((item) => item.id),
                )
              }
            : undefined
        }
        onUpload={
          operations
            ? async (files, parentId, { signal }) => {
                await simulate(signal, !!v.failure)
                setEntries((previous) => [
                  ...previous,
                  ...files.map((file) => ({
                    id: crypto.randomUUID(),
                    parentId,
                    name: file.name,
                    kind: 'file' as const,
                    size: file.size,
                    mimeType: file.type,
                    modifiedAt: new Date(file.lastModified).toISOString(),
                  })),
                ])
                report(
                  props,
                  'upload',
                  files.map((file) => ({ name: file.name, size: file.size })),
                )
              }
            : undefined
        }
        onDownload={
          operations
            ? async (entry, { signal }) => {
                await simulate(signal, !!v.failure)
                const url = URL.createObjectURL(
                    new Blob(
                      [
                        `Demonstration download: ${entry.name}\nProvide onDownload to retrieve real application content.\n`,
                      ],
                      { type: 'text/plain' },
                    ),
                  ),
                  link = document.createElement('a')
                link.href = url
                link.download = `${entry.name}.demo.txt`
                link.click()
                setTimeout(() => URL.revokeObjectURL(url), 1000)
                report(props, 'download', entry.id)
              }
            : undefined
        }
      />
    </div>
  )
}
