import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  BookMarked,
  GraduationCap,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Smartphone,
  Maximize2,
  Wifi,
  Battery,
  Signal,
  Sparkles,
  Settings,
} from 'lucide-react';
import { SchoolStoreProvider, useSchoolStore } from './data/useSchoolStore';
import { DashboardView } from './dashboard/DashboardView';
import { WeeklyTimetable } from './orario/WeeklyTimetable';
import { TasksView } from './compiti/TasksView';
import { NotebookView } from './notebook/NotebookView';
import { SettingsView } from './impostazioni/SettingsView';
import { ConfirmModal } from './shared/ConfirmModal';

type ActiveTab = 'dashboard' | 'orario' | 'compiti' | 'notebook' | 'impostazioni';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [deviceView, setDeviceView] = useState<'fullscreen' | 'iphone'>('fullscreen');
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);

  const { lastError, clearError, resetAllData, clearAllData, user, compiti, eventi, notebooks } = useSchoolStore();

  const pendingTasksCount = compiti.filter(c => !c.fatto).length;
  const urgentEventsCount = eventi.filter(e => {
    const todayStr = '2026-09-20';
    const limitStr = '2026-09-22';
    return e.data >= todayStr && e.data <= limitStr;
  }).length;

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: urgentEventsCount > 0 ? urgentEventsCount : undefined,
    },
    {
      id: 'orario' as ActiveTab,
      label: 'Orario',
      icon: CalendarDays,
    },
    {
      id: 'compiti' as ActiveTab,
      label: 'Compiti',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
    },
    {
      id: 'notebook' as ActiveTab,
      label: 'NotebookLM',
      icon: BookMarked,
      badge: notebooks.length > 0 ? notebooks.length : undefined,
    },
    {
      id: 'impostazioni' as ActiveTab,
      label: 'Impostazioni',
      icon: Settings,
    },
  ];

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Scuola';
      case 'orario':
        return 'Orario Lezioni';
      case 'compiti':
        return 'Compiti & Verifiche';
      case 'notebook':
        return 'Quaderni NotebookLM';
      case 'impostazioni':
        return 'Impostazioni & Backup';
    }
  };

  const renderCurrentSection = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigateToTasks={() => setActiveTab('compiti')}
            onNavigateToTimetable={() => setActiveTab('orario')}
            onNavigateToNotebooks={() => setActiveTab('notebook')}
          />
        );
      case 'orario':
        return <WeeklyTimetable />;
      case 'compiti':
        return <TasksView />;
      case 'notebook':
        return <NotebookView />;
      case 'impostazioni':
        return <SettingsView onNavigateToDashboard={() => setActiveTab('dashboard')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F3] text-stone-900 flex flex-col font-sans selection:bg-[#B5541D]/20 selection:text-[#B5541D]">
      {/* Top Application Header (Visible on Desktop / Fullscreen) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & School/Class Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#B5541D] text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-stone-900 font-heading leading-tight tracking-tight">
                  Organizza Scuola
                </h1>
                <p className="text-[11px] text-stone-500 font-medium">
                  {user.scuola || 'Liceo Scientifico'} • {user.classe || '4ª S'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs for ALL 5 SECTIONS */}
            <nav className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200" aria-label="Sezioni principali">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#B5541D] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#B5541D]' : 'text-stone-500'}`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                        isActive
                          ? 'bg-[#B5541D] text-white'
                          : 'bg-stone-200 text-stone-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Utilities (Device View Switcher, Clear Demo & Reset) */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center p-0.5 bg-stone-100 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setDeviceView('fullscreen')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    deviceView === 'fullscreen'
                      ? 'bg-white text-[#B5541D] shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="Vista a schermo intero"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView('iphone')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    deviceView === 'iphone'
                      ? 'bg-white text-[#B5541D] shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="Simula cornice iPhone"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">iPhone</span>
                </button>
              </div>

              {/* Clear Demo Button */}
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(true)}
                title="Elimina tutti i dati demo per iniziare con l'app completamente vuota"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Svuota App</span>
                <span className="sm:hidden">Svuota</span>
              </button>

              {/* Reset Demo Button */}
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                title="Ripristina dati demo di esempio"
                className="p-2 text-stone-400 hover:text-[#B5541D] hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                aria-label="Ripristina dati demo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Settings Shortcut Button */}
              <button
                type="button"
                onClick={() => setActiveTab('impostazioni')}
                title="Impostazioni & Backup"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  activeTab === 'impostazioni'
                    ? 'bg-[#B5541D] text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`}
                aria-label="Impostazioni e Backup"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Section Tabs Bar (Below Header on phones) */}
        <div className="md:hidden border-t border-stone-200 bg-[#FDFBF9] overflow-x-auto px-3 py-2 flex items-center gap-1.5 scrollbar-none">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#B5541D] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1 text-[10px] rounded-full ${
                    isActive ? 'bg-white/30 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Error Notice Banner */}
      {lastError && (
        <div className="bg-[#FDE8E9] border-b border-[#C1272D]/20 text-[#C1272D] px-4 py-2.5 text-xs flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{lastError}</span>
            </div>
            <button
              onClick={clearError}
              className="font-bold underline cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* Main Screen Content Area */}
      {deviceView === 'fullscreen' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-12">
          {renderCurrentSection()}
        </main>
      ) : (
        /* iPhone Frame Simulator View */
        <div className="flex-1 flex justify-center items-center py-6 px-4 bg-[#E8E4DF]">
          <div className="w-full max-w-[420px] h-[860px] bg-[#F7F5F3] rounded-[50px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] ring-[14px] ring-[#2C2926] border-[4px] border-[#1E1B18] flex flex-col overflow-hidden relative">
            {/* iOS Status Bar & Dynamic Island */}
            <div className="sticky top-0 z-50 bg-[#F7F5F3]/95 backdrop-blur-md pt-2 px-6 pb-2 border-b border-stone-200/50 select-none shrink-0">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-900">
                <span className="font-semibold tracking-tight text-[13px] pl-1">09:41</span>

                {/* Dynamic Island */}
                <div
                  onClick={() => setIsIslandExpanded(!isIslandExpanded)}
                  className={`bg-black text-white px-3 py-1 rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-md ${
                    isIslandExpanded ? 'w-56 h-9 px-4' : 'w-26 h-6'
                  }`}
                  title="Tocca per espandere"
                >
                  {isIslandExpanded ? (
                    <div className="flex items-center justify-between w-full text-[11px]">
                      <span className="flex items-center gap-1.5 text-[#B5541D]">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span className="font-bold text-white">{user.classe || '4ª S'}</span>
                      </span>
                      <span className="text-stone-400">
                        {pendingTasksCount} compiti
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full bg-stone-900 ring-1 ring-stone-800" />
                      <div className="w-2 h-2 rounded-full bg-stone-950" />
                      {urgentEventsCount > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C1272D] animate-pulse" />
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pr-1 text-stone-800">
                  <Signal className="w-3.5 h-3.5" />
                  <Wifi className="w-3.5 h-3.5" />
                  <Battery className="w-4 h-4 fill-stone-800 text-stone-800" />
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1 pb-1">
                <div>
                  <h2 className="text-lg font-bold font-heading text-stone-900 tracking-tight leading-none">
                    {getTabTitle()}
                  </h2>
                  <p className="text-[10px] text-stone-500 font-medium mt-0.5">
                    {user.scuola || 'La mia Scuola'} {user.classe ? `• ${user.classe}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('impostazioni')}
                    title="Impostazioni & Backup"
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'impostazioni'
                        ? 'bg-[#B5541D] text-white'
                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsClearConfirmOpen(true)}
                    title="Elimina demo (svuota app)"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Svuota</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(true)}
                    title="Ripristina dati demo"
                    className="p-1 text-stone-400 hover:text-[#B5541D] hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Inner Scrollable View */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
              {renderCurrentSection()}
            </div>

            {/* Docked iOS Tab Bar */}
            <nav
              className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-stone-200/80 pt-2 pb-1 px-3 z-40 flex flex-col justify-end"
              aria-label="Barra di navigazione iOS"
            >
              <div className="flex items-center justify-between w-full">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`flex flex-col items-center justify-center py-1 px-2 relative transition-all cursor-pointer ${
                        isActive ? 'text-[#B5541D]' : 'text-stone-400 hover:text-stone-600'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="relative">
                        <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] bg-[#C1272D] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-xs ring-2 ring-white">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] font-semibold mt-1 tracking-tight ${isActive ? 'text-[#B5541D]' : 'text-stone-500'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="w-28 h-1 bg-stone-800/40 rounded-full mx-auto mt-2 mb-1 pointer-events-none" />
            </nav>
          </div>
        </div>
      )}

      {/* iOS Floating Bottom Tab Bar on mobile screens in fullscreen mode */}
      {deviceView === 'fullscreen' && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-stone-200/90 pt-2 pb-2 px-3 z-40 shadow-lg"
          aria-label="Navigazione mobile iOS"
        >
          <div className="flex items-center justify-around w-full max-w-md mx-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center py-1 px-2 relative transition-all cursor-pointer ${
                    isActive ? 'text-[#B5541D]' : 'text-stone-400 hover:text-stone-600'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] bg-[#C1272D] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-xs ring-2 ring-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] font-semibold mt-1 tracking-tight ${isActive ? 'text-[#B5541D]' : 'text-stone-500'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Clear Demo Confirmation Modal (Completely empty app) */}
      <ConfirmModal
        isOpen={isClearConfirmOpen}
        title="Elimina Dati Demo (Svuota App)"
        message="Sei sicuro di voler eliminare tutti i dati demo? Verranno azzerati l'orario settimanale, tutte le verifiche, i compiti e i quaderni di esempio. L'app rimarrà completamente vuota, pronta per inserire i tuoi dati reali."
        confirmLabel="Sì, elimina demo e svuota"
        cancelLabel="Annulla"
        isDestructive={true}
        onConfirm={() => {
          clearAllData();
          setIsClearConfirmOpen(false);
          setActiveTab('dashboard');
        }}
        onCancel={() => setIsClearConfirmOpen(false)}
      />

      {/* Reset Demo Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Ripristina Dati Demo di Esempio"
        message="Vuoi ripristinare i dati demo di esempio per visualizzare come funziona l'app completa? I dati attuali verranno sostituiti con i dati di esempio."
        confirmLabel="Sì, ripristina demo"
        cancelLabel="Annulla"
        isDestructive={false}
        onConfirm={() => {
          resetAllData();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <SchoolStoreProvider>
      <MainLayout />
    </SchoolStoreProvider>
  );
}

