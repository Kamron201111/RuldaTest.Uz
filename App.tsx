import React from "react";
import { HashRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { UIProvider } from "./context/UIContext";
import { Role } from "./types";
import BottomNav from "./components/BottomNav";
import LoadingOverlay from "./components/LoadingOverlay";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import UserDashboard from "./pages/user/UserDashboard";
import Quiz from "./pages/user/Quiz";
import Result from "./pages/user/Result";
import History from "./pages/user/History";
import Profile from "./pages/user/Profile";
import YHQ from "./pages/user/YHQ";
import TalimPage from "./pages/user/TalimPage";
import Kurslar from "./pages/user/Kurslar";
import Sozlamalar from "./pages/user/Sozlamalar";
import Chat from "./pages/Chat";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { QuestionList, QuestionForm } from "./pages/admin/QuestionManager";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminChat from "./pages/admin/AdminChat";
import AdminYHQ from "./pages/admin/AdminYHQ";
import AdminKurslar from "./pages/admin/AdminKurslar";
import Biletlar from "./pages/user/Biletlar";
import BiletQuiz from "./pages/user/BiletQuiz";
import AdminBiletlar from "./pages/admin/AdminBiletlar";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: Role[] }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    const fetchPending = async () => {
      try {
        const { supabase } = await import('./services/supabase');
        const { data } = await supabase.from('premium_requests').select('id').eq('status', 'pending');
        setPendingCount(data?.length || 0);
      } catch {}
    };
    fetchPending();
    const iv = setInterval(fetchPending, 30000);
    return () => clearInterval(iv);
  }, []);

  const NAV_GROUPS = [
    { section: 'Asosiy', items: [
      { path: '/admin', icon: 'dashboard', label: 'Dashboard', exact: true },
    ]},
    { section: 'Kontent', items: [
      { path: '/admin/questions/new', icon: 'plus',   label: "Savol qo'shish" },
      { path: '/admin/questions',     icon: 'list',   label: "Savollar ro'yxati" },
      { path: '/admin/biletlar',      icon: 'ticket', label: 'Biletlar' },
    ]},
    { section: "Ta'lim", items: [
      { path: '/admin/yhq',     icon: 'book',  label: 'YHQ Boblar' },
      { path: '/admin/kurslar', icon: 'video', label: 'Video Kurslar' },
    ]},
    { section: 'Foydalanuvchilar', items: [
      { path: '/admin/messages', icon: 'msg', label: 'Xabarlar' },
    ]},
  ];

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const Icon = ({ name }: { name: string }) => {
    const s = { width: 16, height: 16 };
    const p = { fill: "none", stroke: "currentColor", strokeWidth: 2 };
    if (name === 'dashboard') return <svg {...s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
    if (name === 'plus')      return <svg {...s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
    if (name === 'list')      return <svg {...s} viewBox="0 0 24 24" {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
    if (name === 'ticket')    return <svg {...s} viewBox="0 0 24 24" {...p}><path d="M2 9a3 3 0 010 6v2a2 2 0 002 2h16a2 2 0 002-2v-2a3 3 0 010-6V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2z"/></svg>;
    if (name === 'book')      return <svg {...s} viewBox="0 0 24 24" {...p}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>;
    if (name === 'video')     return <svg {...s} viewBox="0 0 24 24" {...p}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
    if (name === 'msg')       return <svg {...s} viewBox="0 0 24 24" {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
    if (name === 'logout')    return <svg {...s} viewBox="0 0 24 24" {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    if (name === 'menu')      return <svg {...s} viewBox="0 0 24 24" {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
    if (name === 'x')         return <svg {...s} viewBox="0 0 24 24" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    if (name === 'refresh')   return <svg {...s} viewBox="0 0 24 24" {...p}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>;
    return null;
  };

  // Sidebar — inline style bilan, hech qanday Tailwind dark muammo yo'q
  const SidebarInner = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#e0f2fe' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #bae6fd' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: '#0284c7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14 }}>R</div>
          <div>
            <p style={{ fontWeight: 900, color: '#0c4a6e', fontSize: 14, lineHeight: 1.2 }}>RuldaTest</p>
            <p style={{ fontSize: 10, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.section} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 12px', marginBottom: 6 }}>
              {group.section}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(item => {
                const active = isActive(item.path, item.exact);
                return (
                  <button key={item.path}
                    onClick={() => { navigate(item.path); setMobileOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, textAlign: 'left', transition: 'all 0.15s',
                      background: active ? '#0284c7' : 'transparent',
                      color: active ? '#ffffff' : '#0c4a6e',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#bae6fd'; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span style={{ color: active ? '#e0f2fe' : '#0369a1', flexShrink: 0 }}>
                      <Icon name={item.icon} />
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Chiqish */}
      <div style={{ padding: '12px', borderTop: '1px solid #bae6fd' }}>
        <button
          onClick={() => { if (window.confirm('Chiqishni tasdiqlaysizmi?')) logout(); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: '#dc2626', background: 'transparent', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fee2e2'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <Icon name="logout" /> Chiqish
        </button>
      </div>
    </div>
  );

  const pageName = () => {
    for (const g of NAV_GROUPS) for (const i of g.items) if (isActive(i.path, i.exact)) return i.label;
    return 'Admin Panel';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f9ff' }}>
      {/* Desktop sidebar */}
      <aside style={{ display: 'none', width: 240, flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}
        className="lg:flex flex-col">
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileOpen(false)} />
          <aside style={{ position: 'relative', width: 256, height: '100%', boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}>
            <SidebarInner />
            <button onClick={() => setMobileOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#bae6fd', color: '#0369a1' }}>
              <Icon name="x" />
            </button>
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{ position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#ffffff', borderBottom: '1px solid #bae6fd', boxShadow: '0 1px 4px rgba(14,165,233,0.08)' }}>
          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden"
            style={{ padding: 8, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#e0f2fe', color: '#0369a1' }}>
            <Icon name="menu" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, flex: 1 }}>
            <span style={{ color: '#94a3b8' }}>Admin</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ fontWeight: 700, color: '#0c4a6e' }}>{pageName()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {pendingCount > 0 && (
              <button onClick={() => navigate('/admin')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <span style={{ width: 20, height: 20, background: '#f59e0b', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>{pendingCount}</span>
                yangi so'rov
              </button>
            )}
            <button onClick={() => window.location.reload()}
              style={{ padding: 8, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#e0f2fe', color: '#0369a1' }}
              title="Yangilash">
              <Icon name="refresh" />
            </button>
          </div>
        </header>
        <main style={{ flex: 1 }}><Outlet /></main>
      </div>
    </div>
  );
};

const UserLayout = () => (
  <>
    <div className="pb-20">
      <Outlet />
    </div>
    <BottomNav />
  </>
);

const FullScreen = () => <Outlet />;

const App: React.FC = () => {
  return (
    <AuthProvider>
      <UIProvider>
        <LoadingOverlay />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* === USER ROUTES === */}
            <Route element={<ProtectedRoute allowedRoles={[Role.USER]} />}>
              <Route element={<UserLayout />}>
                <Route path="/user" element={<UserDashboard />} />
                <Route path="/yhq" element={<YHQ />} />
                <Route path="/talim" element={<TalimPage />} />
                <Route path="/kurslar" element={<Kurslar />} />
                <Route path="/sozlamalar" element={<Sozlamalar />} />
                <Route path="/history" element={<History />} />
                <Route path="/biletlar" element={<Biletlar />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/chat" element={<Chat />} />
              </Route>
              <Route element={<FullScreen />}>
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/result" element={<Result />} />
                <Route path="/bilet-quiz/:biletId" element={<BiletQuiz />} />
              </Route>
            </Route>

            {/* === ADMIN ROUTES === */}
            <Route element={<ProtectedRoute allowedRoles={[Role.ADMIN]} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/questions" element={<QuestionList />} />
                <Route path="/admin/questions/:id" element={<QuestionForm />} />
                <Route path="/admin/messages" element={<AdminMessages />} />
                <Route path="/admin/chat/:userId" element={<AdminChat />} />
                <Route path="/admin/yhq" element={<AdminYHQ />} />
                <Route path="/admin/kurslar" element={<AdminKurslar />} />
                <Route path="/admin/biletlar" element={<AdminBiletlar />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </UIProvider>
    </AuthProvider>
  );
};

export default App;
