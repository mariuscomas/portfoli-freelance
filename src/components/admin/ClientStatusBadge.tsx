import { CLIENT_STATUS_META, type ClientStatus } from '@/types/database'

/**
 * <ClientStatusBadge />
 *
 * Pill visual de l'estat del client, coherent entre llistat, filtres i
 * fitxa. El color es deriva del `tone` definit a CLIENT_STATUS_META,
 * mapejat als tokens semàntics del sistema (accent / warning / error /
 * neutral) per heretar automàticament dels modes clar/fosc.
 */

const TONE_CLASSES: Record<
  (typeof CLIENT_STATUS_META)[ClientStatus]['tone'],
  string
> = {
  info: 'bg-surface-card border border-surface-border text-text-main',
  neutral: 'bg-surface-base border border-surface-border text-text-secondary',
  warning: 'bg-warning-surface text-warning-main border border-warning-main/30',
  success: 'bg-accent-surface text-text-main border border-accent/30',
  error: 'bg-error-surface text-error border border-error/30',
}

export default function ClientStatusBadge({
  status,
  size = 'md',
}: {
  status: ClientStatus
  /** Mida visual: la `sm` és per a taules denses, la `md` per a headers. */
  size?: 'sm' | 'md'
}) {
  const meta = CLIENT_STATUS_META[status]
  const sizing =
    size === 'sm'
      ? 'px-2 py-0.5 text-body-xs'
      : 'px-2.5 py-1 text-body-sm'

  return (
    <span
      title={meta.description}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${TONE_CLASSES[meta.tone]} ${sizing}`}
    >
      <span
        aria-hidden
        className={`inline-block w-1.5 h-1.5 rounded-full ${
          meta.tone === 'success'
            ? 'bg-accent'
            : meta.tone === 'warning'
              ? 'bg-warning-main'
              : meta.tone === 'error'
                ? 'bg-error'
                : meta.tone === 'info'
                  ? 'bg-text-main'
                  : 'bg-text-secondary/60'
        }`}
      />
      {meta.label}
    </span>
  )
}
