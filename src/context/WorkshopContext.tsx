import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Appointment,
  Client,
  Part,
  Budget,
  WorkOrder,
  NotificationLog,
  WorkOrderStage,
  User,
  MechanicPermissions,
  MechanicAssignmentNotification,
  WorkshopContact,
  WorkshopLegalDocument,
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_PARTS,
  INITIAL_APPOINTMENTS,
  INITIAL_BUDGETS,
  INITIAL_WORK_ORDERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_USERS,
  INITIAL_MECHANIC_NOTIFICATIONS,
  WORKSHOP_CONFIG,
} from '../data/initialData';

interface WorkshopContextType {
  clients: Client[];
  parts: Part[];
  appointments: Appointment[];
  budgets: Budget[];
  workOrders: WorkOrder[];
  notifications: NotificationLog[];
  mechanicNotifications: MechanicAssignmentNotification[];
  unreadNotificationsCount: number;
  markNotificationsAsRead: (technicianName?: string) => void;
  syncStatus: 'synced' | 'syncing' | 'offline';
  lastSyncedAt: string;
  triggerCloudSync: () => void;
  isDbReady: boolean;
  // Real-Time & Multi-user status
  connectedClients: number;
  isRealtimeConnected: boolean;
  activeAlertToast: MechanicAssignmentNotification | null;
  dismissAlertToast: () => void;
  // Users / Mechanics & Auth
  users: User[];
  currentUser: User | null;
  logoutReason: string | null;
  clearLogoutReason: () => void;
  activeTechnicians: string[];
  login: (identifier: string, passOrPin: string) => { success: boolean; message?: string };
  loginAsDemo: (userId: string) => void;
  logout: (reason?: string) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  updateUserPermissions: (userId: string, permissions: Partial<MechanicPermissions>) => void;
  hasPermission: (permissionKey: keyof MechanicPermissions) => boolean;
  // Clients
  addClient: (client: Omit<Client, 'id' | 'totalSpent' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  // Parts
  addPart: (part: Omit<Part, 'id'>) => Part;
  updatePart: (id: string, updates: Partial<Part>) => void;
  deletePart: (id: string) => void;
  adjustPartStock: (id: string, delta: number) => void;
  // Appointments
  addAppointment: (app: Omit<Appointment, 'id' | 'createdAt'>) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  // Budgets
  createBudget: (budget: Omit<Budget, 'id' | 'quoteNumber' | 'createdAt' | 'subtotal' | 'taxAmount' | 'total'>) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  convertBudgetToWorkOrder: (budgetId: string) => WorkOrder | null;
  // Work Orders & Mechanic Assignment
  createWorkOrder: (order: Omit<WorkOrder, 'id' | 'otNumber' | 'createdAt' | 'subtotal' | 'taxAmount' | 'total'> & { laborTotal?: number }) => WorkOrder;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  updateWorkOrderStage: (id: string, stage: WorkOrderStage) => void;
  deleteWorkOrder: (id: string) => void;
  reassignWorkOrder: (otId: string, newTechnician: string) => void;
  // WhatsApp Notification
  sendWhatsAppNotification: (params: {
    phone: string;
    clientName: string;
    templateType: NotificationLog['templateType'];
    customMessage?: string;
    data?: Record<string, any>;
  }) => string;
  // Workshop Info, Contacts (Jefe de Taller) & Legal Documents
  workshopContact: WorkshopContact;
  updateWorkshopContact: (updates: Partial<WorkshopContact>) => void;
  addLegalDocument: (doc: Omit<WorkshopLegalDocument, 'id'>) => void;
  updateLegalDocument: (id: string, updates: Partial<WorkshopLegalDocument>) => void;
  deleteLegalDocument: (id: string) => void;
  // Backup & Restore
  exportBackupData: () => void;
  importBackupData: (jsonData: string) => boolean;
  resetToSampleData: () => void;
  resetToCleanData: () => void;
  // Low stock helper
  lowStockParts: Part[];
}

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

const STORAGE_KEY = 'taller_rodriguez_data_v4_prod';

export const WorkshopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_clients`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [parts, setParts] = useState<Part[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_parts`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_appointments`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_budgets`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_workOrders`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure VlaSwink51 master admin is always present without wiping user-created mechanics
          if (!parsed.some(u => u.username?.toLowerCase() === 'vlaswink51')) {
            const merged = [INITIAL_USERS[0], ...parsed];
            try {
              localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(merged));
            } catch {}
            return merged;
          }
          return parsed;
        }
      }
    } catch {}
    return INITIAL_USERS;
  });

  const [mechanicNotifications, setMechanicNotifications] = useState<MechanicAssignmentNotification[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_mechanicNotifications`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [workshopContact, setWorkshopContact] = useState<WorkshopContact>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_workshop_contact`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      name: WORKSHOP_CONFIG.name,
      legalName: WORKSHOP_CONFIG.legalName,
      tagline: WORKSHOP_CONFIG.tagline,
      bossName: WORKSHOP_CONFIG.bossName,
      phone: WORKSHOP_CONFIG.phone,
      email: WORKSHOP_CONFIG.email,
      whatsappNumber: WORKSHOP_CONFIG.whatsappNumber,
      address: WORKSHOP_CONFIG.address,
      city: WORKSHOP_CONFIG.city,
      country: WORKSHOP_CONFIG.country,
      taxId: WORKSHOP_CONFIG.taxId,
      taxNRC: WORKSHOP_CONFIG.taxNRC,
      businessActivity: WORKSHOP_CONFIG.businessActivity,
      commercialRegistry: WORKSHOP_CONFIG.commercialRegistry,
      municipalLicense: WORKSHOP_CONFIG.municipalLicense,
      insurancePolicy: WORKSHOP_CONFIG.insurancePolicy,
      warrantyTerms: WORKSHOP_CONFIG.warrantyTerms,
      legalDocuments: WORKSHOP_CONFIG.legalDocuments || [],
    };
  });

  const [isDbReady, setIsDbReady] = useState<boolean>(false);

  // Seguridad de sesión:
  // Al recargar la página o cerrar la pestaña, NO se guarda la sesión en localStorage.
  // El usuario siempre deberá iniciar sesión nuevamente.
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logoutReason, setLogoutReason] = useState<string | null>(null);

  // Sincronización en caliente inmediata de permisos y estado del usuario activo
  useEffect(() => {
    if (currentUser) {
      const fresh = users.find(u => u.id === currentUser.id);
      if (fresh) {
        const permsChanged = JSON.stringify(fresh.permissions) !== JSON.stringify(currentUser.permissions);
        const roleChanged = fresh.role !== currentUser.role;
        const activeChanged = fresh.isActive !== currentUser.isActive;
        const nameChanged = fresh.name !== currentUser.name;

        if (permsChanged || roleChanged || activeChanged || nameChanged) {
          if (!fresh.isActive) {
            setCurrentUser(null);
            setLogoutReason('Esta cuenta ha sido desactivada por el Jefe de Taller.');
          } else {
            setCurrentUser(fresh);
          }
        }
      }
    }
  }, [users, currentUser]);

  // Limpieza inicial de cualquier sesión previa en localStorage/sessionStorage
  useEffect(() => {
    try {
      localStorage.removeItem(`${STORAGE_KEY}_currentUser`);
      sessionStorage.removeItem(`${STORAGE_KEY}_currentUser`);
    } catch {
      // Ignore
    }
  }, []);

  // Al cerrar la pestaña o recargar, asegurar que se limpie cualquier rastro
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.removeItem(`${STORAGE_KEY}_currentUser`);
        sessionStorage.removeItem(`${STORAGE_KEY}_currentUser`);
      } catch {
        // Ignore
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Temporizador de inactividad de 20 minutos (20 * 60 * 1000 ms = 1,200,000 ms)
  const lastActivityRef = useRef<number>(Date.now());
  useEffect(() => {
    if (!currentUser) return;

    lastActivityRef.current = Date.now();

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ];

    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutos de inactividad
    const timerInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        setCurrentUser(null);
        setLogoutReason('inactivity');
      }
    }, 5000);

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(timerInterval);
    };
  }, [currentUser]);

  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [connectedClients, setConnectedClients] = useState<number>(1);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  const [activeAlertToast, setActiveAlertToast] = useState<MechanicAssignmentNotification | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const syncTimerRef = useRef<any>(null);
  // Control de sincronización autoritativa para proteger la base de datos de sobreescrituras en frío
  const isInitializedFromServerRef = useRef<boolean>(false);
  const hasUserMutatedRef = useRef<boolean>(false);

  // Marcar explícitamente mutación de usuario
  const registerUserMutation = () => {
    hasUserMutatedRef.current = true;
  };

  // Auto-persist to localStorage AND authoritative server database (workshop_database.json)
  useEffect(() => {
    // Si aún no se ha cargado la base de datos autoritativa del servidor, no sincronizar hacia el servidor
    if (!isInitializedFromServerRef.current) {
      return;
    }

    try {
      localStorage.setItem(`${STORAGE_KEY}_clients`, JSON.stringify(clients));
      localStorage.setItem(`${STORAGE_KEY}_parts`, JSON.stringify(parts));
      localStorage.setItem(`${STORAGE_KEY}_appointments`, JSON.stringify(appointments));
      localStorage.setItem(`${STORAGE_KEY}_budgets`, JSON.stringify(budgets));
      localStorage.setItem(`${STORAGE_KEY}_workOrders`, JSON.stringify(workOrders));
      localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
      localStorage.setItem(`${STORAGE_KEY}_mechanicNotifications`, JSON.stringify(mechanicNotifications));
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
      localStorage.setItem(`${STORAGE_KEY}_workshop_contact`, JSON.stringify(workshopContact));
      // NUNCA persistir la sesión del usuario para garantizar login al recargar o cerrar pestaña
      localStorage.removeItem(`${STORAGE_KEY}_currentUser`);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }

    // Guardado persistente automático e inmediato en la base de datos del servidor (/api/sync)
    // SÓLO cuando el usuario haya realizado una modificación real para evitar sobrescribir con valores por defecto
    if (hasUserMutatedRef.current) {
      hasUserMutatedRef.current = false;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clients,
            parts,
            appointments,
            budgets,
            workOrders,
            notifications,
            mechanicNotifications,
            users,
            workshopContact,
          }),
        }).catch(err => {
          console.warn('Auto-save to database failed:', err);
        });
      }, 250);
    }

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [clients, parts, appointments, budgets, workOrders, notifications, mechanicNotifications, users, workshopContact]);

  // Periodic heartbeat sync indicator
  const triggerCloudSync = () => {
    registerUserMutation();
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 600);
  };

  // Helper to send real-time events to both WebSocket server and BroadcastChannel
  const sendRealtimeEvent = (type: string, payload: any) => {
    registerUserMutation();
    const message = JSON.stringify({ type, payload });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    }
    try {
      channelRef.current?.postMessage({ type, payload });
    } catch {
      // Ignore BroadcastChannel errors
    }
  };

  const handleIncomingRealtimeMessage = (data: any) => {
    if (!data || !data.type) return;

    if (data.connectedClients) {
      setConnectedClients(data.connectedClients);
    }

    switch (data.type) {
      case 'INIT_STATE': {
        const p = data.payload;
        if (!p) break;

        // Retrieve local cache from localStorage to prevent cold restarts from wiping real data
        let localClients: Client[] = [];
        let localWorkOrders: WorkOrder[] = [];
        let localParts: Part[] = [];
        let localAppointments: Appointment[] = [];
        let localBudgets: Budget[] = [];
        let localUsers: User[] = [];
        let localNotifs: NotificationLog[] = [];
        let localMechNotifs: MechanicAssignmentNotification[] = [];

        try {
          const sc = localStorage.getItem(`${STORAGE_KEY}_clients`);
          if (sc) localClients = JSON.parse(sc);
          const swo = localStorage.getItem(`${STORAGE_KEY}_workOrders`);
          if (swo) localWorkOrders = JSON.parse(swo);
          const sp = localStorage.getItem(`${STORAGE_KEY}_parts`);
          if (sp) localParts = JSON.parse(sp);
          const sa = localStorage.getItem(`${STORAGE_KEY}_appointments`);
          if (sa) localAppointments = JSON.parse(sa);
          const sb = localStorage.getItem(`${STORAGE_KEY}_budgets`);
          if (sb) localBudgets = JSON.parse(sb);
          const su = localStorage.getItem(`${STORAGE_KEY}_users`);
          if (su) localUsers = JSON.parse(su);
          const sn = localStorage.getItem(`${STORAGE_KEY}_notifications`);
          if (sn) localNotifs = JSON.parse(sn);
          const smn = localStorage.getItem(`${STORAGE_KEY}_mechanicNotifications`);
          if (smn) localMechNotifs = JSON.parse(smn);
        } catch {}

        // Protect operational tables: if server restarted with 0 records, PRESERVE local user data!
        const activeClients = Array.isArray(p.clients) && p.clients.length > 0 ? p.clients : (localClients.length > 0 ? localClients : (Array.isArray(p.clients) ? p.clients : []));
        const activeWorkOrders = Array.isArray(p.workOrders) && p.workOrders.length > 0 ? p.workOrders : (localWorkOrders.length > 0 ? localWorkOrders : (Array.isArray(p.workOrders) ? p.workOrders : []));
        const activeParts = Array.isArray(p.parts) && p.parts.length > 0 ? p.parts : (localParts.length > 0 ? localParts : (Array.isArray(p.parts) ? p.parts : []));
        const activeAppointments = Array.isArray(p.appointments) && p.appointments.length > 0 ? p.appointments : (localAppointments.length > 0 ? localAppointments : (Array.isArray(p.appointments) ? p.appointments : []));
        const activeBudgets = Array.isArray(p.budgets) && p.budgets.length > 0 ? p.budgets : (localBudgets.length > 0 ? localBudgets : (Array.isArray(p.budgets) ? p.budgets : []));
        const activeNotifs = Array.isArray(p.notifications) && p.notifications.length > 0 ? p.notifications : (localNotifs.length > 0 ? localNotifs : (Array.isArray(p.notifications) ? p.notifications : []));
        const activeMechNotifs = Array.isArray(p.mechanicNotifications) && p.mechanicNotifications.length > 0 ? p.mechanicNotifications : (localMechNotifs.length > 0 ? localMechNotifs : (Array.isArray(p.mechanicNotifications) ? p.mechanicNotifications : []));

        // For users / mechanics:
        // Ensure VlaSwink51 master admin is always present without wiping user-created mechanics
        const isUsersModifiedLocally = localStorage.getItem(`${STORAGE_KEY}_users_modified`) === 'true';
        let activeUsers = Array.isArray(p.users) && p.users.length > 0 ? p.users : [...INITIAL_USERS];
        if (!activeUsers.some((u: any) => u.username?.toLowerCase() === 'vlaswink51')) {
          activeUsers = [INITIAL_USERS[0], ...activeUsers];
        }
        if (localUsers.length > 0 && isUsersModifiedLocally) {
          activeUsers = localUsers;
        }

        setClients(activeClients);
        setWorkOrders(activeWorkOrders);
        setParts(activeParts);
        setAppointments(activeAppointments);
        setBudgets(activeBudgets);
        setUsers(activeUsers);
        setNotifications(activeNotifs);
        setMechanicNotifications(activeMechNotifs);
        if (p.workshopContact && typeof p.workshopContact === 'object') {
          setWorkshopContact(p.workshopContact);
        }
        isInitializedFromServerRef.current = true;

        // If local data rescued a cold/wiped server state, re-hydrate server immediately so database is saved!
        const needsHydration = (
          (activeClients.length > 0 && (!p.clients || p.clients.length === 0)) ||
          (activeWorkOrders.length > 0 && (!p.workOrders || p.workOrders.length === 0)) ||
          (activeParts.length > 0 && (!p.parts || p.parts.length === 0)) ||
          (activeAppointments.length > 0 && (!p.appointments || p.appointments.length === 0)) ||
          (activeBudgets.length > 0 && (!p.budgets || p.budgets.length === 0)) ||
          (activeUsers !== p.users && isUsersModifiedLocally)
        );

        if (needsHydration) {
          fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clients: activeClients,
              parts: activeParts,
              appointments: activeAppointments,
              budgets: activeBudgets,
              workOrders: activeWorkOrders,
              notifications: activeNotifs,
              mechanicNotifications: activeMechNotifs,
              users: activeUsers,
              workshopContact: p.workshopContact || workshopContact,
            }),
          }).catch(e => console.warn('INIT_STATE re-hydration notice:', e));
        }
        break;
      }

      case 'STATE_SYNCED': {
        const p = data.payload;
        if (!p) break;
        if (Array.isArray(p.workOrders)) setWorkOrders(p.workOrders);
        if (Array.isArray(p.users) && p.users.length > 0) setUsers(p.users);
        if (Array.isArray(p.mechanicNotifications)) setMechanicNotifications(p.mechanicNotifications);
        if (Array.isArray(p.clients)) setClients(p.clients);
        if (Array.isArray(p.parts)) setParts(p.parts);
        if (Array.isArray(p.appointments)) setAppointments(p.appointments);
        if (Array.isArray(p.budgets)) setBudgets(p.budgets);
        if (p.workshopContact && typeof p.workshopContact === 'object') {
          setWorkshopContact(p.workshopContact);
        }
        isInitializedFromServerRef.current = true;
        break;
      }

      case 'WORKSHOP_CONTACT_UPDATED': {
        const { workshopContact: updatedContact } = data.payload || {};
        if (updatedContact) {
          setWorkshopContact(updatedContact);
        }
        break;
      }

      case 'PRESENCE_UPDATE': {
        if (data.connectedClients) setConnectedClients(data.connectedClients);
        break;
      }

      // CLIENTS
      case 'CLIENT_CREATED': {
        const { client } = data.payload;
        if (client) {
          setClients(prev => [client, ...prev.filter(c => c.id !== client.id)]);
        }
        break;
      }
      case 'CLIENT_UPDATED': {
        const { client } = data.payload;
        if (client) {
          setClients(prev => prev.map(c => (c.id === client.id ? client : c)));
        }
        break;
      }
      case 'CLIENT_DELETED': {
        const { clientId } = data.payload;
        if (clientId) {
          setClients(prev => prev.filter(c => c.id !== clientId));
        }
        break;
      }

      // PARTS
      case 'PART_CREATED': {
        const { part } = data.payload;
        if (part) {
          setParts(prev => [part, ...prev.filter(p => p.id !== part.id)]);
        }
        break;
      }
      case 'PART_UPDATED': {
        const { part } = data.payload;
        if (part) {
          setParts(prev => prev.map(p => (p.id === part.id ? part : p)));
        }
        break;
      }
      case 'PART_DELETED': {
        const { partId } = data.payload;
        if (partId) {
          setParts(prev => prev.filter(p => p.id !== partId));
        }
        break;
      }
      case 'PART_STOCK_ADJUSTED': {
        const { id, delta } = data.payload;
        if (id && delta !== undefined) {
          setParts(prev =>
            prev.map(p => (p.id === id ? { ...p, stockQuantity: Math.max(0, p.stockQuantity + delta) } : p))
          );
        }
        break;
      }

      // APPOINTMENTS
      case 'APPOINTMENT_CREATED': {
        const { appointment } = data.payload;
        if (appointment) {
          setAppointments(prev => [appointment, ...prev.filter(a => a.id !== appointment.id)]);
        }
        break;
      }
      case 'APPOINTMENT_UPDATED': {
        const { appointment } = data.payload;
        if (appointment) {
          setAppointments(prev => prev.map(a => (a.id === appointment.id ? appointment : a)));
        }
        break;
      }
      case 'APPOINTMENT_DELETED': {
        const { appointmentId } = data.payload;
        if (appointmentId) {
          setAppointments(prev => prev.filter(a => a.id !== appointmentId));
        }
        break;
      }

      // BUDGETS
      case 'BUDGET_CREATED': {
        const { budget } = data.payload;
        if (budget) {
          setBudgets(prev => [budget, ...prev.filter(b => b.id !== budget.id)]);
        }
        break;
      }
      case 'BUDGET_UPDATED': {
        const { budget } = data.payload;
        if (budget) {
          setBudgets(prev => prev.map(b => (b.id === budget.id ? budget : b)));
        }
        break;
      }
      case 'BUDGET_DELETED': {
        const { budgetId } = data.payload;
        if (budgetId) {
          setBudgets(prev => prev.filter(b => b.id !== budgetId));
        }
        break;
      }

      case 'WORK_ORDER_CREATED': {
        const { order, notification } = data.payload;
        if (order) {
          setWorkOrders(prev => {
            if (prev.some(o => o.id === order.id)) return prev;
            return [order, ...prev];
          });
        }
        if (notification) {
          setMechanicNotifications(prev => {
            if (prev.some(n => n.id === notification.id)) return prev;
            return [notification, ...prev];
          });

          // If current user is the assigned mechanic, show notification toast alert!
          if (currentUser?.name && notification.technicianName.toLowerCase().includes(currentUser.name.toLowerCase())) {
            setActiveAlertToast(notification);
          }
        }
        break;
      }

      case 'WORK_ORDER_UPDATED': {
        const { order } = data.payload;
        if (order) {
          setWorkOrders(prev => prev.map(o => (o.id === order.id ? order : o)));
        }
        break;
      }

      case 'WORK_ORDER_REASSIGNED': {
        const { otId, newTechnician, notification } = data.payload;
        setWorkOrders(prev =>
          prev.map(o => (o.id === otId ? { ...o, assignedTechnician: newTechnician } : o))
        );
        if (notification) {
          setMechanicNotifications(prev => {
            if (prev.some(n => n.id === notification.id)) return prev;
            return [notification, ...prev];
          });
          if (currentUser?.name && newTechnician.toLowerCase().includes(currentUser.name.toLowerCase())) {
            setActiveAlertToast(notification);
          }
        }
        break;
      }

      case 'WORK_ORDER_DELETED': {
        const { otId } = data.payload;
        if (otId) {
          setWorkOrders(prev => prev.filter(o => o.id !== otId));
        }
        break;
      }

      case 'USER_UPDATE':
      case 'USER_UPDATED': {
        const { user } = data.payload;
        if (user) {
          setUsers(prev => {
            const exists = prev.some(u => u.id === user.id);
            const next = exists ? prev.map(u => (u.id === user.id ? user : u)) : [...prev, user];
            try { localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(next)); } catch {}
            return next;
          });
          if (currentUser?.id === user.id) {
            setCurrentUser(user);
          }
        }
        break;
      }

      case 'USER_CREATE':
      case 'USER_CREATED': {
        const { user } = data.payload;
        if (user) {
          setUsers(prev => {
            if (prev.some(u => u.id === user.id)) return prev;
            const next = [...prev, user];
            try { localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(next)); } catch {}
            return next;
          });
        }
        break;
      }

      case 'USER_DELETE':
      case 'USER_DELETED': {
        const { userId } = data.payload;
        if (userId) {
          setUsers(prev => {
            const next = prev.filter(u => u.id !== userId);
            try { localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(next)); } catch {}
            return next;
          });
          if (currentUser?.id === userId) {
            setCurrentUser(null);
          }
        }
        break;
      }

      case 'NOTIFICATIONS_READ_UPDATED': {
        const { technicianName } = data.payload;
        setMechanicNotifications(prev =>
          prev.map(n =>
            !technicianName || n.technicianName.toLowerCase().includes(technicianName.toLowerCase())
              ? { ...n, read: true }
              : n
          )
        );
        break;
      }
    }
  };

  // Real-time synchronization lifecycle (WebSocket + BroadcastChannel + REST)
  useEffect(() => {
    // 1. Cross-tab real-time channel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('taller_rodriguez_realtime_sync');
        channelRef.current = bc;
        bc.onmessage = event => {
          handleIncomingRealtimeMessage(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }

    // 2. Real-time WebSocket connection to server
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWS = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsRealtimeConnected(true);
          setSyncStatus('synced');
        };

        socket.onmessage = evt => {
          try {
            const data = JSON.parse(evt.data);
            handleIncomingRealtimeMessage(data);
          } catch (err) {
            console.error('Error handling WebSocket event', err);
          }
        };

        socket.onclose = () => {
          setIsRealtimeConnected(false);
          reconnectTimeout = setTimeout(connectWS, 3000);
        };

        socket.onerror = () => {
          setIsRealtimeConnected(false);
        };
      } catch (err) {
        console.warn('WebSocket connection not ready, relying on REST/local sync', err);
      }
    };

    // Clean up legacy mock data keys from older versions
    try {
      const legacyKeys = [
        'taller_rodriguez_data_v3_clean_clients',
        'taller_rodriguez_data_v3_clean_parts',
        'taller_rodriguez_data_v3_clean_appointments',
        'taller_rodriguez_data_v3_clean_budgets',
        'taller_rodriguez_data_v3_clean_workOrders',
        'taller_rodriguez_data_v3_clean_notifications',
        'taller_rodriguez_data_v3_clean_mechanicNotifications',
        'taller_rodriguez_data_v3_clean_users',
        'taller_rodriguez_data_v2_usd_clients',
        'taller_rodriguez_data_v2_usd_parts',
        'taller_rodriguez_data_v2_usd_appointments',
        'taller_rodriguez_data_v2_usd_budgets',
        'taller_rodriguez_data_v2_usd_workOrders',
        'taller_rodriguez_data_v2_usd_notifications',
        'taller_rodriguez_data_v2_usd_mechanicNotifications',
      ];
      legacyKeys.forEach(k => localStorage.removeItem(k));
    } catch {}

    connectWS();

    // 3. Authoritative server database state fetch on load
    fetch('/api/database')
      .then(r => r.json())
      .then(res => {
        if (res && res.success && res.data) {
          if (res.connectedClients) setConnectedClients(res.connectedClients);
          const p = res.data;

          // Retrieve cached local data to prevent cold server restarts or empty payloads from wiping user data
          let localClients: Client[] = [];
          let localWorkOrders: WorkOrder[] = [];
          let localParts: Part[] = [];
          let localAppointments: Appointment[] = [];
          let localBudgets: Budget[] = [];
          let localUsers: User[] = [];
          let localNotifs: NotificationLog[] = [];
          let localMechNotifs: MechanicAssignmentNotification[] = [];

          try {
            const sc = localStorage.getItem(`${STORAGE_KEY}_clients`);
            if (sc) localClients = JSON.parse(sc);
            const swo = localStorage.getItem(`${STORAGE_KEY}_workOrders`);
            if (swo) localWorkOrders = JSON.parse(swo);
            const sp = localStorage.getItem(`${STORAGE_KEY}_parts`);
            if (sp) localParts = JSON.parse(sp);
            const sa = localStorage.getItem(`${STORAGE_KEY}_appointments`);
            if (sa) localAppointments = JSON.parse(sa);
            const sb = localStorage.getItem(`${STORAGE_KEY}_budgets`);
            if (sb) localBudgets = JSON.parse(sb);
            const su = localStorage.getItem(`${STORAGE_KEY}_users`);
            if (su) localUsers = JSON.parse(su);
            const sn = localStorage.getItem(`${STORAGE_KEY}_notifications`);
            if (sn) localNotifs = JSON.parse(sn);
            const smn = localStorage.getItem(`${STORAGE_KEY}_mechanicNotifications`);
            if (smn) localMechNotifs = JSON.parse(smn);
          } catch {}

          // Prioritize server data if server has records. If server was wiped/restarted with 0 records, PRESERVE local cache!
          const activeClients = Array.isArray(p.clients) && p.clients.length > 0 ? p.clients : (localClients.length > 0 ? localClients : (Array.isArray(p.clients) ? p.clients : []));
          const activeWorkOrders = Array.isArray(p.workOrders) && p.workOrders.length > 0 ? p.workOrders : (localWorkOrders.length > 0 ? localWorkOrders : (Array.isArray(p.workOrders) ? p.workOrders : []));
          const activeParts = Array.isArray(p.parts) && p.parts.length > 0 ? p.parts : (localParts.length > 0 ? localParts : (Array.isArray(p.parts) ? p.parts : []));
          const activeAppointments = Array.isArray(p.appointments) && p.appointments.length > 0 ? p.appointments : (localAppointments.length > 0 ? localAppointments : (Array.isArray(p.appointments) ? p.appointments : []));
          const activeBudgets = Array.isArray(p.budgets) && p.budgets.length > 0 ? p.budgets : (localBudgets.length > 0 ? localBudgets : (Array.isArray(p.budgets) ? p.budgets : []));
          const activeNotifs = Array.isArray(p.notifications) && p.notifications.length > 0 ? p.notifications : (localNotifs.length > 0 ? localNotifs : (Array.isArray(p.notifications) ? p.notifications : []));
          const activeMechNotifs = Array.isArray(p.mechanicNotifications) && p.mechanicNotifications.length > 0 ? p.mechanicNotifications : (localMechNotifs.length > 0 ? localMechNotifs : (Array.isArray(p.mechanicNotifications) ? p.mechanicNotifications : []));

          // For users: if local users list was customized (mechanics added or deleted), preserve it over server clean default
          const isUsersModifiedLocally = localStorage.getItem(`${STORAGE_KEY}_users_modified`) === 'true';
          let activeUsers = Array.isArray(p.users) && p.users.length > 0 ? p.users : [...INITIAL_USERS];
          if (!activeUsers.some((u: any) => u.username?.toLowerCase() === 'vlaswink51')) {
            activeUsers = [INITIAL_USERS[0], ...activeUsers];
          }
          if (localUsers.length > 0 && isUsersModifiedLocally) {
            activeUsers = localUsers;
          }

          setClients(activeClients);
          setParts(activeParts);
          setAppointments(activeAppointments);
          setBudgets(activeBudgets);
          setWorkOrders(activeWorkOrders);
          setUsers(activeUsers);
          setNotifications(activeNotifs);
          setMechanicNotifications(activeMechNotifs);
          isInitializedFromServerRef.current = true;

          // Always write full synchronized state to localStorage cache
          try {
            localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(activeUsers));
            localStorage.setItem(`${STORAGE_KEY}_clients`, JSON.stringify(activeClients));
            localStorage.setItem(`${STORAGE_KEY}_parts`, JSON.stringify(activeParts));
            localStorage.setItem(`${STORAGE_KEY}_appointments`, JSON.stringify(activeAppointments));
            localStorage.setItem(`${STORAGE_KEY}_budgets`, JSON.stringify(activeBudgets));
            localStorage.setItem(`${STORAGE_KEY}_workOrders`, JSON.stringify(activeWorkOrders));
            localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(activeNotifs));
            localStorage.setItem(`${STORAGE_KEY}_mechanicNotifications`, JSON.stringify(activeMechNotifs));
            if (p.workshopContact && typeof p.workshopContact === 'object') {
              setWorkshopContact(p.workshopContact);
              localStorage.setItem(`${STORAGE_KEY}_workshop_contact`, JSON.stringify(p.workshopContact));
            }
          } catch {}

          // If local data rescued an empty server state, re-hydrate server immediately so database is persistent!
          const needsServerSync = (
            (activeClients.length > 0 && (!p.clients || p.clients.length === 0)) ||
            (activeWorkOrders.length > 0 && (!p.workOrders || p.workOrders.length === 0)) ||
            (activeParts.length > 0 && (!p.parts || p.parts.length === 0)) ||
            (activeAppointments.length > 0 && (!p.appointments || p.appointments.length === 0)) ||
            (activeBudgets.length > 0 && (!p.budgets || p.budgets.length === 0)) ||
            (activeUsers.length !== (p.users ? p.users.length : 0))
          );

          if (needsServerSync) {
            fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clients: activeClients,
                parts: activeParts,
                appointments: activeAppointments,
                budgets: activeBudgets,
                workOrders: activeWorkOrders,
                notifications: activeNotifs,
                mechanicNotifications: activeMechNotifs,
                users: activeUsers,
                workshopContact: p.workshopContact || workshopContact,
              }),
            }).catch(err => console.warn('Re-hydration sync notice:', err));
          }
        }
      })
      .catch(err => {
        console.warn('Could not fetch server state on load', err);
      })
      .finally(() => {
        setIsDbReady(true);
      });

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
      if (channelRef.current) channelRef.current.close();
    };
  }, []);

  const dismissAlertToast = () => setActiveAlertToast(null);

  const unreadNotificationsCount = mechanicNotifications.filter(
    n => !n.read && (!currentUser || n.technicianName.toLowerCase().includes(currentUser.name.toLowerCase()))
  ).length;

  const markNotificationsAsRead = (technicianName?: string) => {
    const targetTech = technicianName || currentUser?.name;
    setMechanicNotifications(prev =>
      prev.map(n =>
        !targetTech || n.technicianName.toLowerCase().includes(targetTech.toLowerCase())
          ? { ...n, read: true }
          : n
      )
    );
    sendRealtimeEvent('NOTIFICATIONS_MARK_READ', { technicianName: targetTech });
  };

  // Client Management
  const addClient = (data: Omit<Client, 'id' | 'totalSpent' | 'createdAt'>): Client => {
    if (!hasPermission('canManageClients')) {
      alert('🔒 Acción Bloqueada: Tu cuenta no tiene permisos para crear o registrar clientes (canManageClients).');
      throw new Error('Unauthorized: canManageClients required');
    }
    const newClient: Client = {
      ...data,
      id: `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      totalSpent: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setClients(prev => [newClient, ...prev]);
    fetch('/api/clients/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client: newClient }),
    }).catch(e => console.warn(e));
    sendRealtimeEvent('CLIENT_CREATE', { client: newClient });
    triggerCloudSync();
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    if (!hasPermission('canManageClients')) {
      alert('🔒 Acción Bloqueada: Tu cuenta no tiene permisos para modificar datos de clientes o vehículos (canManageClients).');
      return;
    }
    let updatedClient: Client | null = null;
    setClients(prev =>
      prev.map(c => {
        if (c.id === id) {
          updatedClient = { ...c, ...updates };
          return updatedClient;
        }
        return c;
      })
    );
    if (updatedClient) {
      fetch('/api/clients/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client: updatedClient }),
      }).catch(e => console.warn(e));
      sendRealtimeEvent('CLIENT_UPDATE', { client: updatedClient });
    }
    triggerCloudSync();
  };

  const deleteClient = (id: string) => {
    if (!hasPermission('canDeleteRecords')) {
      alert('🔒 Acción Bloqueada: Tu rol de usuario no tiene permiso para eliminar clientes (canDeleteRecords).');
      return;
    }
    setClients(prev => prev.filter(c => c.id !== id));
    fetch('/api/clients/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(e => console.warn(e));
    sendRealtimeEvent('CLIENT_DELETE', { clientId: id });
    triggerCloudSync();
  };

  // Parts Management
  const addPart = (data: Omit<Part, 'id'>): Part => {
    if (!hasPermission('canManageInventory')) {
      alert('🔒 Acción Bloqueada: Tu cuenta no tiene permisos para agregar repuestos al inventario (canManageInventory).');
      throw new Error('Unauthorized: canManageInventory required');
    }
    const newPart: Part = {
      ...data,
      id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setParts(prev => [newPart, ...prev]);
    fetch('/api/parts/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part: newPart }),
    }).catch(e => console.warn(e));
    sendRealtimeEvent('PART_CREATE', { part: newPart });
    triggerCloudSync();
    return newPart;
  };

  const updatePart = (id: string, updates: Partial<Part>) => {
    if (!hasPermission('canManageInventory')) {
      alert('🔒 Acción Bloqueada: Tu cuenta no tiene permisos para modificar repuestos o precios (canManageInventory).');
      return;
    }
    let updatedPart: Part | null = null;
    setParts(prev =>
      prev.map(p => {
        if (p.id === id) {
          updatedPart = { ...p, ...updates };
          return updatedPart;
        }
        return p;
      })
    );
    if (updatedPart) {
      fetch('/api/parts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part: updatedPart }),
      }).catch(e => console.warn(e));
      sendRealtimeEvent('PART_UPDATE', { part: updatedPart });
    }
    triggerCloudSync();
  };

  const deletePart = (id: string) => {
    if (!hasPermission('canDeleteRecords')) {
      alert('🔒 Acción Bloqueada: Tu rol de usuario no tiene permiso para eliminar repuestos del inventario (canDeleteRecords).');
      return;
    }
    setParts(prev => prev.filter(p => p.id !== id));
    fetch('/api/parts/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(e => console.warn(e));
    sendRealtimeEvent('PART_DELETE', { partId: id });
    triggerCloudSync();
  };

  const adjustPartStock = (id: string, delta: number) => {
    if (!hasPermission('canManageInventory')) {
      alert('🔒 Acción Bloqueada: Tu cuenta no tiene permisos para modificar existencias de repuestos (canManageInventory).');
      return;
    }
    let updatedPart: Part | null = null;
    setParts(prev =>
      prev.map(p => {
        if (p.id === id) {
          updatedPart = { ...p, stockQuantity: Math.max(0, p.stockQuantity + delta) };
          return updatedPart;
        }
        return p;
      })
    );
    if (updatedPart) {
      fetch('/api/parts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part: updatedPart }),
      }).catch(e => console.warn(e));
    }
    sendRealtimeEvent('PART_STOCK_ADJUST', { id, delta });
    triggerCloudSync();
  };

  // Appointments
  const addAppointment = (data: Omit<Appointment, 'id' | 'createdAt'>): Appointment => {
    if (!hasPermission('canManageAppointments')) {
      alert('🔒 Acción Bloqueada: Tu cuenta no tiene permisos para agendar citas (canManageAppointments).');
      throw new Error('Unauthorized: canManageAppointments required');
    }
    const newApp: Appointment = {
      ...data,
      id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAppointments(prev => [newApp, ...prev]);
    fetch('/api/appointments/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment: newApp }),
    }).catch(e => console.warn(e));
    sendRealtimeEvent('APPOINTMENT_CREATE', { appointment: newApp });
    triggerCloudSync();
    return newApp;
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    if (!hasPermission('canManageAppointments')) {
      alert('🔒 Acción Bloqueada: Tu cuenta no tiene permisos para modificar citas (canManageAppointments).');
      return;
    }
    let updatedApp: Appointment | null = null;
    setAppointments(prev =>
      prev.map(a => {
        if (a.id === id) {
          updatedApp = { ...a, ...updates };
          return updatedApp;
        }
        return a;
      })
    );
    if (updatedApp) {
      fetch('/api/appointments/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment: updatedApp }),
      }).catch(e => console.warn(e));
      sendRealtimeEvent('APPOINTMENT_UPDATE', { appointment: updatedApp });
    }
    triggerCloudSync();
  };

  const deleteAppointment = (id: string) => {
    if (!hasPermission('canDeleteRecords')) {
      alert('🔒 Acción Bloqueada: Tu rol de usuario no tiene permiso para eliminar citas (canDeleteRecords).');
      return;
    }
    setAppointments(prev => prev.filter(a => a.id !== id));
    fetch('/api/appointments/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(e => console.warn(e));
    sendRealtimeEvent('APPOINTMENT_DELETE', { appointmentId: id });
    triggerCloudSync();
  };

  // Budgets
  const createBudget = (
    data: Omit<Budget, 'id' | 'quoteNumber' | 'createdAt' | 'subtotal' | 'taxAmount' | 'total'>
  ): Budget => {
    if (!hasPermission('canManageBudgets')) {
      alert('🔒 Acción Bloqueada: Tu cuenta no tiene permisos para crear presupuestos (canManageBudgets).');
      throw new Error('Unauthorized: canManageBudgets required');
    }
    const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * (data.taxPercent || WORKSHOP_CONFIG.defaultTaxPercent)) / 100;
    const total = Math.max(0, subtotal + taxAmount - (data.discountAmount || 0));

    const quoteCount = budgets.length + 1;
    const quoteNumber = `COT-2026-${String(quoteCount).padStart(4, '0')}`;

    const newBudget: Budget = {
      ...data,
      id: `cot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      quoteNumber,
      subtotal,
      taxAmount,
      total,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setBudgets(prev => [newBudget, ...prev]);
    fetch('/api/budgets/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget: newBudget }),
    }).catch(e => console.warn(e));
    sendRealtimeEvent('BUDGET_CREATE', { budget: newBudget });
    triggerCloudSync();
    return newBudget;
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    if (!hasPermission('canManageBudgets')) {
      alert('🔒 Acción Bloqueada: Tu cuenta no tiene permisos para modificar presupuestos (canManageBudgets).');
      return;
    }
    let updatedBudget: Budget | null = null;
    setBudgets(prev =>
      prev.map(b => {
        if (b.id !== id) return b;
        const merged = { ...b, ...updates };
        const subtotal = merged.items.reduce((sum, item) => sum + item.total, 0);
        const taxAmount = (subtotal * (merged.taxPercent || WORKSHOP_CONFIG.defaultTaxPercent)) / 100;
        const total = Math.max(0, subtotal + taxAmount - (merged.discountAmount || 0));
        updatedBudget = { ...merged, subtotal, taxAmount, total };
        return updatedBudget;
      })
    );
    if (updatedBudget) {
      fetch('/api/budgets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: updatedBudget }),
      }).catch(e => console.warn(e));
      sendRealtimeEvent('BUDGET_UPDATE', { budget: updatedBudget });
    }
    triggerCloudSync();
  };

  const deleteBudget = (id: string) => {
    if (!hasPermission('canDeleteRecords')) {
      alert('🔒 Acción Bloqueada: Tu rol de usuario no tiene permiso para eliminar presupuestos (canDeleteRecords).');
      return;
    }
    setBudgets(prev => prev.filter(b => b.id !== id));
    fetch('/api/budgets/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(e => console.warn(e));
    sendRealtimeEvent('BUDGET_DELETE', { budgetId: id });
    triggerCloudSync();
  };

  // 1-Click Convert Budget to Work Order
  const convertBudgetToWorkOrder = (budgetId: string): WorkOrder | null => {
    if (!hasPermission('canManageWorkOrders')) {
      alert('🔒 Acción Bloqueada: Requiere el permiso de gestión de órdenes de trabajo para convertir un presupuesto a OT (canManageWorkOrders).');
      return null;
    }
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return null;

    const partsUsed = budget.items
      .filter(i => i.type === 'repuesto')
      .map(i => {
        const foundPart = parts.find(p => p.id === i.partId);
        return {
          partId: i.partId || `custom-${Date.now()}`,
          sku: foundPart ? foundPart.sku : 'REP-GEN',
          name: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total,
        };
      });

    // Automatically decrement stock for parts used
    partsUsed.forEach(pu => {
      if (pu.partId) {
        adjustPartStock(pu.partId, -pu.quantity);
      }
    });

    const laborItems = budget.items.filter(i => i.type === 'mano_de_obra');
    const laborHours = laborItems.reduce((sum, i) => sum + i.quantity, 0) || 1;
    const laborTotal = laborItems.reduce((sum, i) => sum + i.total, 0) || WORKSHOP_CONFIG.defaultLaborRate;

    const otCount = workOrders.length + 145;
    const otNumber = `OT-2026-${String(otCount).padStart(4, '0')}`;

    const newOrder: WorkOrder = {
      id: `ot-${Date.now()}`,
      otNumber,
      quoteId: budget.id,
      clientId: budget.clientId,
      clientName: budget.clientName,
      clientPhone: budget.clientPhone,
      vehiclePlate: budget.vehiclePlate,
      vehicleBrand: budget.vehicleModel.split(' ')[0] || 'Vehículo',
      vehicleModel: budget.vehicleModel,
      vehicleYear: 2022,
      mileageIn: 50000,
      fuelLevel: '1/2',
      damagesInspectionNotes: 'Recepción directa tras aprobación de presupuesto.',
      reportedFault: `Servicio autorizado según presupuesto ${budget.quoteNumber}`,
      diagnosedProblem: budget.notes || 'Proceder con repuestos y mano de obra cotizada.',
      stage: 'en_reparacion',
      priority: 'normal',
      assignedTechnician: WORKSHOP_CONFIG.technicians[0],
      startDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString().replace('T', ' ').slice(0, 16),
      partsUsed,
      laborHours,
      laborRatePerHour: WORKSHOP_CONFIG.defaultLaborRate,
      laborTotal,
      subtotal: budget.subtotal,
      taxPercent: 0,
      taxAmount: 0,
      discountAmount: budget.discountAmount,
      total: Math.max(0, budget.subtotal - (budget.discountAmount || 0)),
      paymentStatus: 'pendiente',
      amountPaid: 0,
      technicianNotes: 'Orden iniciada automáticamente desde presupuesto aprobado.',
      customerSignatureReceived: true,
      customerSignatureName: budget.clientName,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setWorkOrders(prev => [newOrder, ...prev]);

    // Mark budget as converted
    updateBudget(budget.id, {
      status: 'convertido_a_ot',
      convertedToWorkOrderId: newOrder.id,
    });

    triggerCloudSync();
    return newOrder;
  };

  // Work Orders Management
  const createWorkOrder = (
    data: Omit<WorkOrder, 'id' | 'otNumber' | 'createdAt' | 'subtotal' | 'taxAmount' | 'total'> & { laborTotal?: number }
  ): WorkOrder => {
    if (!hasPermission('canManageWorkOrders')) {
      alert('🔒 Acción Bloqueada: Tu cuenta no tiene permisos para crear órdenes de trabajo (canManageWorkOrders).');
      throw new Error('Unauthorized: canManageWorkOrders required');
    }
    const partsTotal = data.partsUsed.reduce((sum, p) => sum + p.total, 0);
    const laborTotal = typeof data.laborTotal === 'number'
      ? data.laborTotal
      : WORKSHOP_CONFIG.defaultLaborRate;
    const subtotal = partsTotal + laborTotal;
    const taxAmount = (subtotal * (data.taxPercent || WORKSHOP_CONFIG.defaultTaxPercent)) / 100;
    const total = Math.max(0, subtotal + taxAmount - (data.discountAmount || 0));

    // Deduct inventory parts stock
    data.partsUsed.forEach(p => {
      adjustPartStock(p.partId, -p.quantity);
    });

    const otCount = workOrders.length + 145;
    const otNumber = `OT-2026-${String(otCount).padStart(4, '0')}`;

    const newOrder: WorkOrder = {
      ...data,
      id: `ot-${Date.now()}`,
      otNumber,
      laborTotal,
      subtotal,
      taxAmount,
      total,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setWorkOrders(prev => [newOrder, ...prev]);

    // Update client total spent if paid
    if (newOrder.amountPaid > 0) {
      setClients(prev =>
        prev.map(c => (c.id === newOrder.clientId ? { ...c, totalSpent: c.totalSpent + newOrder.amountPaid } : c))
      );
    }

    // Generate assignment notification for the assigned technician if specified
    let notification: MechanicAssignmentNotification | null = null;
    if (newOrder.assignedTechnician) {
      notification = {
        id: `mnotif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        technicianName: newOrder.assignedTechnician,
        otId: newOrder.id,
        otNumber: newOrder.otNumber,
        clientName: newOrder.clientName,
        vehiclePlate: newOrder.vehiclePlate,
        vehicleModel: `${newOrder.vehicleBrand} ${newOrder.vehicleModel}`,
        reportedFault: newOrder.reportedFault,
        priority: newOrder.priority,
        assignedBy: currentUser?.name
          ? `${currentUser.name} (${currentUser.role === 'boss' ? 'Administrador' : 'Mecánico'})`
          : 'VlaSwink51 (Administrador)',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        read: false,
      };

      setMechanicNotifications(prev => [notification!, ...prev]);

      if (currentUser?.name && newOrder.assignedTechnician.toLowerCase().includes(currentUser.name.toLowerCase())) {
        setActiveAlertToast(notification);
      }
    }

    fetch('/api/work-orders/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder, notification }),
    }).catch(e => console.warn(e));

    sendRealtimeEvent('WORK_ORDER_CREATE', { order: newOrder, notification });
    triggerCloudSync();
    return newOrder;
  };

  const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => {
    if (!hasPermission('canManageWorkOrders')) {
      alert('🔒 Acción Bloqueada: Tu cuenta no tiene permisos para modificar órdenes de trabajo (canManageWorkOrders).');
      return;
    }
    let updatedOrder: WorkOrder | null = null;
    setWorkOrders(prev =>
      prev.map(order => {
        if (order.id !== id) return order;
        const merged = { ...order, ...updates };
        const partsTotal = merged.partsUsed.reduce((sum, p) => sum + p.total, 0);
        const laborTotal = typeof merged.laborTotal === 'number'
          ? merged.laborTotal
          : WORKSHOP_CONFIG.defaultLaborRate;
        const subtotal = partsTotal + laborTotal;
        const taxAmount = (subtotal * (merged.taxPercent || WORKSHOP_CONFIG.defaultTaxPercent)) / 100;
        const total = Math.max(0, subtotal + taxAmount - (merged.discountAmount || 0));

        // If completed and delivered, update client spent
        if (updates.paymentStatus === 'pagado' && order.paymentStatus !== 'pagado') {
          setClients(cList =>
            cList.map(c => (c.id === merged.clientId ? { ...c, totalSpent: c.totalSpent + (total - order.amountPaid) } : c))
          );
        }

        updatedOrder = { ...merged, laborTotal, subtotal, taxAmount, total };
        return updatedOrder;
      })
    );

    if (updatedOrder) {
      fetch('/api/work-orders/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: updatedOrder }),
      }).catch(e => console.warn(e));
      sendRealtimeEvent('WORK_ORDER_UPDATE', { order: updatedOrder });
    }
    triggerCloudSync();
  };

  const reassignWorkOrder = (otId: string, newTechnician: string) => {
    if (!hasPermission('canManageMechanics')) {
      alert('🔒 Acción Bloqueada: Solo el Jefe de Taller o administradores pueden reasignar mecánicos (canManageMechanics).');
      return;
    }
    const order = workOrders.find(o => o.id === otId);
    if (!order) return;

    const notification: MechanicAssignmentNotification = {
      id: `mnotif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      technicianName: newTechnician,
      otId: order.id,
      otNumber: order.otNumber,
      clientName: order.clientName,
      vehiclePlate: order.vehiclePlate,
      vehicleModel: `${order.vehicleBrand} ${order.vehicleModel}`,
      reportedFault: order.reportedFault,
      priority: order.priority,
      assignedBy: currentUser?.name
        ? `${currentUser.name} (${currentUser.role === 'boss' ? 'Administrador' : 'Mecánico'})`
        : 'VlaSwink51 (Administrador)',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      read: false,
    };

    setWorkOrders(prev =>
      prev.map(o => (o.id === otId ? { ...o, assignedTechnician: newTechnician } : o))
    );

    setMechanicNotifications(prev => [notification, ...prev]);

    if (currentUser?.name && newTechnician.toLowerCase().includes(currentUser.name.toLowerCase())) {
      setActiveAlertToast(notification);
    }

    fetch('/api/work-orders/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: { ...order, assignedTechnician: newTechnician }, notification }),
    }).catch(e => console.warn(e));

    sendRealtimeEvent('WORK_ORDER_REASSIGN', { otId, newTechnician, notification });
    triggerCloudSync();
  };

  const updateWorkOrderStage = (id: string, stage: WorkOrderStage) => {
    if (!hasPermission('canManageWorkOrders')) {
      alert('🔒 Acción Bloqueada: Tu cuenta no tiene permisos para cambiar la etapa de órdenes de trabajo (canManageWorkOrders).');
      return;
    }
    updateWorkOrder(id, {
      stage,
      completedDate: stage === 'entregado' ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  const deleteWorkOrder = (id: string) => {
    if (!hasPermission('canDeleteRecords')) {
      alert('🔒 Acción Bloqueada: Tu rol de usuario no tiene permiso para eliminar órdenes de trabajo (canDeleteRecords).');
      return;
    }
    setWorkOrders(prev => prev.filter(o => o.id !== id));
    fetch('/api/work-orders/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(e => console.warn(e));
    sendRealtimeEvent('WORK_ORDER_DELETE', { otId: id });
    triggerCloudSync();
  };

  // WhatsApp Notification Engine
  const sendWhatsAppNotification = ({
    phone,
    clientName,
    templateType,
    customMessage,
    data = {},
  }: {
    phone: string;
    clientName: string;
    templateType: NotificationLog['templateType'];
    customMessage?: string;
    data?: Record<string, any>;
  }): string => {
    if (!hasPermission('canSendWhatsApp')) {
      console.warn('Acción denegada: No tienes permiso para enviar mensajes de WhatsApp (canSendWhatsApp).');
      return '';
    }
    // Sanitize phone number: strip non-digits
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('503') && cleanPhone.length === 8) {
      cleanPhone = `503${cleanPhone}`;
    }

    let messageText = '';
    const workshop = WORKSHOP_CONFIG.name;

    switch (templateType) {
      case 'cita':
        messageText = `🚗 *${workshop}* 🚗\n\nEstimado/a *${clientName}*,\nTu cita en nuestro taller ha sido confirmada para el día 📅 *${data.date || 'pronto'}* a las ⏰ *${data.time || '08:30'} hrs*.\n\nVehículo: *${data.vehicle || ''}* (Placas: ${data.plate || ''})\nServicio: ${data.service || 'Revisión General'}\n\n📍 Ubicación: ${WORKSHOP_CONFIG.address}\n\n¡Te esperamos puntual! Si requieres reprogramar, respóndenos por este medio.`;
        break;

      case 'presupuesto':
        messageText = `📋 *${workshop}* - Presupuesto Listo\n\nHola *${clientName}*,\nHemos terminado el diagnóstico e inspección de tu vehículo *${data.vehicle || ''}* (${data.plate || ''}).\n\n📄 Presupuesto N°: *${data.quoteNumber || ''}*\n💰 Total Estimado: *$${Number(data.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD*\n\nPuedes autorizarlo respondiendo "AUTORIZO" a este mensaje o consultarnos cualquier duda técnica. ¡Estamos a tus órdenes!`;
        break;

      case 'ot_inicio':
        messageText = `🔧 *${workshop}* - Orden de Trabajo Iniciada\n\nHola *${clientName}*,\nTu vehículo *${data.vehicle || ''}* (${data.plate || ''}) ha ingresado al área de servicio con la orden *${data.otNumber || ''}*.\n\nTécnico a cargo: *${data.technician || 'Técnico Especialista'}*\nFecha estimada de entrega: *${data.estimatedDate || 'Por confirmar'}*\n\nTe mantendremos al tanto de cada avance.`;
        break;

      case 'ot_listo':
        messageText = `✅ *${workshop}* - ¡Tu auto está LISTO!\n\nEstimado/a *${clientName}*,\nNos complace informarte que las reparaciones de tu *${data.vehicle || ''}* (Placas: ${data.plate || ''}) han concluido exitosamente tras superar las pruebas de control de calidad.\n\n📋 Orden: *${data.otNumber || ''}*\n💵 Saldo a Liquidar: *$${Number(data.balanceDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD*\n\nPuedes retirarlo hoy en horario continuo hasta las 19:00 hrs. ¡Gracias por tu confianza!`;
        break;

      case 'mantenimiento':
        messageText = `⚠️ *${workshop}* - Recordatorio de Mantenimiento\n\nHola *${clientName}*,\nDe acuerdo a nuestros registros, tu *${data.vehicle || ''}* (${data.plate || ''}) está próximo a cumplir el kilometraje o fecha para su cambio preventivo de aceite y revisión de frenos.\n\n¿Deseas que te agendemos una cita prioritaria esta semana?`;
        break;

      case 'personalizado':
        messageText = customMessage || `Hola ${clientName}, te escribimos de ${workshop}.`;
        break;
    }

    // Incluir contacto oficial del Jefe de Taller (no del programador)
    messageText += `\n\n👨‍🔧 *Contacto Taller / Jefe de Taller:* ${workshopContact.bossName}\n📞 Tel: ${workshopContact.phone}\n✉️ ${workshopContact.email}`;

    const logEntry: NotificationLog = {
      id: `notif-${Date.now()}`,
      recipientPhone: cleanPhone,
      recipientName: clientName,
      templateType,
      content: messageText,
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'enviado',
    };

    setNotifications(prev => [logEntry, ...prev]);

    // Construct WhatsApp URL
    const encoded = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    // Open WhatsApp in new tab or native app safely
    try {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // In case popup is blocked, clipboard copy fallback
      navigator.clipboard?.writeText(messageText);
    }

    triggerCloudSync();
    return waUrl;
  };

  // Users, Mechanics & Permissions
  const activeTechnicians = users.filter(u => u.isActive).map(u => u.name);

  const login = (identifier: string, passOrPin: string): { success: boolean; message?: string } => {
    const rawId = identifier.trim().toLowerCase();
    const cleanId = rawId.startsWith('@') ? rawId.slice(1) : rawId;
    const cleanPass = passOrPin.trim();

    if (!rawId) {
      return { success: false, message: 'Por favor ingresa tu usuario o correo electrónico.' };
    }
    if (!cleanPass) {
      return { success: false, message: 'Por favor ingresa tu contraseña o PIN.' };
    }

    const found = users.find(
      u => {
        const uName = u.username.toLowerCase();
        const uEmail = u.email.toLowerCase();
        const uFullName = u.name.toLowerCase();
        return (
          uName === cleanId ||
          uName === rawId ||
          `@${uName}` === rawId ||
          uEmail === rawId ||
          uFullName === rawId
        );
      }
    );

    if (!found) {
      return { success: false, message: 'Usuario no encontrado. Verifica tus credenciales.' };
    }

    if (!found.isActive) {
      return { success: false, message: 'Esta cuenta ha sido desactivada temporalmente por el Jefe de Taller.' };
    }

    const pinMatch = Boolean(found.pin && found.pin === cleanPass);
    const passMatch = Boolean(found.password && found.password === cleanPass);

    if (!pinMatch && !passMatch) {
      return { success: false, message: 'PIN o contraseña incorrectos. Intenta nuevamente.' };
    }

    setCurrentUser(found);
    setLogoutReason(null);
    triggerCloudSync();
    return { success: true };
  };

  const loginAsDemo = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setLogoutReason(null);
      triggerCloudSync();
    }
  };

  const logout = (reason?: string) => {
    setCurrentUser(null);
    setLogoutReason(reason || null);
  };

  const clearLogoutReason = () => {
    setLogoutReason(null);
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
    if (!hasPermission('canManageMechanics')) {
      alert('🔒 Acción Bloqueada: Solo el Jefe de Taller o personal autorizado puede registrar mecánicos (canManageMechanics).');
      throw new Error('Unauthorized: canManageMechanics required');
    }
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const nextUsers = [...users, newUser];
    setUsers(nextUsers);
    try {
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(nextUsers));
      localStorage.setItem(`${STORAGE_KEY}_users_modified`, 'true');
    } catch {}

    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: newUser }),
    }).catch(e => console.warn(e));
    sendRealtimeEvent('USER_CREATE', { user: newUser });
    triggerCloudSync();
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    // If updating own profile (e.g. specialty, name, PIN), allow self-update; role/permission changes require canManageMechanics
    const isSelfEdit = currentUser?.id === id && !updates.role && !updates.permissions;
    if (!isSelfEdit && !hasPermission('canManageMechanics')) {
      alert('🔒 Acción Bloqueada: Solo el Jefe de Taller o administradores pueden modificar usuarios (canManageMechanics).');
      return;
    }
    let updatedUser: User | null = null;
    const nextUsers = users.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...updates };
        if (currentUser?.id === id) {
          setCurrentUser(updated);
        }
        updatedUser = updated;
        return updated;
      }
      return u;
    });
    setUsers(nextUsers);
    try {
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(nextUsers));
      localStorage.setItem(`${STORAGE_KEY}_users_modified`, 'true');
    } catch {}

    if (updatedUser) {
      fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: updatedUser }),
      }).catch(e => console.warn(e));
      sendRealtimeEvent('USER_UPDATE', { user: updatedUser });
    }
    triggerCloudSync();
  };

  const deleteUser = (id: string) => {
    if (!hasPermission('canManageMechanics')) {
      alert('🔒 Acción Bloqueada: Tu rol de usuario no tiene permiso para administrar ni eliminar mecánicos (canManageMechanics).');
      return;
    }
    const nextUsers = users.filter(u => u.id !== id);
    setUsers(nextUsers);
    try {
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(nextUsers));
      localStorage.setItem(`${STORAGE_KEY}_users_modified`, 'true');
    } catch {}

    if (currentUser?.id === id) {
      // If current user is deleted, switch back to Boss or null
      const remainingBoss = nextUsers.find(u => u.role === 'boss');
      setCurrentUser(remainingBoss || null);
    }
    fetch('/api/users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(e => console.warn(e));
    sendRealtimeEvent('USER_DELETE', { userId: id });
    triggerCloudSync();
  };

  const updateUserPermissions = (userId: string, permissions: Partial<MechanicPermissions>) => {
    if (!hasPermission('canManageMechanics')) {
      alert('🔒 Acción Bloqueada: Solo el Jefe de Taller o personal autorizado puede modificar permisos (canManageMechanics).');
      return;
    }
    let updatedUser: User | null = null;
    const nextUsers = users.map(u => {
      if (u.id === userId) {
        const updated = {
          ...u,
          permissions: {
            ...u.permissions,
            ...permissions,
          },
        };
        if (currentUser?.id === userId) {
          setCurrentUser(updated);
        }
        updatedUser = updated;
        return updated;
      }
      return u;
    });
    setUsers(nextUsers);
    try {
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(nextUsers));
      localStorage.setItem(`${STORAGE_KEY}_users_modified`, 'true');
    } catch {}

    if (updatedUser) {
      fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: updatedUser }),
      }).catch(e => console.warn(e));
      sendRealtimeEvent('USER_UPDATE', { user: updatedUser });
    }
    triggerCloudSync();
  };

  const hasPermission = (permissionKey: keyof MechanicPermissions): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'boss') return true; // El Jefe tiene todos los permisos activos
    return Boolean(currentUser.permissions?.[permissionKey]);
  };

  // Workshop Contact & Legal Documents Management
  const updateWorkshopContact = (updates: Partial<WorkshopContact>) => {
    if (!hasPermission('canManageMechanics')) {
      alert('🔒 Acción Bloqueada: Solo el Jefe de Taller o personal autorizado puede modificar los datos del taller.');
      return;
    }
    setWorkshopContact(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(`${STORAGE_KEY}_workshop_contact`, JSON.stringify(next));
      } catch {}
      fetch('/api/workshop-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workshopContact: next }),
      }).catch(err => console.warn('[WorkshopContact] Error saving to server:', err));
      sendRealtimeEvent('WORKSHOP_CONTACT_UPDATED', { workshopContact: next });
      return next;
    });
    triggerCloudSync();
  };

  const addLegalDocument = (doc: Omit<WorkshopLegalDocument, 'id'>) => {
    const newDoc: WorkshopLegalDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
    };
    const nextDocs = [newDoc, ...(workshopContact.legalDocuments || [])];
    updateWorkshopContact({ legalDocuments: nextDocs });
  };

  const updateLegalDocument = (id: string, updates: Partial<WorkshopLegalDocument>) => {
    const nextDocs = (workshopContact.legalDocuments || []).map(d =>
      d.id === id ? { ...d, ...updates } : d
    );
    updateWorkshopContact({ legalDocuments: nextDocs });
  };

  const deleteLegalDocument = (id: string) => {
    const nextDocs = (workshopContact.legalDocuments || []).filter(d => d.id !== id);
    updateWorkshopContact({ legalDocuments: nextDocs });
  };

  // Backup & Restore
  const exportBackupData = () => {
    const backup = {
      workshop: workshopContact || WORKSHOP_CONFIG,
      workshopContact,
      exportedAt: new Date().toISOString(),
      users,
      clients,
      parts,
      appointments,
      budgets,
      workOrders,
      notifications,
      mechanicNotifications,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taller_rodriguez_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackupData = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.users && Array.isArray(data.users)) setUsers(data.users);
      if (data.clients && Array.isArray(data.clients)) setClients(data.clients);
      if (data.parts && Array.isArray(data.parts)) setParts(data.parts);
      if (data.appointments && Array.isArray(data.appointments)) setAppointments(data.appointments);
      if (data.budgets && Array.isArray(data.budgets)) setBudgets(data.budgets);
      if (data.workOrders && Array.isArray(data.workOrders)) setWorkOrders(data.workOrders);
      if (data.notifications && Array.isArray(data.notifications)) setNotifications(data.notifications);
      if (data.mechanicNotifications && Array.isArray(data.mechanicNotifications)) setMechanicNotifications(data.mechanicNotifications);
      if (data.workshopContact) setWorkshopContact(data.workshopContact);

      // Persist directly to backend database on server / Render
      fetch('/api/database/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(err => {
        console.warn('Could not post restore to /api/database/restore', err);
      });

      triggerCloudSync();
      return true;
    } catch (e) {
      console.error('Error importing backup', e);
      return false;
    }
  };

  const resetToSampleData = () => {
    resetToCleanData();
  };

  const resetToCleanData = async () => {
    try {
      await fetch('/api/reset-clean', { method: 'POST' });
    } catch (e) {
      console.error('Error resetting database via API', e);
    }
    setClients([]);
    setParts([]);
    setAppointments([]);
    setBudgets([]);
    setWorkOrders([]);
    setNotifications([]);
    setMechanicNotifications([]);
    // Do not touch users - preserve credentials
    triggerCloudSync();
  };

  const lowStockParts = parts.filter(p => p.stockQuantity <= p.minStockAlert);

  return (
    <WorkshopContext.Provider
      value={{
        users,
        currentUser,
        logoutReason,
        clearLogoutReason,
        activeTechnicians,
        login,
        loginAsDemo,
        logout,
        addUser,
        updateUser,
        deleteUser,
        updateUserPermissions,
        hasPermission,
        clients,
        parts,
        appointments,
        budgets,
        workOrders,
        notifications,
        mechanicNotifications,
        unreadNotificationsCount,
        markNotificationsAsRead,
        syncStatus,
        lastSyncedAt,
        triggerCloudSync,
        isDbReady,
        connectedClients,
        isRealtimeConnected,
        activeAlertToast,
        dismissAlertToast,
        reassignWorkOrder,
        addClient,
        updateClient,
        deleteClient,
        addPart,
        updatePart,
        deletePart,
        adjustPartStock,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        createBudget,
        updateBudget,
        deleteBudget,
        convertBudgetToWorkOrder,
        createWorkOrder,
        updateWorkOrder,
        updateWorkOrderStage,
        deleteWorkOrder,
        sendWhatsAppNotification,
        workshopContact,
        updateWorkshopContact,
        addLegalDocument,
        updateLegalDocument,
        deleteLegalDocument,
        exportBackupData,
        importBackupData,
        resetToSampleData,
        resetToCleanData,
        lowStockParts,
      }}
    >
      {children}
    </WorkshopContext.Provider>
  );
};

export const useWorkshop = () => {
  const context = useContext(WorkshopContext);
  if (!context) {
    throw new Error('useWorkshop must be used within a WorkshopProvider');
  }
  return context;
};
