import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  FolderCode,
  GitCompare,
  Eye,
  FileText,
  History,
  LineChart,
  CheckSquare,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  flaggedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  collapsed,
  onToggleCollapse,
  flaggedCount = 0
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-analysis', label: 'New Analysis', icon: UploadCloud },
    { id: 'submissions', label: 'Submissions', icon: FolderCode },
    { id: 'results', label: 'Comparison Results', icon: GitCompare, badge: flaggedCount > 0 ? flaggedCount : undefined },
    { id: 'evidence', label: 'Detailed Evidence', icon: Eye },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'history', label: 'Analysis History', icon: History },
    { id: 'performance', label: 'Model Performance', icon: LineChart },
    { id: 'decisions', label: 'Review Decisions', icon: CheckSquare },
    { id: 'settings', label: 'Settings & Method', icon: Sliders },
  ];

  return (
    <aside
      className={`border-r border-slate-200 bg-white flex flex-col justify-between transition-all duration-200 shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-3">
        {/* Collapse toggle */}
        <div className="flex items-center justify-between px-2 py-2 mb-2 text-xs text-slate-400 font-semibold tracking-wider uppercase">
          {!collapsed && <span>Navigation</span>}
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-900 transition-colors ml-auto"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap text-left ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {!collapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!collapsed && item.badge !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700 font-semibold'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer info box */}
      {!collapsed && (
        <div className="p-4 m-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Integrity Rule</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Similarity score is decision support evidence. Human review is mandatory.
          </p>
        </div>
      )}
    </aside>
  );
};
