import type { ReactNode } from 'react'
import { useI18n } from '../i18n/I18nContext'

/** 로딩 표시 — 스크린리더가 상태 변화를 읽도록 role/aria-live 를 붙인다 */
export function Loading({ label }: { label?: string }) {
  const { t } = useI18n()
  return (
    <div className="py-5 text-center" role="status" aria-live="polite">
      <span>{label ?? t('com.loading', '불러오는 중…')}</span>
    </div>
  )
}

/** 오류 표시 — 서버가 준 메시지를 그대로 보여준다 */
export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n()
  return (
    <div className="krds-alert danger my-3" role="alert">
      <p className="mb-2">{message}</p>
      {onRetry && (
        <button type="button" className="krds-btn secondary small" onClick={onRetry}>
          {t('com.retry', '다시 시도')}
        </button>
      )}
    </div>
  )
}

/** 목록이 비었을 때 */
export function EmptyState({ children }: { children?: ReactNode }) {
  const { t } = useI18n()
  return <div className="py-5 text-center text-muted">{children ?? t('com.noData', '조회된 데이터가 없습니다.')}</div>
}
