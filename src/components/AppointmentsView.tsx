import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Appointment, AppointmentStatus } from '../types';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  MessageSquare,
  Wrench,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Car,
  User,
  Phone,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/initialData';

interface AppointmentsViewProps {
  onOpenWhatsApp: (phone: string, clientName: string, template: any, data: any) => void;
  onConvertToWorkOrder: (app: Appointment) => void;
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  onOpenWhatsApp,
  onConvertToWorkOrder,
  isCreateModalOpen = false,
  onCloseCreateModal,
}) => {
  const {
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    clients,
    activeTechnicians,
    hasPermission,
  } = useWorkshop();

  const canManageAppointments = hasPermission('canManageAppointments');
  const techList = activeTechnicians.length > 0 ? activeTechnicians : WORKSHOP_CONFIG.technicians;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'week'>('all');
  const [isModalOpen, setIsModalOpen] = useState(isCreateModalOpen);
  const [editingApp, setEditingApp] = useState<Appointment | null>(null);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState<number>(2021);
  const [serviceRequested, setServiceRequested] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [assignedTechnician, setAssignedTechnician] = useState(techList[0] || WORKSHOP_CONFIG.technicians[0]);
  const [status, setStatus] = useState<AppointmentStatus>('confirmada');
  const [notes, setNotes] = useState('');

  // Handle client selection shortcut
  const handleSelectExistingClient = (clientId: string) => {
    const found = clients.find(c => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientPhone(found.phone);
      if (found.vehicles && found.vehicles.length > 0) {
        const v = found.vehicles[0];
        setVehiclePlate(v.plate);
        setVehicleModel(`${v.brand} ${v.model}`);
        setVehicleYear(v.year);
      }
    }
  };

  const openNewModal = () => {
    setEditingApp(null);
    setClientName('');
    setClientPhone('');
    setVehiclePlate('');
    setVehicleModel('');
    setVehicleYear(2021);
    setServiceRequested('');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setScheduledTime('09:00');
    setAssignedTechnician(WORKSHOP_CONFIG.technicians[0]);
    setStatus('confirmada');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (app: Appointment) => {
    setEditingApp(app);
    setClientName(app.clientName);
    setClientPhone(app.clientPhone);
    setVehiclePlate(app.vehiclePlate);
    setVehicleModel(app.vehicleModel);
    setVehicleYear(app.vehicleYear);
    setServiceRequested(app.serviceRequested);
    setScheduledDate(app.scheduledDate);
    setScheduledTime(app.scheduledTime);
    setAssignedTechnician(app.assignedTechnician);
    setStatus(app.status);
    setNotes(app.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !vehiclePlate) {
      alert('Por favor completa el nombre, teléfono y placas del vehículo.');
      return;
    }

    if (editingApp) {
      updateAppointment(editingApp.id, {
        clientName,
        clientPhone,
        vehiclePlate,
        vehicleModel,
        vehicleYear,
        serviceRequested,
        scheduledDate,
        scheduledTime,
        assignedTechnician,
        status,
        notes,
      });
    } else {
      addAppointment({
        clientName,
        clientPhone,
        vehiclePlate,
        vehicleModel: vehicleModel || 'Vehículo',
        vehicleYear,
        serviceRequested: serviceRequested || 'Revisión General',
        scheduledDate,
        scheduledTime,
        assignedTechnician,
        status,
        notes,
      });
    }

    setIsModalOpen(false);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  // Date filters helper
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch =
      app.clientName.toLowerCase().includes(search.toLowerCase()) ||
      app.vehiclePlate.toLowerCase().includes(search.toLowerCase()) ||
      app.vehicleModel.toLowerCase().includes(search.toLowerCase()) ||
      app.serviceRequested.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    let matchesDate = true;
    if (dateFilter === 'today') matchesDate = app.scheduledDate === todayStr;
    if (dateFilter === 'tomorrow') matchesDate = app.scheduledDate === tomorrowStr;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (st: AppointmentStatus) => {
    switch (st) {
      case 'confirmada':
        return <span className="text-emerald-400 font-medium">Confirmada</span>;
      case 'pendiente':
        return <span className="text-amber-400 font-medium">Pendiente</span>;
      case 'en_taller':
        return <span className="text-blue-400 font-medium">En Taller</span>;
      case 'completada':
        return <span className="text-neutral-400 font-medium">Completada</span>;
      case 'cancelada':
        return <span className="text-red-400 font-medium">Cancelada</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-red-500" />
            <span>Gestión de Citas & Agenda</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Control de citas, asignación de técnicos y notificaciones instantáneas
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-950 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Nueva Cita</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por cliente, placas, modelo o servicio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Date Filter Segment */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg overflow-x-auto">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'today', label: 'Hoy' },
            { id: 'tomorrow', label: 'Mañana' },
          ].map(d => (
            <button
              key={d.id}
              onClick={() => setDateFilter(d.id as any)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                dateFilter === d.id ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Status Filter Segment */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg overflow-x-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'confirmada', label: 'Confirmadas' },
            { id: 'pendiente', label: 'Pendientes' },
            { id: 'en_taller', label: 'En Taller' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === st.id ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            No se encontraron citas con los filtros seleccionados.
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {filteredAppointments.map(app => (
              <div
                key={app.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-neutral-850/50 transition-colors"
              >
                {/* Left: DateTime & Vehicle */}
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Date badge */}
                  <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-center shrink-0 text-center">
                    <span className="text-[10px] text-red-400 font-semibold uppercase font-mono">
                      {new Date(`${app.scheduledDate}T12:00:00`).toLocaleDateString('es-MX', { month: 'short' })}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-white font-mono leading-none">
                      {new Date(`${app.scheduledDate}T12:00:00`).getDate()}
                    </span>
                    <span className="text-[9px] text-neutral-500 font-mono mt-0.5">{app.scheduledTime}</span>
                  </div>

                  {/* Vehicle & Customer details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm sm:text-base">{app.vehicleModel}</span>
                      <span className="font-mono text-xs text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                        {app.vehiclePlate}
                      </span>
                      <span className="text-xs">{getStatusBadge(app.status)}</span>
                    </div>

                    <p className="text-xs text-neutral-300 font-medium flex items-center gap-1.5">
                      <span className="text-red-400">Servicio:</span> {app.serviceRequested}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-neutral-500" />
                        {app.clientName}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-neutral-500" />
                        {app.clientPhone}
                      </span>
                      <span>·</span>
                      <span className="text-neutral-400">Técnico: {app.assignedTechnician}</span>
                    </div>

                    {app.notes && (
                      <p className="text-[11px] text-neutral-400 italic pt-1 border-t border-neutral-800/60 mt-1">
                        Nota: {app.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
                  {/* WhatsApp confirmation */}
                  <button
                    onClick={() =>
                      onOpenWhatsApp(app.clientPhone, app.clientName, 'cita', {
                        date: app.scheduledDate,
                        time: app.scheduledTime,
                        vehicle: app.vehicleModel,
                        plate: app.vehiclePlate,
                        service: app.serviceRequested,
                      })
                    }
                    className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Enviar confirmación de cita a WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Convert to Work Order button */}
                  <button
                    onClick={() => onConvertToWorkOrder(app)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-950"
                    title="Iniciar Orden de Trabajo para este vehículo"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Crear OT</span>
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEditModal(app)}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    title="Editar cita"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar la cita de ${app.clientName}?`)) {
                        deleteAppointment(app.id);
                      }
                    }}
                    className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar cita"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Agendar / Editar Cita */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <span>{editingApp ? 'Editar Cita Agendada' : 'Agendar Nueva Cita en Taller'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Client Auto-select */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Seleccionar Cliente Existente (Opcional)
                </label>
                <select
                  onChange={e => handleSelectExistingClient(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-red-500"
                >
                  <option value="">-- Seleccionar de la base de datos o escribir abajo --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre Completo *</label>
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
                  <label className="block text-xs font-medium text-neutral-300 mb-1">WhatsApp / Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Vehicle data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Vehículo (Marca y Modelo)</label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={e => setVehicleModel(e.target.value)}
                    placeholder="Ej. Honda Civic Si Hatchback"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Placas *</label>
                  <input
                    type="text"
                    required
                    value={vehiclePlate}
                    onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="NXY-4821"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Fecha Programada</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Hora de Ingreso</label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              {/* Service requested */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Servicio Solicitado / Motivo</label>
                <input
                  type="text"
                  required
                  value={serviceRequested}
                  onChange={e => setServiceRequested(e.target.value)}
                  placeholder="Ej. Cambio de balatas de frenos y revisión de suspensión"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Technician & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Técnico Asignado</label>
                  <select
                    value={assignedTechnician}
                    onChange={e => setAssignedTechnician(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    {techList.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Estado de la Cita</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="confirmada">Confirmada</option>
                    <option value="pendiente">Pendiente de Confirmar</option>
                    <option value="en_taller">En Taller</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Notas Internas</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Observaciones previas, piezas requeridas, cliente espera en sala..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

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
                  {editingApp ? 'Guardar Cambios' : 'Agendar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
