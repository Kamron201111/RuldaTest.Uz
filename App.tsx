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
    { section: "Kontent", items: [
      { path: '/admin/questions/new', icon: 'plus', label: "Savol qo'shish" },
      { path: '/admin/questions',     icon: 'list',  label: "Savollar ro'yxati" },
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

  const getIcon = (icon: string) => {
    const icons: Record<string, React.ReactNode> = {
      dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
      plus:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
      list:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
      ticket:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9a3 3 0 010 6v2a2 2 0 002 2h16a2 2 0 002-2v-2a3 3 0 010-6V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2z"/></svg>,
      book:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
      video: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
      msg:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
      logout:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    };
    return icons[icon] || null;
  };

  const SidebarInner = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-sky-100 dark:shadow-blue-900/40">R</div>
          <div>
            <p className="font-black text-slate-800 dark:text-white text-sm leading-tight">RuldaTest</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.section}>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-3 mb-1.5">{group.section}</p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.path, item.exact);
                return (
                  <button key={item.path} onClick={() => { navigate(item.path); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all \${active ? 'bg-sky-500 text-white shadow-md' : 'text-slate-900 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800'}`}>
                    {getIcon(item.icon)}
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Chiqish */}
      <div className="px-3 pb-5 border-t border-slate-200 dark:border-slate-800 pt-3">
        <button onClick={() => { if (window.confirm('Chiqishni tasdiqlaysizmi?')) logout(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
          {getIcon('logout')} Chiqish
        </button>
      </div>
    </div>
  );

  const pageName = () => {
    for (const g of NAV_GROUPS) for (const i of g.items) if (isActive(i.path, i.exact)) return i.label;
    return 'Admin Panel';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-slate-50 dark:bg-slate-900 border-r-2 border-slate-200 dark:border-slate-800 sticky top-0 h-screen">
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-slate-50 dark:bg-slate-900 h-full shadow-2xl">
            <SidebarInner />
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-2 text-sm flex-1">
            <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">Admin</span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
            <span className="font-bold text-slate-800 dark:text-white">{pageName()}</span>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all"
              >
                <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">{pendingCount}</span>
                yangi so'rov
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              title="Yangilash"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
            </button>
          </div>
        </header>
        <main className="flex-1"><Outlet /></main>
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
