export type AppointmentStatus = 'pendiente' | 'confirmada' | 'en_taller' | 'completada' | 'cancelada';

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleYear: number;
  serviceRequested: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  assignedTechnician: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface Vehicle {
  plate: string;
  brand: string;
  model: string;
  year: number;
  vin?: string;
  color: string;
  mileage: number;
  fuelType: 'Gasolina' | 'Diésel' | 'Híbrido' | 'Eléctrico' | 'Gas LP';
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  identification?: string; // DUI / NIT (El Salvador)
  vehicles: Vehicle[];
  notes?: string;
  totalSpent: number;
  createdAt: string;
}

export type PartCategory =
  | 'Frenos'
  | 'Motor'
  | 'Suspensión y Dirección'
  | 'Filtros y Lubricantes'
  | 'Transmisión'
  | 'Eléctrico e Iluminación'
  | 'Refrigeración'
  | 'Neumáticos'
  | 'Accesorios y Varios';

export interface Part {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: PartCategory;
  stockQuantity: number;
  minStockAlert: number;
  unitCost: number;
  salePrice: number;
  location: string; // Estante A-3, Pasillo 2
  compatibleVehicles?: string;
  supplier?: string;
}

export interface BudgetItem {
  id: string;
  type: 'repuesto' | 'mano_de_obra';
  partId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type BudgetStatus = 'borrador' | 'enviado' | 'aprobado' | 'rechazado' | 'convertido_a_ot';

export interface Budget {
  id: string;
  quoteNumber: string; // COT-2026-001
  clientId: string;
  clientName: string;
  clientPhone: string;
  vehiclePlate: string;
  vehicleModel: string;
  date: string;
  expiryDate: string;
  status: BudgetStatus;
  items: BudgetItem[];
  subtotal: number;
  taxPercent: number; // e.g. 16
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
  convertedToWorkOrderId?: string;
  createdAt: string;
}

export type WorkOrderStage =
  | 'recepcion'
  | 'diagnostico'
  | 'espera_repuestos'
  | 'en_reparacion'
  | 'control_calidad'
  | 'listo_entrega'
  | 'entregado';

export type WorkOrderPriority = 'normal' | 'alta' | 'urgente';

export interface WorkOrderPart {
  partId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface WorkOrder {
  id: string;
  otNumber: string; // OT-2026-001
  quoteId?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  mileageIn: number;
  mileageOut?: number;
  fuelLevel: '1/4' | '1/2' | '3/4' | 'Lleno' | 'Reserva';
  damagesInspectionNotes?: string;
  reportedFault: string;
  diagnosedProblem?: string;
  stage: WorkOrderStage;
  priority: WorkOrderPriority;
  assignedTechnician: string;
  startDate: string;
  estimatedCompletionDate: string;
  completedDate?: string;
  partsUsed: WorkOrderPart[];
  laborHours?: number;
  laborRatePerHour?: number;
  laborTotal: number;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentStatus: 'pendiente' | 'anticipo' | 'pagado';
  amountPaid: number;
  technicianNotes?: string;
  customerSignatureReceived: boolean;
  customerSignatureName?: string;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  recipientPhone: string;
  recipientName: string;
  templateType: 'cita' | 'presupuesto' | 'ot_inicio' | 'ot_listo' | 'mantenimiento' | 'personalizado';
  content: string;
  sentAt: string;
  status: 'enviado' | 'simulado';
}

export type UserRole = 'boss' | 'mechanic';

export interface MechanicPermissions {
  canManageAppointments: boolean;   // Agendar, editar y cancelar citas
  canManageWorkOrders: boolean;     // Crear OTs, diagnósticos, piezas usadas, cambiar etapas
  canManageBudgets: boolean;        // Crear y editar presupuestos y cotizaciones
  canManageInventory: boolean;      // Crear repuestos, editar existencias, costos y precios
  canManageClients: boolean;        // Crear, editar y dar de baja clientes y vehículos
  canViewFinancialReports: boolean; // Ver ingresos brutos, utilidades y balance de caja en dashboard
  canManageMechanics: boolean;      // Crear mecánicos y asignar/modificar permisos (solo jefe o autorizado)
  canSendWhatsApp: boolean;         // Enviar mensajes oficiales por WhatsApp al cliente
  canDeleteRecords: boolean;        // Eliminar órdenes, citas, presupuestos, clientes
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole; // 'boss' | 'mechanic'
  specialty: string;
  password?: string;
  pin: string; // 4-digit PIN for quick login on tablet
  avatarColor: string;
  isActive: boolean;
  createdAt: string;
  permissions: MechanicPermissions;
  notes?: string;
}

export interface MechanicAssignmentNotification {
  id: string;
  technicianName: string; // El mecánico que recibe la asignación
  technicianId?: string;
  otId: string;
  otNumber: string;
  clientName: string;
  vehiclePlate: string;
  vehicleModel: string;
  reportedFault: string;
  priority: WorkOrderPriority;
  assignedBy: string; // e.g. "VlaSwink51 (Administrador)"
  createdAt: string;
  read: boolean;
}

export interface WorkshopContact {
  name: string;
  legalName: string;
  bossName: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  address: string;
  taxId: string;
  taxNRC: string;
}


