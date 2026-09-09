import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AdminShell } from './layouts/AdminShell'
import { AppShell } from './layouts/AppShell'
import { RequireAdmin, RequireAuth } from './layouts/Guards'
import { AdminDashboardPage } from './pages/AdminDashboard'
import { AdminSubmissionDetailPage } from './pages/AdminSubmissionDetail'
import { AdminSubmissionsPage } from './pages/AdminSubmissions'
import { AdminUsersPage } from './pages/AdminUsers'
import { ChallengePage } from './pages/Challenge'
import { DesignPage } from './pages/Design'
import { DesignDetailPage } from './pages/DesignDetail'
import { DesignsPage } from './pages/Designs'
import { ForbiddenPage } from './pages/Forbidden'
import { LandingPage } from './pages/Landing'
import { LeaderboardPage } from './pages/Leaderboard'
import { LoginPage } from './pages/Login'
import { MinecraftPage } from './pages/Minecraft'
import { ReferencePage } from './pages/Reference'
import { RegisterPage } from './pages/Register'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/reference" element={<ReferencePage />} />
            <Route path="/minecraft" element={<MinecraftPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/challenge" element={<ChallengePage />} />
              <Route path="/design" element={<DesignPage />} />
              <Route path="/challenge/design" element={<DesignPage />} />
              <Route path="/designs" element={<DesignsPage />} />
              <Route path="/designs/:id" element={<DesignDetailPage />} />
            </Route>
          </Route>
          <Route element={<RequireAdmin />}>
            <Route element={<AdminShell />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/submissions" element={<AdminSubmissionsPage />} />
              <Route path="/admin/submissions/:id" element={<AdminSubmissionDetailPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
