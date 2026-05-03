import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, BookOpen, Star, Settings } from "lucide-react";

const NAV_ITEMS = [
  { path: "/user",       icon: LayoutGrid, label: "Umumiy" },
  { path: "/yhq",        icon: BookOpen,   label: "YHQ" },
  { path: "/talim",      icon: null,       label: "Ta'lim",    center: true },
  { path: "/kurslar",    icon: Star,       label: "Kurslar" },
  { path: "/sozlamalar", icon: Settings,   label: "Sozlamalar" },
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-700/80 px-2 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50">
        <div className="max-w-lg mx-auto flex items-end justify-around h-16">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/user" && location.pathname.startsWith(item.path));

            if (item.center) {
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative -top-5 flex flex-col items-center group"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 transition-all shadow-xl ${
                    isActive
                      ? "bg-gradient-to-br from-sky-400 to-cyan-500 shadow-sky-200/50 scale-105"
                      : "bg-gradient-to-br from-sky-400 to-cyan-500 shadow-sky-100/60 hover:from-sky-400 hover:to-cyan-500"
                  } active:scale-95`}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="3"/>
                      <line x1="12" y1="2" x2="12" y2="9"/>
                      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>
                      <line x1="19.07" y1="4.93" x2="14.83" y2="9.17"/>
                    </svg>
                  </div>
                  <span className={`text-[10px] font-bold mt-0.5 transition-colors ${isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-500 dark:text-slate-400"}`}>
                    {item.label}
                  </span>
                </button>
              );
            }

            const Icon = item.icon!;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 py-2 px-3 transition-all active:scale-95"
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-sky-100 dark:bg-sky-900/40" : ""}`}>
                  <Icon
                    size={22}
                    className={`transition-colors ${isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"}`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
