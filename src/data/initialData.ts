import { Client, Part, Appointment, Budget, WorkOrder, NotificationLog, User, MechanicAssignmentNotification } from '../types';

// Tablas operativas limpias para ingreso desde cero por el usuario
export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_PARTS: Part[] = [];
export const INITIAL_APPOINTMENTS: Appointment[] = [];
export const INITIAL_BUDGETS: Budget[] = [];
export const INITIAL_WORK_ORDERS: WorkOrder[] = [];
export const INITIAL_NOTIFICATIONS: NotificationLog[] = [];
export const INITIAL_MECHANIC_NOTIFICATIONS: MechanicAssignmentNotification[] = [];

// Plantilla de mecánicos preservada para inicio de sesión y asignación
export const INITIAL_USERS: User[] = [
  {
    id: 'usr-boss-01',
    username: 'carlos.jefe',
    name: 'Carlos Rodríguez',
    email: 'carlos@taller-rodriguez.mx',
    phone: '+52 55 5678 9012',
    role: 'boss',
    specialty: 'Jefe de Taller & Diagnóstico Máster',
    password: 'admin',
    pin: '1234',
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
    notes: 'Propietario y Jefe de Taller. Control total administrativo y operativo.',
  },
  {
    id: 'usr-mech-02',
    username: 'miguel.rodriguez',
    name: 'Miguel Rodríguez',
    email: 'miguel@taller-rodriguez.mx',
    phone: '+52 55 7890 1234',
    role: 'mechanic',
    specialty: 'Mecánico Senior - Motor & Transmisión',
    password: 'mecanico123',
    pin: '2345',
    avatarColor: 'bg-blue-600',
    isActive: true,
    createdAt: '2026-01-10',
    permissions: {
      canManageAppointments: true,
      canManageWorkOrders: true,
      canManageBudgets: true,
      canManageInventory: false,
      canManageClients: true,
      canViewFinancialReports: false,
      canManageMechanics: false,
      canSendWhatsApp: true,
      canDeleteRecords: false,
    },
    notes: 'Mecánico de confianza. Puede cotizar, atender clientes y gestionar OTs completas.',
  },
  {
    id: 'usr-mech-03',
    username: 'andres.mendez',
    name: 'Andrés Méndez',
    email: 'andres@taller-rodriguez.mx',
    phone: '+52 55 8901 2345',
    role: 'mechanic',
    specialty: 'Especialista Eléctrico & Diagnóstico Scanner OBD2',
    password: 'mecanico123',
    pin: '3456',
    avatarColor: 'bg-amber-600',
    isActive: true,
    createdAt: '2026-02-01',
    permissions: {
      canManageAppointments: true,
      canManageWorkOrders: true,
      canManageBudgets: false,
      canManageInventory: false,
      canManageClients: false,
      canViewFinancialReports: false,
      canManageMechanics: false,
      canSendWhatsApp: false,
      canDeleteRecords: false,
    },
    notes: 'Técnico especialista en fallas electrónicas, sensores y cableado.',
  },
  {
    id: 'usr-mech-04',
    username: 'roberto.silva',
    name: 'Roberto Silva',
    email: 'roberto.silva@taller-rodriguez.mx',
    phone: '+52 55 9012 3456',
    role: 'mechanic',
    specialty: 'Frenos ABS, Dirección & Suspensión Hidráulica',
    password: 'mecanico123',
    pin: '4567',
    avatarColor: 'bg-emerald-600',
    isActive: true,
    createdAt: '2026-02-15',
    permissions: {
      canManageAppointments: true,
      canManageWorkOrders: true,
      canManageBudgets: false,
      canManageInventory: false,
      canManageClients: false,
      canViewFinancialReports: false,
      canManageMechanics: false,
      canSendWhatsApp: false,
      canDeleteRecords: false,
    },
    notes: 'Especialista en tren delantero, amortiguadores y alineación.',
  },
];

export const WORKSHOP_CONFIG = {
  name: 'TALLER RODRIGUEZ RODRIGUEZ',
  legalName: 'Taller Automotriz Rodríguez Rodríguez LLC',
  tagline: 'Mecánica Especializada · Diagnóstico Computarizado · Frenos & Motores',
  address: 'Calzada de Tlalpan 2840, Col. Espartaco, Coyoacán, CDMX',
  phone: '+52 55 5678 9012',
  whatsappNumber: '525556789012',
  email: 'contacto@taller-rodriguez.mx',
  taxId: 'TRM981014-R78',
  currency: 'USD',
  currencySymbol: '$',
  defaultLaborRate: 55, // USD per hour
  defaultTaxPercent: 16,
  technicians: [
    'Carlos Rodríguez (Jefe de Taller)',
    'Miguel Rodríguez (Mecánico Senior)',
    'Andrés Méndez (Especialista Eléctrico & Diagnóstico)',
    'Roberto Silva (Frenos & Suspensión)',
  ],
};
