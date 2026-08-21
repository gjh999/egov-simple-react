import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { boardApi } from '../api/board'
import { api, ApiError } from '../api/client'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { ErrorMessage, Loading } from '../components/Feedback'

export function BoardDetailPage() {
  const { bbsId = '', nttId = '' } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { user, isAdmin } = useAuth()

  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, loading, error, reload } = useAsync(() => boardApi.detail(bbsId, nttId), [bbsId, nttId])

  if (loading) return <Loading />
  if (error) return <ErrorMessage message={error} onRetry={reload} />
  if (!data?.boardVO) return <ErrorMessage message={t('bbs.notFound', '게시물을 찾을 수 없습니다.')} />

  const article = data.boardVO
  // 작성자 본인 또는 관리자만 수정·삭제할 수 있다. 서버도 같은 규칙으로 다시 검사한다.
  const canEdit = isAdmin || (user?.uniqId !== undefined && user.uniqId === article.frstRegisterId)
  const canReply = data.brdMstrVO?.replyPosblAt === 'Y' && user !== null

  const handleDelete = async () => {
    if (!window.confirm(t('bbs.confirmDelete', '이 게시물을 삭제하시겠습니까?'))) return
    setDeleting(true)
    setActionError(null)
    try {
      await boardApi.remove(bbsId, nttId)
      navigate(`/board/${bbsId}`, { replace: true })
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : t('bbs.deleteFail', '삭제하지 못했습니다.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <h1 className="h3 mb-3">{article.bbsNm}</h1>

      {actionError && <ErrorMessage message={actionError} />}

      <article className="krds-panel">
        <div className="krds-panel-head">
          <h2 className="h5 mb-0">{article.nttSj}</h2>
        </div>
        <div className="krds-panel-body">
          <dl className="row small text-muted border-bottom pb-3 mb-3">
            <dt className="col-3 col-md-2">{t('bbs.writer', '작성자')}</dt>
            <dd className="col-9 col-md-4">{article.frstRegisterNm}</dd>
            <dt className="col-3 col-md-2">{t('bbs.date', '등록일')}</dt>
            <dd className="col-9 col-md-4">{article.frstRegisterPnttm}</dd>
            <dt className="col-3 col-md-2">{t('bbs.hit', '조회')}</dt>
            <dd className="col-9 col-md-4 mb-0">{article.inqireCo}</dd>
          </dl>

          {/*
            본문은 서버가 HTMLTagFilter 로 escape 한 텍스트다.
            dangerouslySetInnerHTML 을 쓰지 않고 텍스트로 렌더링해 XSS 경로를 아예 만들지 않는다.
            줄바꿈만 유지한다.
          */}
          <div style={{ whiteSpace: 'pre-wrap' }}>{article.nttCn}</div>

          {(data.fileList?.length ?? 0) > 0 && (
            <section className="mt-4 pt-3 border-top">
              <h3 className="h6">{t('bbs.attach', '첨부파일')}</h3>
              <ul className="list-unstyled mb-0">
                {data.fileList?.map((file) => (
                  <li key={`${file.atchFileId}-${file.fileSn}`}>
                    <a href={api.fileUrl(file.atchFileId, file.fileSn)}>
                      <i className="bi bi-paperclip" aria-hidden="true" /> {file.orignlFileNm}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>

      <div className="d-flex gap-2 mt-3">
        <Link to={`/board/${bbsId}`} className="krds-btn tertiary">
          {t('com.list', '목록')}
        </Link>
        {canReply && (
          <Link to={`/board/${bbsId}/${nttId}/reply`} className="krds-btn secondary">
            {t('bbs.reply', '답변')}
          </Link>
        )}
        {canEdit && (
          <>
            <Link to={`/board/${bbsId}/${nttId}/edit`} className="krds-btn secondary">
              {t('com.edit', '수정')}
            </Link>
            <button type="button" className="krds-btn danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? t('com.processing', '처리 중…') : t('com.delete', '삭제')}
            </button>
          </>
        )}
      </div>
    </>
  )
}
