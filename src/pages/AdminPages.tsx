import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AdminCrudPage } from '../components/AdminCrudPage'
import { ErrorMessage } from '../components/Feedback'
import { useI18n } from '../i18n/I18nContext'
import { ApiError } from '../api/client'
import { boardMasterAdminApi, boardUseAdminApi, siteAdminApi } from '../api/admin'
import type { BoardUseInfo } from '../api/admin'
import type { BoardMaster } from '../api/types'

/**
 * 관리자 화면 모음.
 *
 * 서버 렌더링 판에서 도메인마다 목록·등록·수정·상세 네 개씩 있던 화면을,
 * SPA 에서는 `AdminCrudPage` 골격 위에 컬럼·필드·API 세 가지만 지정해 만든다.
 */

// ---------------------------------------------------------------- 게시판 마스터

export function BoardMasterAdminPage() {
  const { t } = useI18n()
  return (
    <AdminCrudPage<BoardMaster>
      title={t('nav.boardManage', '게시판 관리')}
      caption={t('bbsMaster.listCaption', '게시판 목록 — 게시판명, 유형, 속성, 사용여부, 등록일')}
      rowKey={(row) => row.bbsId}
      columns={[
        {
          header: t('bbsMaster.name', '게시판명'),
          alignStart: true,
          cell: (row) => <Link to={`/board/${row.bbsId}`}>{row.bbsNm}</Link>,
        },
        { header: t('bbsMaster.type', '유형'), width: '14%', cell: (row) => row.bbsTyCodeNm },
        { header: t('bbsMaster.attribute', '속성'), width: '14%', cell: (row) => row.bbsAttrbCodeNm },
        {
          header: t('bbsMaster.use', '사용'),
          width: '10%',
          cell: (row) => (
            <span className={`krds-badge ${row.useAt === 'Y' ? 'bg-primary' : 'bg-gray'}`}>
              {row.useAt === 'Y' ? t('com.yes', '사용') : t('com.no', '미사용')}
            </span>
          ),
        },
        { header: t('bbs.date', '등록일'), width: '14%', cell: (row) => row.frstRegisterPnttm ?? '-' },
      ]}
      fields={[
        { name: 'bbsNm', label: t('bbsMaster.name', '게시판명'), required: true },
        { name: 'bbsIntrcn', label: t('bbsMaster.intro', '게시판 소개'), type: 'textarea' },
        {
          name: 'bbsTyCode',
          label: t('bbsMaster.type', '유형'),
          type: 'select',
          required: true,
          options: [
            { value: 'BBST01', label: t('bbsMaster.typeNormal', '일반게시판') },
            { value: 'BBST02', label: t('bbsMaster.typeAnonymous', '익명게시판') },
            { value: 'BBST03', label: t('bbsMaster.typeNotice', '공지게시판') },
          ],
        },
        {
          name: 'bbsAttrbCode',
          label: t('bbsMaster.attribute', '속성'),
          type: 'select',
          required: true,
          options: [
            { value: 'BBSA01', label: t('bbsMaster.attrNormal', '일반') },
            { value: 'BBSA02', label: t('bbsMaster.attrGallery', '갤러리') },
            { value: 'BBSA03', label: t('bbsMaster.attrGeneral', '일반게시판') },
          ],
        },
        {
          name: 'fileAtchPosblAt',
          label: t('bbsMaster.fileAttach', '첨부 가능'),
          type: 'select',
          options: [
            { value: 'Y', label: t('com.yes', '예') },
            { value: 'N', label: t('com.no', '아니오') },
          ],
        },
        {
          name: 'posblAtchFileNumber',
          label: t('bbsMaster.fileCount', '첨부 가능 개수'),
          type: 'number',
          hint: t('bbsMaster.fileCountHint', '첨부 가능 여부가 "예"일 때만 의미가 있습니다.'),
        },
        {
          name: 'replyPosblAt',
          label: t('bbsMaster.reply', '답변 가능'),
          type: 'select',
          options: [
            { value: 'Y', label: t('com.yes', '예') },
            { value: 'N', label: t('com.no', '아니오') },
          ],
        },
        {
          name: 'useAt',
          label: t('bbsMaster.use', '사용여부'),
          type: 'select',
          options: [
            { value: 'Y', label: t('com.yes', '사용') },
            { value: 'N', label: t('com.no', '미사용') },
          ],
        },
      ]}
      toFormValues={(row) => ({
        bbsNm: row.bbsNm ?? '',
        bbsIntrcn: row.bbsIntrcn ?? '',
        bbsTyCode: row.bbsTyCode ?? '',
        bbsAttrbCode: row.bbsAttrbCode ?? '',
        fileAtchPosblAt: row.fileAtchPosblAt ?? 'N',
        posblAtchFileNumber: String(row.posblAtchFileNumber ?? 0),
        replyPosblAt: row.replyPosblAt ?? 'N',
        useAt: row.useAt ?? 'Y',
      })}
      fetchList={(pageIndex, keyword) => boardMasterAdminApi.list(pageIndex, keyword)}
      onCreate={(v) => boardMasterAdminApi.create(v)}
      onUpdate={(row, v) => boardMasterAdminApi.update(row.bbsId, v)}
      onDelete={(row) => boardMasterAdminApi.remove(row.bbsId)}
      searchPlaceholder={t('bbsMaster.searchPlaceholder', '게시판명을 입력하세요')}
    />
  )
}

// ------------------------------------------------------------ 게시판 사용정보

export function BoardUseAdminPage() {
  const { t } = useI18n()
  return (
    <AdminCrudPage<BoardUseInfo>
      title={t('nav.boardUse', '게시판 사용정보')}
      caption={t('boardUse.listCaption', '게시판 사용정보 목록 — 대상, 게시판, 사용여부')}
      rowKey={(row) => `${row.trgetId}-${row.bbsId}`}
      columns={[
        { header: t('boardUse.target', '대상'), width: '28%', cell: (row) => row.trgetId },
        { header: t('bbsMaster.name', '게시판명'), alignStart: true, cell: (row) => row.bbsNm ?? row.bbsId },
        {
          header: t('bbsMaster.use', '사용'),
          width: '10%',
          cell: (row) => (
            <span className={`krds-badge ${row.useAt === 'Y' ? 'bg-primary' : 'bg-gray'}`}>
              {row.useAt === 'Y' ? t('com.yes', '사용') : t('com.no', '미사용')}
            </span>
          ),
        },
      ]}
      fields={[
        {
          name: 'trgetId',
          label: t('boardUse.target', '대상 ID'),
          required: true,
          readOnlyOnEdit: true,
          hint: t('boardUse.targetHint', '게시판을 사용할 커뮤니티·동호회 등의 식별자입니다.'),
        },
        { name: 'bbsId', label: t('boardUse.bbsId', '게시판 ID'), required: true, readOnlyOnEdit: true },
        {
          name: 'useAt',
          label: t('bbsMaster.use', '사용여부'),
          type: 'select',
          options: [
            { value: 'Y', label: t('com.yes', '사용') },
            { value: 'N', label: t('com.no', '미사용') },
          ],
        },
      ]}
      toFormValues={(row) => ({ trgetId: row.trgetId, bbsId: row.bbsId, useAt: row.useAt ?? 'Y' })}
      fetchList={(pageIndex) => boardUseAdminApi.list(pageIndex)}
      onCreate={(v) => boardUseAdminApi.create(v)}
      onUpdate={(row, v) => boardUseAdminApi.update(row.bbsId, v)}
      searchable={false}
    />
  )
}

// ------------------------------------------------------- 관리자 비밀번호 변경

/**
 * 관리자 비밀번호 변경.
 *
 * 서버가 현재 비밀번호를 저장값과 대조한 뒤에만 바꾼다.
 * 이 API 는 <b>평문</b>을 받는다(서버가 이중 해시를 직접 만든다) — 로그인과 규칙이 다르다.
 */
export function AdminPasswordPage() {
  const { t } = useI18n()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setDone(false)

    if (newPassword !== confirmPassword) {
      setError(t('adminpw.mismatch', '비밀번호가 일치하지 않습니다.'))
      return
    }

    setSubmitting(true)
    try {
      await siteAdminApi.changePassword(oldPassword, newPassword)
      setDone(true)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('adminpw.fail', '비밀번호를 변경하지 못했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6">
        <h1 className="h3 mb-3">{t('adminpw.title', '관리자 비밀번호 변경')}</h1>

        {error && <ErrorMessage message={error} />}
        {done && (
          <div className="krds-alert success mb-3" role="status">
            {t('adminpw.done', '비밀번호를 변경했습니다.')}
          </div>
        )}

        <form className="krds-panel" onSubmit={handleSubmit} noValidate>
          <div className="krds-panel-body">
            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="adminpw-old">{t('adminpw.cur', '현재 비밀번호')}</label>
              </div>
              <div className="form-conts">
                <input
                  id="adminpw-old"
                  className="krds-input"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder={t('adminpw.ph.cur', '현재 비밀번호를 입력하세요')}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="adminpw-new">{t('adminpw.new', '새 비밀번호')}</label>
              </div>
              <div className="form-conts">
                <input
                  id="adminpw-new"
                  className="krds-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('adminpw.ph.new', '새 비밀번호를 입력하세요 (8자 이상)')}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="adminpw-confirm">{t('adminpw.confirm', '새 비밀번호 확인')}</label>
              </div>
              <div className="form-conts">
                <input
                  id="adminpw-confirm"
                  className="krds-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('adminpw.ph.confirm', '새 비밀번호를 다시 입력하세요')}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          </div>

          <div className="krds-panel-body border-top">
            <button
              type="submit"
              className="krds-btn primary"
              disabled={submitting || !oldPassword || !newPassword || !confirmPassword}
            >
              {submitting ? t('com.processing', '처리 중…') : t('com.save', '저장')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
