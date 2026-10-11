import { Client, Part, Appointment, Budget, WorkOrder, NotificationLog, User, MechanicAssignmentNotification, WorkshopContact } from '../types';

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

export const WORKSHOP_CONFIG: WorkshopContact & {
  developer: string;
  currency: string;
  currencySymbol: string;
  defaultLaborRate: number;
  defaultTaxPercent: number;
  technicians: string[];
} = {
  name: 'TALLER RODRIGUEZ RODRIGUEZ',
  legalName: 'Taller Automotriz Rodríguez Rodríguez S.A. de C.V.',
  tagline: 'Mecánica Especializada · Diagnóstico Computarizado · Frenos & Motores',
  address: 'Final 4ª Calle Poniente, Barrio El Calvario, Usulután',
  city: 'Usulután',
  country: 'El Salvador',
  developer: 'VlaSwink51',
  bossName: 'Edwin Rodríguez',
  phone: '+503 6427-2531',
  whatsappNumber: '50364272531',
  email: 'edwinrodriguez@taller-rodriguez.com',
  taxId: 'NIT: 0614-141098-102-1',
  taxNRC: 'NRC: 298104-5',
  businessActivity: 'Mantenimiento preventivo y correctivo de vehículos automotores, electromecánica y repuestos',
  commercialRegistry: 'Matrícula Mercantil N° 2024098712 · Libro 45 de Sociedades',
  municipalLicense: 'Licencia Municipal de Operación Alcaldía de Usulután N° ALC-USU-2026-089',
  insurancePolicy: 'Póliza de Responsabilidad Civil Talleres SISA N° RC-9821034-A',
  warrantyTerms: 'Garantía por escrito de 6 meses o 10,000 km en mano de obra y repuestos originales instalados.',
  legalDocuments: [
    {
      id: 'doc-nit-01',
      name: 'Tarjeta de Identificación Tributaria (NIT Empresarial)',
      documentNumber: 'NIT: 0614-141098-102-1',
      issuer: 'Ministerio de Hacienda de El Salvador',
      issueDate: '2024-01-10',
      status: 'vigente',
      notes: 'Registro tributario oficial activo para emisión de facturación y cotizaciones.',
    },
    {
      id: 'doc-nrc-02',
      name: 'Registro de Contribuyente IVA (NRC)',
      documentNumber: 'NRC: 298104-5',
      issuer: 'Dirección General de Impuestos Internos (DGII)',
      issueDate: '2024-01-15',
      status: 'vigente',
      notes: 'Habilitado legalmente para créditos fiscales y facturas comerciales.',
    },
    {
      id: 'doc-lic-03',
      name: 'Licencia Municipal de Funcionamiento y Apertura',
      documentNumber: 'ALC-USU-2026-089',
      issuer: 'Alcaldía Municipal de Usulután',
      issueDate: '2026-01-05',
      expiryDate: '2027-01-05',
      status: 'vigente',
      notes: 'Permiso municipal de zonificación y operación para taller electromecánico automotriz.',
    },
    {
      id: 'doc-seg-04',
      name: 'Póliza de Seguro de Responsabilidad Civil de Talleres',
      documentNumber: 'SISA RC-9821034-A',
      issuer: 'Seguros e Inversiones S.A. (SISA)',
      issueDate: '2026-01-01',
      expiryDate: '2027-01-01',
      status: 'vigente',
      notes: 'Cobertura integral para vehículos en custodia y daños a terceros dentro de las instalaciones.',
    },
  ],
  currency: 'USD',
  currencySymbol: '$',
  defaultLaborRate: 35, // USD precio base de mano de obra total fija (sin cobro por hora)
  defaultTaxPercent: 0,
  technicians: [
    'Edwin Rodríguez (Jefe de Taller)',
  ],
};
