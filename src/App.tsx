/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkshopProvider, useWorkshop } from './context/WorkshopContext';
import { SplashScreen } from './components/SplashScreen';
import { Logo } from './components/Logo';
import { DashboardView } from './components/DashboardView';
import { AppointmentsView } from './components/AppointmentsView';
import { InventoryView } from './components/InventoryView';
import { BudgetsView } from './components/BudgetsView';
import { WorkOrdersView } from './components/WorkOrdersView';
import { ClientsHistoryView } from './components/ClientsHistoryView';
import { MechanicsManagementView } from './components/MechanicsManagementView';
import { LoginModal } from './components/LoginModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { EditProfileModal } from './components/EditProfileModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { ClientTrackingPortal } from './components/ClientTrackingPortal';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  LayoutDashboard,
  Calendar,
  Wrench,
  FileText,
  Package,
  History,
  Cloud,
  MessageSquare,
  Plus,
  Settings,
  Menu,
  X,
  Car,
  Sparkles,
  Shield,
  Crown,
  User,
  LogOut,
  ChevronDown,
  KeyRound,
  ShieldCheck,
  Bell,
  UserCog,
} from 'lucide-react';
import { WORKSHOP_CONFIG } from './data/initialData';
import { Appointment, Client, Vehicle } from './types';

function parseTrackingUrl(): { type: 'ot' | 'cita'; id: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const hashParams = new URLSearchParams(hash);

    // 1. Path-based tracking (/seguimiento/ot-xxx, /track/ot-xxx, /tracking/ot-xxx)
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const first = segments[0].toLowerCase();
      if (first === 'seguimiento' || first === 'track' || first === 'tracking') {
        if (segments.length >= 2) {
          const second = segments[1].toLowerCase();
          if (second === 'ot' || second === 'cita') {
            if (segments[2]) return { type: second, id: decodeURIComponent(segments[2]) };
          }
          return { type: 'ot', id: decodeURIComponent(segments[1]) };
        }
      }
    }

    // 2. Query param based tracking (?track=ot&id=xxx)
    const track = searchParams.get('track') || hashParams.get('track');
    const id = searchParams.get('id') || hashParams.get('id');

    if (track === 'ot' && id) return { type: 'ot', id: id.trim() };
    if (track === 'cita' && id) return { type: 'cita', id: id.trim() };

    const tracking = searchParams.get('tracking') || hashParams.get('tracking');
    if (tracking) {
      const cleanTracking = tracking.trim();
      if (cleanTracking.startsWith('app-') || cleanTracking.startsWith('cita-')) {
        return { type: 'cita', id: cleanTracking };
      }
      return { type: 'ot', id: cleanTracking };
    }

    const otParam = searchParams.get('ot') || hashParams.get('ot');
    if (otParam) return { type: 'ot', id: otParam.trim() };

    const citaParam = searchParams.get('cita') || hashParams.get('cita');
    if (citaParam) return { type: 'cita', id: citaParam.trim() };
  } catch {
    // Ignore URL parse error
  }
  return null;
}

function WorkshopApp() {
  const {
    syncStatus,
    lastSyncedAt,
    lowStockParts,
    currentUser,
    logout,
    hasPermission,
    unreadNotificationsCount,
    connectedClients,
    isRealtimeConnected,
    activeAlertToast,
    dismissAlertToast,
  } = useWorkshop();

  // Navigation
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'appointments' | 'work_orders' | 'budgets' | 'inventory' | 'clients' | 'mechanics'
  >('dashboard');

  // WhatsApp Dialog State
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [waClientName, setWaClientName] = useState('');
  const [waTemplate, setWaTemplate] = useState<any>('ot_listo');
  const [waData, setWaData] = useState<any>({});

  // Modals & Auth State
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  const isBoss = currentUser?.role === 'boss';
  const canManageStaff = hasPermission('canManageMechanics');

  // Cross-view creation shortcuts
  const [isCreateAppOpen, setIsCreateAppOpen] = useState(false);
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [isCreateOTOpen, setIsCreateOTOpen] = useState(false);
  const [prefilledAppointmentForOT, setPrefilledAppointmentForOT] = useState<Appointment | null>(null);

  // Mobile menu drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openWhatsApp = (phone: string, clientName: string, template: any, data: any) => {
    setWaPhone(phone);
    setWaClientName(clientName);
    setWaTemplate(template);
    setWaData(data);
    setIsWhatsAppOpen(true);
  };

  const handleConvertAppointmentToOT = (app: Appointment) => {
    setPrefilledAppointmentForOT(app);
    setActiveTab('work_orders');
    setIsCreateOTOpen(true);
  };

  const handleNewWorkOrderForVehicle = (client: Client, vehicle: Vehicle) => {
    setPrefilledAppointmentForOT({
      id: '',
      clientName: client.name,
      clientPhone: client.phone,
      clientEmail: client.email,
      vehiclePlate: vehicle.plate,
      vehicleModel: `${vehicle.brand} ${vehicle.model}`,
      vehicleYear: vehicle.year,
      serviceRequested: 'Servicio programado',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:00',
      assignedTechnician: WORKSHOP_CONFIG.technicians[0],
      status: 'confirmada',
      createdAt: '',
    });
    setActiveTab('work_orders');
    setIsCreateOTOpen(true);
  };

  // Portal de seguimiento en tiempo real para clientes (NO requiere login, 100% de solo lectura)
  const [trackingTarget, setTrackingTarget] = useState<{ type: 'ot' | 'cita'; id: string } | null>(
    () => parseTrackingUrl()
  );

  if (trackingTarget) {
    return (
      <ClientTrackingPortal
        type={trackingTarget.type}
        id={trackingTarget.id}
      />
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <LoginModal
          isOpen={true}
          isMandatory={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased selection:bg-red-600/30 selection:text-white pb-20 md:pb-6">
      {/* Replay Splash screen trigger */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Top Bar following Top Bar Contract: 3 Zones */}
      <header className="no-print sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Official Workshop Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer text-left"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 aspect-square rounded-xl bg-black border border-neutral-800 p-0.5 flex items-center justify-center shrink-0 group-hover:border-red-500/60 transition-colors shadow-sm overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Taller Automotriz Rodríguez Rodríguez"
                  className="w-full h-full aspect-square object-contain select-none"
                  style={{ objectFit: 'contain', aspectRatio: '1 / 1' }}
                  loading="eager"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-black tracking-tight text-white uppercase font-sans leading-tight">
                  Taller Automotriz
                </span>
                <span className="text-[10px] sm:text-xs font-extrabold text-red-500 tracking-wider uppercase font-mono leading-tight">
                  Rodríguez Rodríguez
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold tracking-wide">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`transition-colors cursor-pointer py-1 ${
                activeTab === 'dashboard'
                  ? 'text-white border-b-2 border-red-500'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Panel
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`transition-colors cursor-pointer py-1 ${
                activeTab === 'appointments'
                  ? 'text-white border-b-2 border-red-500'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Citas
            </button>
            <button
              onClick={() => setActiveTab('work_orders')}
              className={`transition-colors cursor-pointer py-1 ${
                activeTab === 'work_orders'
                  ? 'text-white border-b-2 border-red-500'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Órdenes (OT)
            </button>
            <button
              onClick={() => setActiveTab('budgets')}
              className={`transition-colors cursor-pointer py-1 ${
                activeTab === 'budgets'
                  ? 'text-white border-b-2 border-red-500'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Presupuestos
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`transition-colors cursor-pointer py-1 relative ${
                activeTab === 'inventory'
                  ? 'text-white border-b-2 border-red-500'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Repuestos</span>
              {lowStockParts.length > 0 && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 ml-1 mb-1.5" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`transition-colors cursor-pointer py-1 ${
                activeTab === 'clients'
                  ? 'text-white border-b-2 border-red-500'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Clientes & Historial
            </button>
            {canManageStaff && (
              <button
                onClick={() => setActiveTab('mechanics')}
                className={`transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
                  activeTab === 'mechanics'
                    ? 'text-white border-b-2 border-red-500'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-red-500" />
                <span>Mecánicos & Permisos</span>
              </button>
            )}
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2">
            {/* PWA Install Button for Android / Desktop */}
            <PWAInstallButton variant="header" />

            {/* Cloud Sync Status Indicator button */}
            <button
              onClick={() => setIsCloudModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title={`Sincronización en tiempo real: ${connectedClients} dispositivo(s) conectado(s)`}
            >
              <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <Cloud className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline text-[11px] font-mono">
                {isRealtimeConnected ? `Nube en Vivo (${connectedClients})` : 'Nube'}
              </span>
            </button>

            {/* Real-time Notifications Bell */}
            <button
              onClick={() => setIsNotificationsDrawerOpen(true)}
              className="relative p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white cursor-pointer transition-colors"
              title="Campana de avisos y órdenes asignadas en tiempo real"
            >
              <Bell className="w-4 h-4 text-neutral-300" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold font-mono animate-bounce shadow-sm shadow-red-950">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Quick WhatsApp launcher */}
            <button
              onClick={() => {
                setWaPhone('');
                setWaClientName('');
                setWaTemplate('personalizado');
                setIsWhatsAppOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Enviar mensaje WhatsApp rápido"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-medium">WhatsApp</span>
            </button>

            {/* User Session Profile & Switcher Pill */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(prev => !prev)}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 flex items-center gap-2 cursor-pointer transition-colors text-left"
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] text-white shrink-0 ${
                      isBoss ? 'bg-red-600' : 'bg-blue-600'
                    }`}
                  >
                    {isBoss ? <Crown className="w-3.5 h-3.5 text-amber-300" /> : <Wrench className="w-3.5 h-3.5" />}
                  </div>

                  <div className="hidden sm:flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white leading-none truncate max-w-[110px]">
                        {currentUser.name.split(' ')[0]}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold uppercase ${
                          isBoss
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {isBoss ? 'Jefe' : 'Mecánico'}
                      </span>
                    </div>
                  </div>

                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {/* User Profile Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl p-3 text-xs space-y-2.5">
                      <div className="pb-2 border-b border-neutral-800">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{currentUser.name}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                              isBoss
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {isBoss ? 'Jefe de Taller' : 'Mecánico'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{currentUser.specialty}</p>
                        <div className="mt-1.5 p-1.5 bg-neutral-950 rounded-lg border border-neutral-850 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-neutral-400">Usuario: <strong className="text-white">@{currentUser.username}</strong></span>
                          <span className="text-neutral-400">{currentUser.role === 'boss' ? 'Administrador' : 'Técnico'}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsEditProfileOpen(true);
                          }}
                          className="w-full px-2.5 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2 cursor-pointer transition-colors text-left"
                        >
                          <UserCog className="w-3.5 h-3.5 text-blue-400" />
                          <span>Modificar mi Usuario & PIN</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsLoginModalOpen(true);
                          }}
                          className="w-full px-2.5 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2 cursor-pointer transition-colors text-left"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          <span>Cambiar de Cuenta</span>
                        </button>

                        {canManageStaff && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setActiveTab('mechanics');
                            }}
                            className="w-full px-2.5 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2 cursor-pointer transition-colors text-left"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                            <span>Administrar Mecánicos & Permisos</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full px-2.5 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/30 flex items-center gap-2 cursor-pointer transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>

                      {/* Security & Creator Badge */}
                      <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-400 font-mono space-y-1">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Cierre tras 20 min inactividad o recargar</span>
                        </div>
                        <div className="flex items-center justify-between text-neutral-400">
                          <span>Por VlaSwink51</span>
                          <span>El Salvador, Usulután</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </button>
            )}

            {/* Mobile menu trigger button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-neutral-900 border-b border-neutral-800 px-4 py-3 space-y-1 text-xs">
            {[
              { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
              { id: 'appointments', label: 'Citas & Agenda', icon: Calendar },
              { id: 'work_orders', label: 'Órdenes de Trabajo (OT)', icon: Wrench },
              { id: 'budgets', label: 'Presupuestos Automáticos', icon: FileText },
              { id: 'inventory', label: 'Inventario de Repuestos', icon: Package },
              { id: 'clients', label: 'Clientes & Historial', icon: History },
              ...(canManageStaff ? [{ id: 'mechanics', label: 'Mecánicos & Permisos', icon: Shield }] : []),
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left font-medium transition-colors cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Mobile Switch User shortcut */}
            <div className="pt-2 mt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-400">
                Sesión: <strong className="text-white">{currentUser?.name || 'Invitado'}</strong>
              </span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="text-amber-400 hover:underline cursor-pointer"
              >
                Cambiar Usuario
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab: any) => setActiveTab(tab)}
            onOpenWhatsApp={openWhatsApp}
            onNewAppointment={() => {
              setActiveTab('appointments');
              setIsCreateAppOpen(true);
            }}
            onNewBudget={() => {
              setActiveTab('budgets');
              setIsCreateBudgetOpen(true);
            }}
            onNewWorkOrder={() => {
              setActiveTab('work_orders');
              setIsCreateOTOpen(true);
            }}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsView
            onOpenWhatsApp={openWhatsApp}
            onConvertToWorkOrder={handleConvertAppointmentToOT}
            isCreateModalOpen={isCreateAppOpen}
            onCloseCreateModal={() => setIsCreateAppOpen(false)}
          />
        )}

        {activeTab === 'work_orders' && (
          <WorkOrdersView
            onOpenWhatsApp={openWhatsApp}
            isCreateModalOpen={isCreateOTOpen}
            onCloseCreateModal={() => {
              setIsCreateOTOpen(false);
              setPrefilledAppointmentForOT(null);
            }}
            prefilledAppointment={prefilledAppointmentForOT}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsView
            onOpenWhatsApp={openWhatsApp}
            onNavigateToOT={() => setActiveTab('work_orders')}
            isCreateModalOpen={isCreateBudgetOpen}
            onCloseCreateModal={() => setIsCreateBudgetOpen(false)}
          />
        )}

        {activeTab === 'inventory' && <InventoryView />}

        {activeTab === 'clients' && (
          <ClientsHistoryView
            onOpenWhatsApp={openWhatsApp}
            onNewWorkOrderForVehicle={handleNewWorkOrderForVehicle}
          />
        )}

        {activeTab === 'mechanics' && canManageStaff && (
          <MechanicsManagementView
            onNavigateToOTs={() => setActiveTab('work_orders')}
          />
        )}
      </main>

      {/* System Footer with Author Credit and Workshop Location */}
      <footer className="no-print mt-auto border-t border-neutral-800/80 bg-neutral-950/80 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Taller Rodríguez Rodríguez · <strong className="text-neutral-300">El Salvador, Usulután</strong></span>
          </div>
          <div className="text-neutral-400 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-red-500" />
            <span>App creada por <strong className="text-white font-bold">VlaSwink51</strong></span>
          </div>
        </div>
      </footer>

      {/* Fixed Bottom Tab Bar for Mobile Thumb Ergonomics (Pattern 1 from Mobile Guide) */}
      <div className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 grid grid-cols-5 items-center h-16 px-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            activeTab === 'dashboard' ? 'text-red-500' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Panel</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            activeTab === 'appointments' ? 'text-red-500' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Citas</span>
        </button>

        <button
          onClick={() => setActiveTab('work_orders')}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            activeTab === 'work_orders' ? 'text-red-500' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Órdenes</span>
        </button>

        <button
          onClick={() => setActiveTab('budgets')}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            activeTab === 'budgets' ? 'text-red-500' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Cotizar</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center justify-center h-full cursor-pointer relative ${
            activeTab === 'inventory' ? 'text-red-500' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Almacén</span>
          {lowStockParts.length > 0 && (
            <span className="absolute top-2.5 right-4 w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      {/* Real-Time Floating Notification Toast Banner */}
      {activeAlertToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full bg-neutral-900 border-2 border-red-500 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top duration-300 ring-4 ring-red-500/20 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-extrabold text-white text-sm">¡Nueva Orden Asignada!</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                    {activeAlertToast.otNumber}
                  </span>
                </div>
                <p className="text-neutral-200 font-semibold mt-1">
                  🚗 {activeAlertToast.vehicleModel} ({activeAlertToast.vehiclePlate})
                </p>
                <p className="text-neutral-400 text-[11px] line-clamp-1 mt-0.5">
                  <strong className="text-neutral-300">Trabajo:</strong> {activeAlertToast.reportedFault}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Asignada por: <strong className="text-neutral-400">{activeAlertToast.assignedBy}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={dismissAlertToast}
              className="p-1 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-neutral-800">
            <button
              onClick={dismissAlertToast}
              className="px-3 py-1.5 text-[11px] text-neutral-400 hover:text-white cursor-pointer"
            >
              Descartar
            </button>
            <button
              onClick={() => {
                dismissAlertToast();
                setActiveTab('work_orders');
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-[11px] shadow-sm shadow-red-950 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Ver en Órdenes (OT)</span>
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Modal Dispatcher */}
      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        defaultPhone={waPhone}
        defaultClientName={waClientName}
        defaultTemplate={waTemplate}
        templateData={waData}
      />

      {/* Cloud Sync & Backup Modal */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        onReplaySplash={() => setShowSplash(true)}
      />

      {/* User Login & Role Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen || !currentUser}
        onClose={() => setIsLoginModalOpen(false)}
        isMandatory={!currentUser}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsDrawerOpen}
        onClose={() => setIsNotificationsDrawerOpen(false)}
        onSelectOrder={() => setActiveTab('work_orders')}
      />

      {/* Edit My Profile & Credentials Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </div>
  );
}

export default function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  if (initialLoading) {
    return <SplashScreen onComplete={() => setInitialLoading(false)} />;
  }

  return (
    <WorkshopProvider>
      <WorkshopApp />
    </WorkshopProvider>
  );
}
