import React from 'react';
import { Package, ShieldCheck, User, Truck, Plus, LogOut, Lock } from 'lucide-react';
import { logisticsStore } from '../../services/logisticsStore';

interface NavbarProps {
  activeTab: 'track' | 'book' | 'dashboard' | 'admin' | 'rates' | 'admin_login';
  onSelectTab: (tab: 'track' | 'book' | 'dashboard' | 'admin' | 'rates' | 'admin_login') => void;
  isAdmin: boolean;
  onLogoutAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isAdmin,
  onLogoutAdmin,
}) => {
  const adminSession = logisticsStore.getAdminSession();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Zone */}
        <button
          onClick={() => onSelectTab('track')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-sm font-black text-sm">
            NX
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 leading-none font-mono">
              NEXUS<span className="text-blue-700 font-black">_LOGISTICS</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">
              Worldwide Express & Freight
            </div>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
          <button
            onClick={() => onSelectTab('track')}
            className={`transition-colors pb-1 ${
              activeTab === 'track'
                ? 'text-blue-700 border-b-2 border-blue-700 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Track Shipment
          </button>

          <button
            onClick={() => onSelectTab('book')}
            className={`transition-colors pb-1 ${
              activeTab === 'book'
                ? 'text-blue-700 border-b-2 border-blue-700 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Ship Online
          </button>

          <button
            onClick={() => onSelectTab('dashboard')}
            className={`transition-colors pb-1 ${
              activeTab === 'dashboard'
                ? 'text-blue-700 border-b-2 border-blue-700 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            My Consignments
          </button>

          <button
            onClick={() => onSelectTab('rates')}
            className={`transition-colors pb-1 ${
              activeTab === 'rates'
                ? 'text-blue-700 border-b-2 border-blue-700 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Rates & Transit Times
          </button>

          {/* Admin Command Center Link (Only shown as active console when authenticated) */}
          {isAdmin && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                activeTab === 'admin'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Operations Dispatch</span>
            </button>
          )}
        </nav>

        {/* Action Zone */}
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {adminSession?.role || 'Dispatcher'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {adminSession?.email}
                </span>
              </div>

              <button
                onClick={() => onSelectTab('admin')}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                Dispatch Console
              </button>

              <button
                onClick={onLogoutAdmin}
                title="Log out of Admin Portal"
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSelectTab('admin_login')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-slate-100"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Staff Portal</span>
              </button>

              <button
                onClick={() => onSelectTab('book')}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Shipment</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
