import * as React from 'react'
import { toast, type ExternalToast, type ToasterProps } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
export { toast as message } from 'sonner'
export { Toaster as MessageProvider } from '@/components/ui/sonner'
export function useMessage(options: Omit<ToasterProps, 'id'> = {}) {
  const id = React.useId(),
    api = React.useMemo(
      () => ({
        success: (text: string, props?: ExternalToast) =>
          toast.success(text, { ...props, toasterId: id }),
        error: (text: string, props?: ExternalToast) =>
          toast.error(text, { ...props, toasterId: id }),
        info: (text: string, props?: ExternalToast) =>
          toast.info(text, { ...props, toasterId: id }),
        warning: (text: string, props?: ExternalToast) =>
          toast.warning(text, { ...props, toasterId: id }),
        promise: <T,>(
          promise: Promise<T>,
          messages: { loading: string; success: string; error: string },
        ) => toast.promise(promise, { ...messages, toasterId: id }),
        dismiss: toast.dismiss,
      }),
      [id],
    )
  return [api, <Toaster key={id} id={id} richColors closeButton {...options} />] as const
}
