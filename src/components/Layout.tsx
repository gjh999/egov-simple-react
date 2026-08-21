import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'

/** 공지사항·갤러리 게시판 ID — 백엔드 시드 데이터 기준 */
const NOTICE_BBS_ID = 'BBSMSTR_AAAAAAAAAAAA'
const GALLERY_BBS_ID = 'BBSMSTR_BBBBBBBBBBBB'

export function Layout() {
  const { t } = useI18n()

  return (
    <>
      {/* 접근성: 반복되는 헤더/내비게이션을 건너뛰고 본문으로 이동 (KWCAG 2.2) */}
      <a href="#content" className="skip-nav">
        {t('com.skipNav', '본문 바로가기')}
      </a>

      <Header />
      <MainNav />

      <main id="content" className="egov-content container-fluid py-4">
        <Outlet />
      </main>

      <Footer />
      <ScrollTopButton />
    </>
  )
}

function Header() {
  const { t, lang, setLang } = useI18n()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="egov-header bg-white border-bottom shadow-sm">
      <div className="container-fluid d-flex align-items-center justify-content-between py-2 px-4">
        <div className="egov-header-logo">
          <Link to="/" className="text-decoration-none d-flex align-items-center">
            <span className="fw-bold text-primary fs-5">{t('header.brand', '전자정부 표준프레임워크')}</span>
          </Link>
        </div>

        <div className="egov-header-user d-flex align-items-center gap-2">
          <div className="egov-lang" role="group" aria-label={t('lang.select', '언어 선택')}>
            <button
              type="button"
              className={`lang-btn${lang === 'ko' ? ' active' : ''}`}
              aria-pressed={lang === 'ko'}
              onClick={() => setLang('ko')}
            >
              {t('lang.korean.short', '한국어')}
            </button>
            <button
              type="button"
              className={`lang-btn${lang === 'en' ? ' active' : ''}`}
              aria-pressed={lang === 'en'}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>

          {isAuthenticated && isAdmin && (
            <Link to="/admin/members" className="krds-btn secondary small" title={t('nav.member', '회원관리')}>
              <i className="bi bi-person-gear" aria-hidden="true" />
              <strong>{user?.name}</strong> <span>{t('header.honorific', '님')}</span>
            </Link>
          )}
          {isAuthenticated && !isAdmin && (
            <Link to="/mypage" className="krds-btn secondary small" title={t('nav.mypage', '마이페이지')}>
              <i className="bi bi-person-circle" aria-hidden="true" />
              <strong>{user?.name}</strong> <span>{t('header.honorific', '님')}</span>
            </Link>
          )}

          {isAuthenticated ? (
            <button type="button" className="krds-btn tertiary small" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" aria-hidden="true" />
              <span>{t('header.logout', '로그아웃')}</span>
            </button>
          ) : (
            <>
              <Link to="/register" className="krds-btn tertiary small">
                {t('nav.join', '회원가입')}
              </Link>
              <Link to="/login" className="krds-btn primary small">
                <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                <span>{t('login.submit', '로그인')}</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function MainNav() {
  const { t } = useI18n()
  const { isAuthenticated, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`

  return (
    <nav className="egov-nav navbar navbar-expand-lg navbar-dark bg-primary" aria-label={t('nav.main', '주요 메뉴')}>
      <div className="container-fluid px-4">
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="mainNav"
          aria-expanded={open}
          aria-label={t('nav.toggle', '메뉴 펼치기')}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse${open ? ' show' : ''}`} id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
                {t('nav.home', '홈')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to={`/board/${NOTICE_BBS_ID}`} className={linkClass} onClick={() => setOpen(false)}>
                {t('nav.notice', '공지사항')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to={`/board/${GALLERY_BBS_ID}`} className={linkClass} onClick={() => setOpen(false)}>
                {t('nav.gallery', '갤러리')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/schedule" className={linkClass} onClick={() => setOpen(false)}>
                {t('nav.schedule', '일정관리')}
              </NavLink>
            </li>
            {isAuthenticated && !isAdmin && (
              <li className="nav-item">
                <NavLink to="/mypage" className={linkClass} onClick={() => setOpen(false)}>
                  {t('nav.mypage', '마이페이지')}
                </NavLink>
              </li>
            )}
            {isAdmin && (
              <>
                <li className="nav-item">
                  <NavLink to="/admin/members" className={linkClass} onClick={() => setOpen(false)}>
                    {t('nav.member', '회원관리')}
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/board-master" className={linkClass} onClick={() => setOpen(false)}>
                    {t('nav.boardManage', '게시판 관리')}
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/board-use" className={linkClass} onClick={() => setOpen(false)}>
                    {t('nav.boardUse', '게시판 사용정보')}
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/password" className={linkClass} onClick={() => setOpen(false)}>
                    {t('nav.changePw', '비밀번호 변경')}
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  const { t } = useI18n()
  return (
    <footer className="egov-footer border-top mt-5 py-4">
      <div className="container-fluid px-4">
        <p className="mb-1 fw-bold">{t('footer.title', '전자정부표준프레임워크')}</p>
        <p className="mb-0 small text-muted">
          {t('footer.copyright', '© 전자정부표준프레임워크. All rights reserved.')}
        </p>
      </div>
    </footer>
  )
}

/** 스크롤이 일정 이상 내려가면 나타나는 '맨 위로' 버튼 */
function ScrollTopButton() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      className={`scroll-top-btn${visible ? ' show' : ''}`}
      aria-label={t('com.scrollTop', '맨 위로')}
      title={t('com.scrollTop', '맨 위로')}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <i className="bi bi-arrow-up" aria-hidden="true" />
    </button>
  )
}

export { NOTICE_BBS_ID, GALLERY_BBS_ID }
