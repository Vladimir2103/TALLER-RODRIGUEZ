import { Client, Part, Appointment, Budget, WorkOrder, NotificationLog, User, MechanicAssignmentNotification } from '../types';

// Tablas operativas limpias para ingreso desde cero por el usuario
export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_PARTS: Part[] = [];
export const INITIAL_APPOINTMENTS: Appointment[] = [];
export const INITIAL_BUDGETS: Budget[] = [];
export const INITIAL_WORK_ORDERS: WorkOrder[] = [];
export const INITIAL_NOTIFICATIONS: NotificationLog[] = [];
export const INITIAL_MECHANIC_NOTIFICATIONS: MechanicAssignmentNotification[] = [];

// Plantilla de usuario inicial: Únicamente acceso de Administrador / Programador VlaSwink51
export const INITIAL_USERS: User[] = [
  {
    id: 'usr-vlaswink51-admin',
    username: 'vlaswink51',
    name: 'VlaSwink51 (Programador & Administrador)',
    email: 'blaswink@gmail.com',
    phone: '+503 7000 0000',
    role: 'boss',
    specialty: 'Programador / Control Total del Taller',
    password: '503lopezl',
    pin: '5031',
    avatarColor: 'bg-red-600',
    isActive: true,
    createdAt: '2026-01-01',
    permissions: {
      canManageAppointments: true,
      canManageWorkOrders: true,
      canManageBudgets: true,
      canManageInventory: true,
      canManageClients: true,
      canViewFinancialReports: true,
      canManageMechanics: true,
      canSendWhatsApp: true,
      canDeleteRecords: true,
    },
    notes: 'Programador y Administrador del Sistema. Control total operativo, técnico y administrativo.',
  },
];

export const WORKSHOP_CONFIG = {
  name: 'TALLER RODRIGUEZ RODRIGUEZ',
  legalName: 'Taller Automotriz Rodríguez Rodríguez S.A. de C.V.',
  tagline: 'Mecánica Especializada · Diagnóstico Computarizado · Frenos & Motores',
  address: 'El Salvador, Usulután',
  city: 'Usulután',
  country: 'El Salvador',
  developer: 'VlaSwink51',
  bossName: 'Edwin Rodríguez',
  phone: '+503 6427-2531',
  whatsappNumber: '50364272531',
  email: 'edwinrodriguez@taller-rodriguez.com',
  taxId: 'NIT: 0614-141098-102-1',
  taxNRC: 'NRC: 298104-5',
  currency: 'USD',
  currencySymbol: '$',
  defaultLaborRate: 35, // USD precio base de mano de obra total fija (sin cobro por hora)
  defaultTaxPercent: 0,
  technicians: [
    'Edwin Rodríguez (Jefe de Taller)',
  ],
};
