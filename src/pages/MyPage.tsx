import { useAuth } from '../auth/AuthContext'
import { memberApi } from '../api/member'
import { useAsync } from '../hooks/useAsync'
import { useI18n } from '../i18n/I18nContext'
import { ErrorMessage, Loading } from '../components/Feedback'

/**
 * 마이페이지.
 *
 * 주의: `/mypage` 는 **일반회원(GNR)** 테이블을 조회한다. 업무사용자(USR·관리자 계정)로 로그인하면
 * 회원 정보가 없어 서버가 "회원 정보를 찾을 수 없습니다"를 돌려준다 — 오류가 아니라 계정 종류의 차이다.
 * 그래서 서버 조회가 실패해도 로그인 정보(/auth/me)로 기본 정보는 보여준다.
 */
export function MyPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { data, loading, error } = useAsync(() => memberApi.myPage(), [])

  if (loading) return <Loading />

  return (
    <>
      <h1 className="h3 mb-3">{t('nav.mypage', '마이페이지')}</h1>

      <div className="krds-panel">
        <div className="krds-panel-head">
          <h2 className="h5 mb-0">{t('mypage.info', '내 정보')}</h2>
        </div>
        <div className="krds-panel-body">
          <div className="krds-table-wrap">
            <table className="tbl col">
              <caption>{t('mypage.infoCaption', '내 정보 — 아이디, 이름, 이메일')}</caption>
              <tbody>
                <tr>
                  <th scope="row">{t('login.id', '아이디')}</th>
                  <td>{data?.mberId ?? data?.emplyrId ?? user?.id ?? '-'}</td>
                </tr>
                <tr>
                  <th scope="row">{t('mypage.name', '이름')}</th>
                  <td>{data?.mberNm ?? data?.userNm ?? user?.name ?? '-'}</td>
                </tr>
                <tr>
                  <th scope="row">{t('mypage.email', '이메일')}</th>
                  <td>{data?.emailAdres ?? '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {error && (
            <div className="mt-3">
              <ErrorMessage message={error} />
              <p className="form-hint mb-0">
                {t(
                  'mypage.notMember',
                  '업무사용자 계정은 회원 정보가 없습니다. 로그인 정보만 표시합니다.',
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
