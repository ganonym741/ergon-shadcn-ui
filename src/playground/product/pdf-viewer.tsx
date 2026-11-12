import { PDFViewer } from '@/components/ui/pdf-viewer'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { PreviewProps } from '../preview'
import { DemoNote, report } from './shared'
const options = { useSystemFonts: true }
export default function Preview(props: PreviewProps) {
  const v = props.config
  return (
    <div className="w-full space-y-3">
      <DemoNote>
        The original two-page PDF is served locally. Search “workspace”, select text, inspect
        thumbnails, rotate, zoom, or download. Custom documents must allow browser access;
        password-protected PDFs show an unlock form.
      </DemoNote>
      <PDFViewer
        source={String(v.source)}
        workerSrc={workerSrc}
        documentOptions={options}
        defaultPage={+v.page}
        defaultScale={+v.scale / 100}
        height={+v.height}
        showThumbnails={!!v.thumbnails}
        textLayer={!!v.textLayer}
        searchable={!!v.search}
        maxSearchPages={+v.searchPages}
        filename="ergon-guide.pdf"
        onPageChange={(page) => report(props, 'page', page)}
        onScaleChange={(scale) => report(props, 'zoom', scale)}
        onDocumentLoad={(info) => report(props, 'document-loaded', info)}
        onError={(error) => report(props, 'pdf-error', error.message)}
      />
    </div>
  )
}
