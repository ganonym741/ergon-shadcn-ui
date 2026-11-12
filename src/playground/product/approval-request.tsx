import * as React from 'react'
import { ApprovalRequest, type ApprovalRequestData } from '@/components/ui/approval-request'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { approvalData } from '../product-data'
import { DemoNote, simulate, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [request, setRequest] = React.useState<ApprovalRequestData>({
      ...(parseData(v, 'data', approvalData) as ApprovalRequestData),
      ...(v.expired ? { expiresAt: '2026-01-01T00:00:00Z' } : {}),
    })
  return (
    <div className="mx-auto w-full max-w-xl space-y-3">
      <DemoNote>
        This is a simulated approval checkpoint. No message is sent. A real backend must authorize
        the user, validate arguments and compare the request ID and revision before executing
        anything.
      </DemoNote>
      <ApprovalRequest
        request={request}
        editableArguments={!!v.editable}
        disabled={!!v.disabled}
        onDecide={async (decision, { signal }) => {
          await simulate(signal, !!v.failure)
          if (!signal.aborted) {
            setRequest((current) => ({
              ...current,
              status: decision.decision === 'approve' ? 'approved' : 'rejected',
              arguments: decision.arguments,
            }))
            report(props, 'decision', decision)
          }
        }}
      />
    </div>
  )
}
