import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { I18nProvider } from './i18n/I18nContext'
import { RequireAuth } from './auth/RequireAuth'
import { Layout, NOTICE_BBS_ID } from './components/Layout'
import { MainPage } from './pages/MainPage'
import { LoginPage } from './pages/LoginPage'
import { SnsCallbackPage } from './pages/SnsCallbackPage'
import { InfoPage } from './pages/InfoPage'
import { RegisterPage } from './pages/RegisterPage'
import { BoardListPage } from './pages/BoardListPage'
import { BoardDetailPage } from './pages/BoardDetailPage'
import { BoardFormPage } from './pages/BoardFormPage'
import { SchedulePage } from './pages/SchedulePage'
import { ScheduleFormPage } from './pages/ScheduleFormPage'
import { MyPage } from './pages/MyPage'
import { MemberListPage } from './pages/MemberListPage'
import { BoardMasterAdminPage, BoardUseAdminPage, AdminPasswordPage } from './pages/AdminPages'
import { NotFoundPage } from './pages/NotFoundPage'

/** 관리자 전용 라우트를 가드로 감싼다 (반복을 줄이기 위한 도우미) */
function admin(element: React.ReactNode) {
  return <RequireAuth adminOnly>{element}</RequireAuth>
}

export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<MainPage />} />
              {/* 사이트 소개 — 슬러그별 문구는 서버 메시지 번들에서 온다 */}
            <Route path="info">
              <Route index element={<Navigate to="/info/about" replace />} />
              <Route path=":slug" element={<InfoPage />} />
            </Route>
            <Route path="login" element={<LoginPage />} />
            {/* SNS 공급자가 되돌려보내는 주소. 백엔드 Sns.*.callbackUrl 과 같아야 한다. */}
            <Route path="login/:provider/callback" element={<SnsCallbackPage />} />
              <Route path="register" element={<RegisterPage />} />

              {/* 게시판 — 목록·상세는 비로그인도 볼 수 있고, 쓰기는 로그인이 필요하다
                  (백엔드 SecurityConfig 의 GET 화이트리스트와 같은 정책) */}
              <Route path="board">
                <Route index element={<Navigate to={`/board/${NOTICE_BBS_ID}`} replace />} />
                <Route path=":bbsId" element={<BoardListPage />} />
                <Route
                  path=":bbsId/write"
                  element={
                    <RequireAuth>
                      <BoardFormPage mode="create" />
                    </RequireAuth>
                  }
                />
                <Route path=":bbsId/:nttId" element={<BoardDetailPage />} />
                <Route
                  path=":bbsId/:nttId/edit"
                  element={
                    <RequireAuth>
                      <BoardFormPage mode="edit" />
                    </RequireAuth>
                  }
                />
                <Route
                  path=":bbsId/:nttId/reply"
                  element={
                    <RequireAuth>
                      <BoardFormPage mode="reply" />
                    </RequireAuth>
                  }
                />
              </Route>

              {/* 일정 */}
              <Route
                path="schedule"
                element={
                  <RequireAuth>
                    <SchedulePage />
                  </RequireAuth>
                }
              />
              <Route
                path="schedule/write"
                element={
                  <RequireAuth>
                    <ScheduleFormPage mode="create" />
                  </RequireAuth>
                }
              />
              <Route
                path="schedule/:schdulId/edit"
                element={
                  <RequireAuth>
                    <ScheduleFormPage mode="edit" />
                  </RequireAuth>
                }
              />

              <Route
                path="mypage"
                element={
                  <RequireAuth>
                    <MyPage />
                  </RequireAuth>
                }
              />

              {/* 관리자 */}
              <Route path="admin">
                <Route path="members" element={admin(<MemberListPage />)} />
                <Route path="board-master" element={admin(<BoardMasterAdminPage />)} />
                <Route path="board-use" element={admin(<BoardUseAdminPage />)} />
                <Route path="password" element={admin(<AdminPasswordPage />)} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  )
}
