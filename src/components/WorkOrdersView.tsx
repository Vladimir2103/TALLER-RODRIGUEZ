import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { WorkOrder, WorkOrderStage, WorkOrderPriority, WorkOrderPart } from '../types';
import {
  Wrench,
  Plus,
  Search,
  Printer,
  MessageSquare,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Edit2,
  X,
  Gauge,
  Fuel,
  UserCheck,
  ChevronRight,
  Filter,
  DollarSign,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/initialData';
import { Logo } from './Logo';
import { formatCurrency, formatUSD } from '../utils/format';
import { AssignMechanicModal } from './AssignMechanicModal';
import confetti from 'canvas-confetti';

interface WorkOrdersViewProps {
  onOpenWhatsApp: (phone: string, clientName: string, template: any, data: any) => void;
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
  prefilledAppointment?: any;
}

const STAGES: { id: WorkOrderStage; label: string; color: string }[] = [
  { id: 'recepcion', label: '1. Recepción', color: 'border-neutral-700 bg-neutral-900/60' },
  { id: 'diagnostico', label: '2. Diagnóstico', color: 'border-amber-500/40 bg-amber-950/10' },
  { id: 'espera_repuestos', label: '3. Espera Repuestos', color: 'border-orange-500/40 bg-orange-950/10' },
  { id: 'en_reparacion', label: '4. En Reparación', color: 'border-blue-500/40 bg-blue-950/10' },
  { id: 'control_calidad', label: '5. Control de Calidad', color: 'border-purple-500/40 bg-purple-950/10' },
  { id: 'listo_entrega', label: '6. Listo para Entrega', color: 'border-emerald-500/40 bg-emerald-950/10' },
  { id: 'entregado', label: '7. Entregado', color: 'border-neutral-800 bg-neutral-950' },
];

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  onOpenWhatsApp,
  isCreateModalOpen = false,
  onCloseCreateModal,
  prefilledAppointment,
}) => {
  const {
    workOrders,
    createWorkOrder,
    updateWorkOrder,
    updateWorkOrderStage,
    deleteWorkOrder,
    clients,
    parts,
    activeTechnicians,
    hasPermission,
    currentUser,
  } = useWorkshop();

  const canManageWorkOrders = hasPermission('canManageWorkOrders');
  const canDelete = hasPermission('canDeleteRecords');
  const techList = activeTechnicians.length > 0 ? activeTechnicians : WORKSHOP_CONFIG.technicians;

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(isCreateModalOpen || Boolean(prefilledAppointment));
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<WorkOrder | null>(null);
  const [orderForAssign, setOrderForAssign] = useState<WorkOrder | null>(null);

  // Form state
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState(prefilledAppointment?.clientName || '');
  const [clientPhone, setClientPhone] = useState(prefilledAppointment?.clientPhone || '');
  const [clientEmail, setClientEmail] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState(prefilledAppointment?.vehiclePlate || '');
  const [vehicleBrand, setVehicleBrand] = useState('Honda');
  const [vehicleModel, setVehicleModel] = useState(prefilledAppointment?.vehicleModel || 'Civic Si');
  const [vehicleYear, setVehicleYear] = useState<number>(prefilledAppointment?.vehicleYear || 2021);
  const [mileageIn, setMileageIn] = useState<number>(55000);
  const [fuelLevel, setFuelLevel] = useState<'1/4' | '1/2' | '3/4' | 'Lleno' | 'Reserva'>('1/2');
  const [damagesInspectionNotes, setDamagesInspectionNotes] = useState('Sin golpes mayores, interiores limpios.');
  const [reportedFault, setReportedFault] = useState(prefilledAppointment?.serviceRequested || '');
  const [diagnosedProblem, setDiagnosedProblem] = useState('');
  const [stage, setStage] = useState<WorkOrderStage>('recepcion');
  const [priority, setPriority] = useState<WorkOrderPriority>('normal');
  const [assignedTechnician, setAssignedTechnician] = useState(
    prefilledAppointment?.assignedTechnician || techList[0]
  );
  const [laborHours, setLaborHours] = useState<number>(2.5);
  const [laborRatePerHour, setLaborRatePerHour] = useState<number>(WORKSHOP_CONFIG.defaultLaborRate);
  const [paymentStatus, setPaymentStatus] = useState<'pendiente' | 'anticipo' | 'pagado'>('pendiente');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [customerSignatureName, setCustomerSignatureName] = useState(prefilledAppointment?.clientName || '');
  const [partsUsed, setPartsUsed] = useState<WorkOrderPart[]>([]);

  // Client Selection
  const handleSelectClient = (id: string) => {
    setClientId(id);
    const found = clients.find(c => c.id === id);
    if (found) {
      setClientName(found.name);
      setClientPhone(found.phone);
      setClientEmail(found.email);
      setCustomerSignatureName(found.name);
      if (found.vehicles && found.vehicles.length > 0) {
        const v = found.vehicles[0];
        setVehiclePlate(v.plate);
        setVehicleBrand(v.brand);
        setVehicleModel(v.model);
        setVehicleYear(v.year);
        setMileageIn(v.mileage || 50000);
      }
    }
  };

  // Add Part line
  const handleAddPart = () => {
    const firstPart = parts[0];
    setPartsUsed(prev => [
      ...prev,
      {
        partId: firstPart ? firstPart.id : `custom-${Date.now()}`,
        sku: firstPart ? firstPart.sku : 'GEN',
        name: firstPart ? firstPart.name : 'Repuesto / Refacción',
        quantity: 1,
        unitPrice: firstPart ? firstPart.salePrice : 0,
        total: firstPart ? firstPart.salePrice : 0,
      },
    ]);
  };

  const handleUpdatePart = (index: number, updates: Partial<WorkOrderPart>) => {
    setPartsUsed(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const merged = { ...item, ...updates };
        merged.total = Number(merged.quantity) * Number(merged.unitPrice);
        return merged;
      })
    );
  };

  const handleSelectInventoryPart = (index: number, partId: string) => {
    const p = parts.find(part => part.id === partId);
    if (!p) return;
    handleUpdatePart(index, {
      partId: p.id,
      sku: p.sku,
      name: `${p.name} (${p.brand})`,
      unitPrice: p.salePrice,
      total: p.salePrice * (partsUsed[index]?.quantity || 1),
    });
  };

  const handleRemovePart = (index: number) => {
    setPartsUsed(prev => prev.filter((_, i) => i !== index));
  };

  // Form Save
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !vehiclePlate) {
      alert('Por favor completa el nombre del cliente y placas del vehículo.');
      return;
    }

    const newOT = createWorkOrder({
      clientId: clientId || `cli-temp-${Date.now()}`,
      clientName,
      clientPhone,
      clientEmail,
      vehiclePlate,
      vehicleBrand,
      vehicleModel,
      vehicleYear,
      mileageIn,
      fuelLevel,
      damagesInspectionNotes,
      reportedFault: reportedFault || 'Revisión y mantenimiento general',
      diagnosedProblem,
      stage,
      priority,
      assignedTechnician,
      startDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString().replace('T', ' ').slice(0, 16),
      partsUsed,
      laborHours,
      laborRatePerHour,
      taxPercent: 0,
      discountAmount: 0,
      paymentStatus,
      amountPaid: Number(amountPaid),
      technicianNotes,
      customerSignatureReceived: true,
      customerSignatureName: customerSignatureName || clientName,
    });

    confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
    setIsModalOpen(false);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  const filteredOrders = workOrders.filter(o => {
    const matchesSearch =
      o.otNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.clientName.toLowerCase().includes(search.toLowerCase()) ||
      o.vehiclePlate.toLowerCase().includes(search.toLowerCase()) ||
      o.vehicleModel.toLowerCase().includes(search.toLowerCase()) ||
      o.assignedTechnician.toLowerCase().includes(search.toLowerCase());

    const matchesStage = selectedStageFilter === 'all' || o.stage === selectedStageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-red-500" />
            <span>Órdenes de Trabajo (OT)</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Seguimiento de etapas de reparación, inspección inicial, repuestos y cobro
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Tablero Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Lista Detallada
            </button>
          </div>

          <button
            onClick={() => {
              setPartsUsed([]);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-950"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden de Trabajo</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por N° OT, cliente, placas, auto o mecánico..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Filter by stage */}
        <select
          value={selectedStageFilter}
          onChange={e => setSelectedStageFilter(e.target.value)}
          className="px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-red-500"
        >
          <option value="all">Todas las etapas ({workOrders.length})</option>
          {STAGES.map(s => (
            <option key={s.id} value={s.id}>
              {s.label} ({workOrders.filter(o => o.stage === s.id).length})
            </option>
          ))}
        </select>
      </div>

      {/* View: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {STAGES.filter(s => selectedStageFilter === 'all' || s.id === selectedStageFilter).map(col => {
            const colOrders = filteredOrders.filter(o => o.stage === col.id);

            return (
              <div
                key={col.id}
                className={`rounded-xl border ${col.color} p-3 flex flex-col gap-3 min-h-[300px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="text-xs font-bold text-white tracking-wide">{col.label}</span>
                  <span className="font-mono text-xs text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded-full border border-neutral-800">
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards in Column */}
                <div className="space-y-3">
                  {colOrders.length === 0 ? (
                    <div className="py-6 text-center text-[11px] text-neutral-500 italic">
                      Sin vehículos en esta etapa
                    </div>
                  ) : (
                    colOrders.map(order => (
                      <div
                        key={order.id}
                        className="p-3.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl space-y-2.5 transition-all shadow-xs"
                      >
                        {/* Top: OT & Priority */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-red-400">{order.otNumber}</span>
                          <span
                            className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                              order.priority === 'urgente'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : order.priority === 'alta'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            {order.priority}
                          </span>
                        </div>

                        {/* Vehicle & Plate */}
                        <div>
                          <div className="font-bold text-white text-xs">
                            {order.vehicleBrand} {order.vehicleModel}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
                            <span className="font-mono bg-neutral-950 px-1 rounded border border-neutral-800">
                              {order.vehiclePlate}
                            </span>
                            <span>·</span>
                            <span>{order.clientName}</span>
                          </div>
                        </div>

                        {/* Problem info */}
                        <p className="text-[11px] text-neutral-300 line-clamp-2">
                          <strong className="text-neutral-400">Falla:</strong> {order.reportedFault}
                        </p>

                        {/* Technician & Amount */}
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800/60">
                          <button
                            type="button"
                            onClick={() => setOrderForAssign(order)}
                            className="flex items-center gap-1.5 min-w-0 max-w-[145px] hover:text-white group/tech cursor-pointer text-left"
                            title="Haz clic para reasignar mecánico (notificación en tiempo real)"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 group-hover/tech:text-red-400 transition-colors" />
                            <span className="truncate font-medium text-neutral-300 group-hover/tech:underline">
                              {order.assignedTechnician.split(' ')[0]} {order.assignedTechnician.split(' ')[1] || ''}
                            </span>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono font-bold text-emerald-400 tabular-nums">
                              {formatCurrency(order.total)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setOrderForAssign(order)}
                              className="px-1.5 py-0.5 rounded bg-neutral-950 hover:bg-neutral-800 text-[10px] text-red-400 hover:text-red-300 border border-neutral-800 cursor-pointer font-medium"
                              title="Asignar mecánico a esta orden"
                            >
                              Asignar
                            </button>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between pt-1 gap-1.5">
                          <button
                            onClick={() => setSelectedOrderForPrint(order)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                            title="Ver e Imprimir Orden de Trabajo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              onOpenWhatsApp(
                                order.clientPhone,
                                order.clientName,
                                order.stage === 'listo_entrega' ? 'ot_listo' : 'ot_inicio',
                                {
                                  vehicle: `${order.vehicleBrand} ${order.vehicleModel}`,
                                  plate: order.vehiclePlate,
                                  otNumber: order.otNumber,
                                  technician: order.assignedTechnician,
                                  estimatedDate: order.estimatedCompletionDate,
                                  balanceDue: order.total - order.amountPaid,
                                }
                              )
                            }
                            className="px-2 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="Notificar por WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Advance stage dropdown */}
                          <select
                            value={order.stage}
                            onChange={e => updateWorkOrderStage(order.id, e.target.value as WorkOrderStage)}
                            className="text-[10px] px-1.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-neutral-300 focus:outline-none cursor-pointer"
                          >
                            {STAGES.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* View: DETAILED TABLE LIST */
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase font-mono text-[11px]">
                  <th className="py-3 px-4 font-semibold">OT / Fecha</th>
                  <th className="py-3 px-4 font-semibold">Vehículo & Placas</th>
                  <th className="py-3 px-4 font-semibold">Cliente</th>
                  <th className="py-3 px-4 font-semibold">Etapa de Reparación</th>
                  <th className="py-3 px-4 font-semibold">Técnico</th>
                  <th className="py-3 px-4 font-semibold text-right">Total / Pago</th>
                  <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      No se encontraron órdenes de trabajo activas.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-neutral-850/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-white font-bold block">{order.otNumber}</span>
                        <span className="text-neutral-400 text-[11px]">{order.startDate.split(' ')[0]}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-white font-semibold block">
                          {order.vehicleBrand} {order.vehicleModel} ({order.vehicleYear})
                        </span>
                        <span className="font-mono text-neutral-400 text-[11px] bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 inline-block mt-0.5">
                          {order.vehiclePlate}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-white font-medium block">{order.clientName}</span>
                        <span className="font-mono text-neutral-400 text-[11px]">{order.clientPhone}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={order.stage}
                          onChange={e => updateWorkOrderStage(order.id, e.target.value as WorkOrderStage)}
                          className="px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none cursor-pointer"
                        >
                          {STAGES.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-neutral-300">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="truncate font-medium">{order.assignedTechnician}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOrderForAssign(order)}
                            className="px-2 py-0.5 rounded bg-neutral-950 hover:bg-neutral-800 text-[10px] text-red-400 hover:text-red-300 border border-neutral-800 cursor-pointer font-medium shrink-0 transition-colors"
                            title="Reasignar mecánico responsable"
                          >
                            Reasignar
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        <span className="text-emerald-400 font-bold block">
                          {formatCurrency(order.total)}
                        </span>
                        <span
                          className={`text-[10px] font-medium uppercase ${
                            order.paymentStatus === 'pagado'
                              ? 'text-emerald-400'
                              : order.paymentStatus === 'anticipo'
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrderForPrint(order)}
                            className="p-1.5 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                            title="Ver e imprimir"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              onOpenWhatsApp(
                                order.clientPhone,
                                order.clientName,
                                order.stage === 'listo_entrega' ? 'ot_listo' : 'ot_inicio',
                                {
                                  vehicle: `${order.vehicleBrand} ${order.vehicleModel}`,
                                  plate: order.vehiclePlate,
                                  otNumber: order.otNumber,
                                  technician: order.assignedTechnician,
                                  balanceDue: order.total - order.amountPaid,
                                }
                              )
                            }
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded transition-colors cursor-pointer"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar orden ${order.otNumber}?`)) {
                                deleteWorkOrder(order.id);
                              }
                            }}
                            className="p-1.5 text-neutral-500 hover:text-red-400 rounded cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Nueva Orden de Trabajo con Inspección de Recepción */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/70">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-red-500" />
                  <span>Apertura de Orden de Trabajo (OT)</span>
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Recepción de vehículo, inspección de kilometraje, combustible y asignación
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Select Client */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Cliente Registrado (Opcional)
                </label>
                <select
                  onChange={e => handleSelectClient(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-red-500"
                >
                  <option value="">-- Seleccionar cliente existente o llenar manual abajo --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - {c.vehicles[0]?.brand} {c.vehicles[0]?.model} [{c.vehicles[0]?.plate}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre del Cliente *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ej. Roberto Gómez"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">WhatsApp / Celular *</label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="+503 7000-0000"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Vehicle Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={vehicleBrand}
                    onChange={e => setVehicleBrand(e.target.value)}
                    placeholder="Honda, Toyota, Nissan..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Modelo y Año</label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={e => setVehicleModel(e.target.value)}
                    placeholder="Civic 2022"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Placas (El Salvador) *</label>
                  <input
                    type="text"
                    required
                    value={vehiclePlate}
                    onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="P 123-456"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Vehicle Reception Inspection Box */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  <span>Inspección de Recepción del Vehículo</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Kilometraje de Entrada (km)</label>
                    <input
                      type="number"
                      min="0"
                      value={mileageIn}
                      onChange={e => setMileageIn(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Nivel de Combustible</label>
                    <select
                      value={fuelLevel}
                      onChange={e => setFuelLevel(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none"
                    >
                      <option value="Reserva">Reserva</option>
                      <option value="1/4">1/4 Tanque</option>
                      <option value="1/2">1/2 Tanque</option>
                      <option value="3/4">3/4 Tanque</option>
                      <option value="Lleno">Tanque Lleno</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Checklist de Daños Preexistentes / Pertenencias
                  </label>
                  <input
                    type="text"
                    value={damagesInspectionNotes}
                    onChange={e => setDamagesInspectionNotes(e.target.value)}
                    placeholder="Rayón en facia trasera, tapones completos, radio funcionando..."
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Reported & Diagnosed Problem */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Falla Reportada por el Cliente *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={reportedFault}
                    onChange={e => setReportedFault(e.target.value)}
                    placeholder="Ruido al frenar, luz de check engine encendida, fuga de aceite..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Diagnóstico Técnico Inicial
                  </label>
                  <input
                    type="text"
                    value={diagnosedProblem}
                    onChange={e => setDiagnosedProblem(e.target.value)}
                    placeholder="Balatas desgastadas en un 85%, rectificado requerido..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Technician & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Técnico Mecánico</label>
                  <select
                    value={assignedTechnician}
                    onChange={e => setAssignedTechnician(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none"
                  >
                    {techList.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Prioridad</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Etapa Inicial</label>
                  <select
                    value={stage}
                    onChange={e => setStage(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none"
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parts Used Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs">Repuestos Utilizados (Almacén)</span>
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="px-2.5 py-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Agregar Repuesto</span>
                  </button>
                </div>

                {partsUsed.map((pu, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center gap-2"
                  >
                    <select
                      value={pu.partId}
                      onChange={e => handleSelectInventoryPart(idx, e.target.value)}
                      className="flex-1 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-white focus:outline-none"
                    >
                      {parts.map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.sku}] {p.name} - Stock: {p.stockQuantity} (${p.salePrice} USD)
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={pu.quantity}
                      onChange={e => handleUpdatePart(idx, { quantity: Number(e.target.value) })}
                      className="w-16 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-center text-xs font-mono text-white"
                      title="Cantidad"
                    />

                    <span className="font-mono text-xs text-emerald-400 font-semibold w-24 text-right tabular-nums">
                      {formatUSD(pu.total)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemovePart(idx)}
                      className="text-neutral-500 hover:text-red-400 cursor-pointer p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Labor & Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Horas Mano de Obra</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={laborHours}
                    onChange={e => setLaborHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Tarifa por Hora ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={laborRatePerHour}
                    onChange={e => setLaborRatePerHour(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Estado de Cobro</label>
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="anticipo">Anticipo Recibido</option>
                    <option value="pagado">Liquidado / Pagado</option>
                  </select>
                </div>
              </div>

              {paymentStatus === 'anticipo' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Monto del Anticipo ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={amountPaid}
                    onChange={e => setAmountPaid(Number(e.target.value))}
                    placeholder="Monto entregado por el cliente"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer shadow-sm shadow-red-950"
                >
                  Abrir Orden de Trabajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Vista Formal / Impresión de Orden de Trabajo */}
      {selectedOrderForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/70">
              <span className="text-xs font-semibold text-white">Hoja de Taller & Orden de Trabajo</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Formato</span>
                </button>
                <button
                  onClick={() => setSelectedOrderForPrint(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Sheet */}
            <div className="p-6 sm:p-8 overflow-y-auto bg-neutral-950 text-white font-sans text-xs space-y-6 print-clean">
              {/* Header with Logo */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <Logo className="w-16 h-16 shrink-0" theme="dark" showText={false} />
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight text-white uppercase">
                      {WORKSHOP_CONFIG.name}
                    </h2>
                    <p className="text-[11px] text-neutral-400">{WORKSHOP_CONFIG.legalName}</p>
                    <p className="text-[11px] text-neutral-400">{WORKSHOP_CONFIG.address}</p>
                    <p className="text-[11px] text-neutral-400">
                      Tel: {WORKSHOP_CONFIG.phone} · {WORKSHOP_CONFIG.taxId} · {WORKSHOP_CONFIG.taxNRC}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-red-500">
                    Orden de Trabajo Oficial
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {selectedOrderForPrint.otNumber}
                  </div>
                  <div className="text-neutral-400 text-[11px] mt-1">
                    Ingreso: {selectedOrderForPrint.startDate}
                  </div>
                  <div className="text-neutral-400 text-[11px]">
                    Técnico: <strong className="text-white">{selectedOrderForPrint.assignedTechnician}</strong>
                  </div>
                </div>
              </div>

              {/* Vehicle & Inspection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-neutral-500 block mb-1">
                    Cliente & Contacto
                  </span>
                  <div className="font-semibold text-white text-sm">{selectedOrderForPrint.clientName}</div>
                  <div className="text-neutral-400 font-mono">Tel: {selectedOrderForPrint.clientPhone}</div>
                  {selectedOrderForPrint.clientEmail && (
                    <div className="text-neutral-400">{selectedOrderForPrint.clientEmail}</div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-neutral-500 block mb-1">
                    Ficha Técnica del Vehículo
                  </span>
                  <div className="font-semibold text-white text-sm">
                    {selectedOrderForPrint.vehicleBrand} {selectedOrderForPrint.vehicleModel} (
                    {selectedOrderForPrint.vehicleYear})
                  </div>
                  <div className="text-neutral-400 font-mono">
                    Placas: <strong className="text-white">{selectedOrderForPrint.vehiclePlate}</strong> · Km:{' '}
                    {selectedOrderForPrint.mileageIn.toLocaleString()} km
                  </div>
                  <div className="text-neutral-400 font-mono">
                    Combustible: {selectedOrderForPrint.fuelLevel}
                  </div>
                </div>
              </div>

              {/* Inspection notes */}
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Inspección y Falla Reportada:
                </span>
                <p className="text-neutral-200">
                  <strong>Reporte Cliente:</strong> {selectedOrderForPrint.reportedFault}
                </p>
                {selectedOrderForPrint.diagnosedProblem && (
                  <p className="text-neutral-200 mt-1">
                    <strong>Diagnóstico Técnico:</strong> {selectedOrderForPrint.diagnosedProblem}
                  </p>
                )}
                {selectedOrderForPrint.damagesInspectionNotes && (
                  <p className="text-neutral-400 italic text-[11px] mt-1">
                    Condiciones preexistentes: {selectedOrderForPrint.damagesInspectionNotes}
                  </p>
                )}
              </div>

              {/* Items & Labor */}
              <div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 uppercase font-mono text-[10px]">
                      <th className="py-2 px-3">Código</th>
                      <th className="py-2 px-3">Concepto / Repuesto</th>
                      <th className="py-2 px-3 text-center">Cant / Horas</th>
                      <th className="py-2 px-3 text-right">P. Unitario</th>
                      <th className="py-2 px-3 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {selectedOrderForPrint.partsUsed.map((p, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-mono text-[11px] text-neutral-400">{p.sku}</td>
                        <td className="py-2 px-3 text-white font-medium">{p.name}</td>
                        <td className="py-2 px-3 text-center font-mono">{p.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono text-neutral-400 tabular-nums">
                          {formatUSD(p.unitPrice)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-white font-semibold tabular-nums">
                          {formatUSD(p.total)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 px-3 font-mono text-[11px] text-neutral-400">MO-TEC</td>
                      <td className="py-2 px-3 text-white font-medium">
                        Mano de Obra Mecánica Calificada ({selectedOrderForPrint.laborHours} hrs)
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{selectedOrderForPrint.laborHours}</td>
                      <td className="py-2 px-3 text-right font-mono text-neutral-400 tabular-nums">
                        {formatUSD(selectedOrderForPrint.laborRatePerHour)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-white font-semibold tabular-nums">
                        {formatUSD(selectedOrderForPrint.laborTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total calculations - Tax removed completely for El Salvador work orders */}
              <div className="flex justify-end pt-4 border-t border-neutral-800">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">
                      {formatUSD(selectedOrderForPrint.subtotal)}
                    </span>
                  </div>
                  {selectedOrderForPrint.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Descuento:</span>
                      <span className="font-mono">
                        -{formatUSD(selectedOrderForPrint.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-neutral-800 text-sm font-bold text-white">
                    <span>TOTAL:</span>
                    <span className="font-mono text-base text-emerald-400">
                      {formatCurrency(Math.max(0, selectedOrderForPrint.subtotal - (selectedOrderForPrint.discountAmount || 0)))}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Anticipo Pagado:</span>
                    <span className="font-mono">
                      -{formatUSD(selectedOrderForPrint.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-amber-300">
                    <span>SALDO PENDIENTE:</span>
                    <span className="font-mono">
                      {formatCurrency(Math.max(0, selectedOrderForPrint.subtotal - (selectedOrderForPrint.discountAmount || 0) - selectedOrderForPrint.amountPaid))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-800 text-center">
                <div className="pt-8 border-t border-neutral-700">
                  <span className="text-[10px] text-neutral-400 block uppercase font-mono">
                    Mecánico Responsable
                  </span>
                  <span className="text-xs text-white font-medium">{selectedOrderForPrint.assignedTechnician}</span>
                </div>
                <div className="pt-8 border-t border-neutral-700">
                  <span className="text-[10px] text-neutral-400 block uppercase font-mono">
                    Conformidad y Autorización del Cliente
                  </span>
                  <span className="text-xs text-white font-medium">
                    {selectedOrderForPrint.customerSignatureName || selectedOrderForPrint.clientName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Asignar Mecánico Responsable */}
      <AssignMechanicModal
        order={orderForAssign}
        isOpen={Boolean(orderForAssign)}
        onClose={() => setOrderForAssign(null)}
      />
    </div>
  );
};
