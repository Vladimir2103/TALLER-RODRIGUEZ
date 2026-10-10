import React, { useState, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Client, Vehicle, WorkOrder, WorkOrderStage } from '../types';
import { formatCurrency, formatUSD } from '../utils/format';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Car,
  Calendar,
  Wrench,
  Clock,
  History,
  DollarSign,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  PlusCircle,
  FileText,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  Printer,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ClientsHistoryViewProps {
  onOpenWhatsApp: (phone: string, clientName: string, template: any, data: any) => void;
  onNewWorkOrderForVehicle?: (client: Client, vehicle: Vehicle) => void;
  onNavigateToOT?: (otId?: string) => void;
  initialViewMode?: 'clients' | 'history';
}

export const ClientsHistoryView: React.FC<ClientsHistoryViewProps> = ({
  onOpenWhatsApp,
  onNewWorkOrderForVehicle,
  onNavigateToOT,
  initialViewMode = 'clients',
}) => {
  const {
    clients,
    workOrders,
    addClient,
    updateClient,
    deleteClient,
    hasPermission,
    currentUser,
  } = useWorkshop();

  const [activeViewMode, setActiveViewMode] = useState<'clients' | 'history'>(initialViewMode);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStageFilter, setHistoryStageFilter] = useState<string>('all');

  useEffect(() => {
    if (initialViewMode) {
      setActiveViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  const canManageClients = hasPermission('canManageClients');
  const canDelete = hasPermission('canDeleteRecords');
  const canSendWhatsApp = hasPermission('canSendWhatsApp');
  const canManageWorkOrders = hasPermission('canManageWorkOrders');

  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isEditVehicleModalOpen, setIsEditVehicleModalOpen] = useState(false);
  const [editingVehicleIndex, setEditingVehicleIndex] = useState<number | null>(null);

  // Form states for new client
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [identification, setIdentification] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Form states for editing client
  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editClientIdentification, setEditClientIdentification] = useState('');
  const [editClientAddress, setEditClientAddress] = useState('');
  const [editClientNotes, setEditClientNotes] = useState('');

  // Initial vehicle for new client
  const [vPlate, setVPlate] = useState('');
  const [vBrand, setVBrand] = useState('');
  const [vModel, setVModel] = useState('');
  const [vYear, setVYear] = useState<number>(2022);
  const [vColor, setVColor] = useState('Blanco');
  const [vMileage, setVMileage] = useState<number>(45000);

  // Extra vehicle form
  const [evPlate, setEvPlate] = useState('');
  const [evBrand, setEvBrand] = useState('');
  const [evModel, setEvModel] = useState('');
  const [evYear, setEvYear] = useState<number>(2022);
  const [evColor, setEvColor] = useState('Gris');
  const [evMileage, setEvMileage] = useState<number>(30000);

  // Edit vehicle form
  const [editVPlate, setEditVPlate] = useState('');
  const [editVBrand, setEditVBrand] = useState('');
  const [editVModel, setEditVModel] = useState('');
  const [editVYear, setEditVYear] = useState<number>(2022);
  const [editVColor, setEditVColor] = useState('');
  const [editVMileage, setEditVMileage] = useState<number>(0);

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];

  // Work orders history for selected client
  const clientHistory = selectedClient
    ? workOrders.filter(
        o =>
          o.clientId === selectedClient.id ||
          selectedClient.vehicles.some(v => v.plate.toUpperCase() === o.vehiclePlate.toUpperCase())
      )
    : [];

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Por favor ingresa nombre y teléfono del cliente.');
      return;
    }

    const initialVehicles: Vehicle[] = vPlate
      ? [
          {
            plate: vPlate.toUpperCase(),
            brand: vBrand || 'Vehículo',
            model: vModel || 'Sedán',
            year: vYear,
            color: vColor,
            mileage: vMileage,
            fuelType: 'Gasolina',
          },
        ]
      : [];

    const newClient = addClient({
      name,
      phone,
      email,
      identification,
      address,
      notes,
      vehicles: initialVehicles,
    });

    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    setSelectedClientId(newClient.id);
    setIsNewClientModalOpen(false);

    // Reset
    setName('');
    setPhone('');
    setEmail('');
    setVPlate('');
    setVBrand('');
    setVModel('');
  };

  const handleAddVehicleToClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !evPlate) return;

    const newVehicle: Vehicle = {
      plate: evPlate.toUpperCase(),
      brand: evBrand || 'Vehículo',
      model: evModel || 'Modelo',
      year: evYear,
      color: evColor,
      mileage: evMileage,
      fuelType: 'Gasolina',
    };

    updateClient(selectedClient.id, {
      vehicles: [...selectedClient.vehicles, newVehicle],
    });

    setIsAddVehicleModalOpen(false);
    setEvPlate('');
    setEvBrand('');
    setEvModel('');
  };

  const openEditClientModal = () => {
    if (!selectedClient) return;
    setEditClientName(selectedClient.name);
    setEditClientPhone(selectedClient.phone);
    setEditClientEmail(selectedClient.email || '');
    setEditClientIdentification(selectedClient.identification || '');
    setEditClientAddress(selectedClient.address || '');
    setEditClientNotes(selectedClient.notes || '');
    setIsEditClientModalOpen(true);
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    updateClient(selectedClient.id, {
      name: editClientName,
      phone: editClientPhone,
      email: editClientEmail,
      identification: editClientIdentification,
      address: editClientAddress,
      notes: editClientNotes,
    });
    setIsEditClientModalOpen(false);
  };

  const handleDeleteClient = () => {
    if (!selectedClient) return;
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente al cliente "${selectedClient.name}" y todos sus vehículos asociados?`)) {
      const remaining = clients.filter(c => c.id !== selectedClient.id);
      deleteClient(selectedClient.id);
      setSelectedClientId(remaining[0]?.id || '');
    }
  };

  const openEditVehicleModal = (v: Vehicle, index: number) => {
    setEditingVehicleIndex(index);
    setEditVPlate(v.plate);
    setEditVBrand(v.brand);
    setEditVModel(v.model);
    setEditVYear(v.year);
    setEditVColor(v.color);
    setEditVMileage(v.mileage);
    setIsEditVehicleModalOpen(true);
  };

  const handleUpdateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || editingVehicleIndex === null) return;
    const updatedVehicles = [...selectedClient.vehicles];
    updatedVehicles[editingVehicleIndex] = {
      ...updatedVehicles[editingVehicleIndex],
      plate: editVPlate.toUpperCase(),
      brand: editVBrand,
      model: editVModel,
      year: editVYear,
      color: editVColor,
      mileage: editVMileage,
    };
    updateClient(selectedClient.id, { vehicles: updatedVehicles });
    setIsEditVehicleModalOpen(false);
    setEditingVehicleIndex(null);
  };

  const handleDeleteVehicle = (index: number) => {
    if (!selectedClient) return;
    const v = selectedClient.vehicles[index];
    if (confirm(`¿Eliminar vehículo ${v.brand} ${v.model} (${v.plate}) de este cliente?`)) {
      const updatedVehicles = selectedClient.vehicles.filter((_, i) => i !== index);
      updateClient(selectedClient.id, { vehicles: updatedVehicles });
    }
  };

  const filteredClients = clients.filter(c => {
    const query = search.toLowerCase();
    const matchesName = c.name.toLowerCase().includes(query);
    const matchesPhone = c.phone.includes(query);
    const matchesPlate = c.vehicles.some(v => v.plate.toLowerCase().includes(query));
    const matchesVehicle = c.vehicles.some(
      v => v.brand.toLowerCase().includes(query) || v.model.toLowerCase().includes(query)
    );
    return matchesName || matchesPhone || matchesPlate || matchesVehicle;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="space-y-3 pb-2 border-b border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <History className="w-6 h-6 text-red-500" />
              <span>Clientes & Historial del Taller</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              Expediente automotriz por cliente, parque vehicular y registro cronológico de todas las reparaciones
            </p>
          </div>

          <button
            onClick={() => setIsNewClientModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-950 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Cliente</span>
          </button>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setActiveViewMode('clients')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeViewMode === 'clients'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/60'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Directorio de Clientes ({clients.length})</span>
          </button>

          <button
            onClick={() => setActiveViewMode('history')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeViewMode === 'history'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/60'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial de Reparaciones ({workOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Dossier Workspace: Clientes */}
      {activeViewMode === 'clients' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Client Directory List (4 cols) */}
        <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
          {/* Search box */}
          <div className="p-3 border-b border-neutral-800 bg-neutral-950/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, placa o teléfono..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Client List items */}
          <div className="divide-y divide-neutral-800/80 max-h-[640px] overflow-y-auto">
            {filteredClients.map(c => {
              const isSelected = c.id === selectedClient?.id;
              const primaryVehicle = c.vehicles[0];

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-neutral-800/80 border-l-4 border-l-red-500' : 'hover:bg-neutral-850/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white truncate">{c.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold tabular-nums">
                      {formatUSD(c.totalSpent)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1">
                    <Phone className="w-3 h-3 text-neutral-500 shrink-0" />
                    <span className="font-mono">{c.phone}</span>
                  </div>

                  {primaryVehicle && (
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 mt-1">
                      <Car className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="truncate">
                        {primaryVehicle.brand} {primaryVehicle.model}
                      </span>
                      <span className="font-mono text-[10px] bg-neutral-950 px-1 py-0.2 rounded border border-neutral-800">
                        {primaryVehicle.plate}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Full Client Dossier & Repair History Timeline (8 cols) */}
        {selectedClient ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Client Profile Card */}
            <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{selectedClient.name}</h2>
                    {selectedClient.identification && (
                      <span className="font-mono text-xs text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                        {selectedClient.identification}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Cliente registrado desde {selectedClient.createdAt} · Inversión total en taller:{' '}
                    <strong className="text-emerald-400 font-mono">
                      {formatCurrency(selectedClient.totalSpent)}
                    </strong>
                  </p>
                </div>

                {/* Actions: WhatsApp, Edit, Delete */}
                <div className="flex items-center gap-2 flex-wrap">
                  {canSendWhatsApp && (
                    <button
                      onClick={() =>
                        onOpenWhatsApp(selectedClient.phone, selectedClient.name, 'personalizado', {
                          vehicle: selectedClient.vehicles[0]
                            ? `${selectedClient.vehicles[0].brand} ${selectedClient.vehicles[0].model}`
                            : 'Vehículo',
                          plate: selectedClient.vehicles[0]?.plate || '',
                        })
                      }
                      className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  )}

                  {canManageClients && (
                    <button
                      onClick={openEditClientModal}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Editar datos del cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Editar Cliente</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={handleDeleteClient}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer border border-neutral-800 hover:border-red-900"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Contact Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-850 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 font-mono uppercase block">Teléfono / WhatsApp</span>
                  <span className="text-neutral-200 font-mono font-medium">{selectedClient.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-mono uppercase block">Correo Electrónico</span>
                  <span className="text-neutral-200 truncate block">{selectedClient.email || 'No registrado'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-mono uppercase block">Domicilio</span>
                  <span className="text-neutral-200 truncate block">{selectedClient.address || 'El Salvador, Usulután'}</span>
                </div>
              </div>

              {/* Registered Vehicles of Client */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Flota de Vehículos del Cliente ({selectedClient.vehicles.length})
                  </span>
                  <button
                    onClick={() => setIsAddVehicleModalOpen(true)}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar otro vehículo</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedClient.vehicles.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">
                            {v.brand} {v.model} ({v.year})
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-amber-300 font-bold bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                              {v.plate}
                            </span>
                            {canManageClients && (
                              <button
                                onClick={() => openEditVehicleModal(v, idx)}
                                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
                                title="Editar vehículo"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            {canDelete && selectedClient.vehicles.length > 1 && (
                              <button
                                onClick={() => handleDeleteVehicle(idx)}
                                className="p-1 text-neutral-500 hover:text-red-400 rounded hover:bg-neutral-800 cursor-pointer"
                                title="Eliminar vehículo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-1">
                          <span>Color: {v.color}</span>
                          <span>·</span>
                          <span className="font-mono">{v.mileage.toLocaleString()} km</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-900 flex items-center justify-between gap-2">
                        {canSendWhatsApp ? (
                          <button
                            onClick={() =>
                              onOpenWhatsApp(selectedClient.phone, selectedClient.name, 'mantenimiento', {
                                vehicle: `${v.brand} ${v.model}`,
                                plate: v.plate,
                              })
                            }
                            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Recordar Mantenimiento</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-600">WhatsApp restringido</span>
                        )}

                        {canManageWorkOrders && onNewWorkOrderForVehicle && (
                          <button
                            onClick={() => onNewWorkOrderForVehicle(selectedClient, v)}
                            className="text-[11px] text-white hover:text-red-400 flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>Abrir OT</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Repair History Timeline */}
            <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-red-500" />
                    <span>Línea de Tiempo de Reparaciones & Mantenimientos</span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Historial cronológico completo de servicios prestados a este cliente
                  </p>
                </div>
                <span className="font-mono text-xs text-neutral-400">{clientHistory.length} servicios</span>
              </div>

              {clientHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  Este cliente no tiene órdenes de trabajo registradas aún.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-800">
                  {clientHistory.map(order => (
                    <div key={order.id} className="relative space-y-2">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-neutral-900 ring-2 ring-red-500/20" />

                      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2.5">
                        {/* Top: OT Number, Date & Amount */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-sm">{order.otNumber}</span>
                            <span className="text-neutral-500">·</span>
                            <span className="text-neutral-400">{order.startDate.split(' ')[0]}</span>
                            <span className="font-mono text-neutral-300 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 text-[11px]">
                              {order.vehiclePlate} ({order.vehicleModel})
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                            {formatCurrency(order.total)}
                          </span>
                        </div>

                        {/* Mileage at service */}
                        <div className="text-[11px] text-neutral-400 flex items-center gap-3">
                          <span>
                            Kilometraje registrado:{' '}
                            <strong className="text-neutral-200 font-mono">
                              {order.mileageIn.toLocaleString()} km
                            </strong>
                          </span>
                          <span>·</span>
                          <span>Técnico a cargo: {order.assignedTechnician}</span>
                          <span>·</span>
                          <span className="capitalize text-emerald-400">{order.stage.replace('_', ' ')}</span>
                        </div>

                        {/* Diagnosed & Reported */}
                        <div className="p-2.5 bg-neutral-900/60 rounded-lg text-xs space-y-1">
                          <p className="text-neutral-300">
                            <strong className="text-neutral-400">Motivo de ingreso:</strong> {order.reportedFault}
                          </p>
                          {order.diagnosedProblem && (
                            <p className="text-neutral-300">
                              <strong className="text-neutral-400">Diagnóstico & Solución:</strong>{' '}
                              {order.diagnosedProblem}
                            </p>
                          )}
                        </div>

                        {/* Parts replaced */}
                        {order.partsUsed.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[10px] text-neutral-500 uppercase font-mono block mb-1">
                              Repuestos y Materiales Instalados:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {order.partsUsed.map((p, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300"
                                >
                                  {p.name} (x{p.quantity})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-xl">
            Selecciona un cliente de la lista para ver su expediente e historial completo.
          </div>
        )}
      </div>
      )}

      {/* VIEW MODE 2: Historial General de Reparaciones del Taller */}
      {activeViewMode === 'history' && (
        <div className="space-y-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">
                Total Servicios Realizados
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 block">
                {workOrders.length}
              </span>
            </div>
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">
                Entregados & Finalizados
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                {workOrders.filter(o => o.stage === 'entregado').length}
              </span>
            </div>
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">
                En Proceso Actual
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1 block">
                {workOrders.filter(o => o.stage !== 'entregado').length}
              </span>
            </div>
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">
                Facturación Histórica
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1 block truncate">
                {formatUSD(workOrders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0))}
              </span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Buscar por placa, cliente, teléfono, número de OT o falla..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <select
                value={historyStageFilter}
                onChange={e => setHistoryStageFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="all">Todas las Etapas ({workOrders.length})</option>
                <option value="entregado">Entregados / Listos</option>
                <option value="reparacion">En Reparación</option>
                <option value="diagnostico">En Diagnóstico</option>
                <option value="espera_repuestos">Espera Repuestos</option>
                <option value="control_calidad">Control Calidad</option>
              </select>
            </div>
          </div>

          {/* History records list */}
          {(() => {
            const q = historySearch.toLowerCase().trim();
            const filteredOrders = workOrders.filter(o => {
              const matchesSearch =
                !q ||
                o.otNumber.toLowerCase().includes(q) ||
                o.clientName.toLowerCase().includes(q) ||
                o.vehiclePlate.toLowerCase().includes(q) ||
                o.vehicleModel.toLowerCase().includes(q) ||
                o.reportedFault.toLowerCase().includes(q) ||
                o.assignedTechnician.toLowerCase().includes(q);

              const matchesStage = historyStageFilter === 'all' || o.stage === historyStageFilter;
              return matchesSearch && matchesStage;
            });

            if (filteredOrders.length === 0) {
              return (
                <div className="p-12 text-center text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
                  <History className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
                  <p className="font-semibold text-neutral-300">No se encontraron reparaciones registradas</p>
                  <p className="text-neutral-500 text-[11px]">
                    {workOrders.length === 0
                      ? 'Las reparaciones y órdenes que crees se registrarán automáticamente en este historial.'
                      : 'Intenta con otro término de búsqueda o cambia el filtro de etapa.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl space-y-3 transition-colors"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800">
                          {order.otNumber}
                        </span>
                        <span className="font-mono text-xs text-amber-300 font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                          🚗 {order.vehiclePlate}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {order.vehicleBrand} {order.vehicleModel} ({order.vehicleYear})
                        </span>
                        <span className="text-neutral-500 text-xs">·</span>
                        <span className="text-xs text-neutral-400">
                          Ingreso: {order.startDate ? order.startDate.split(' ')[0] : 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md border ${
                            order.stage === 'entregado'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {order.stage}
                        </span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {formatUSD(order.subtotal)}
                        </span>
                      </div>
                    </div>

                    {/* Middle Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-850">
                        <span className="text-[10px] text-neutral-500 uppercase font-mono block mb-1">
                          Cliente & Contacto
                        </span>
                        <p className="font-semibold text-white">{order.clientName}</p>
                        <p className="text-neutral-400 font-mono text-[11px] mt-0.5">Tel: {order.clientPhone}</p>
                      </div>

                      <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-850">
                        <span className="text-[10px] text-neutral-500 uppercase font-mono block mb-1">
                          Falla Reportada & Diagnóstico
                        </span>
                        <p className="text-neutral-200 line-clamp-1">
                          <strong>Reporte:</strong> {order.reportedFault}
                        </p>
                        {order.diagnosedProblem && (
                          <p className="text-neutral-400 line-clamp-1 mt-0.5 text-[11px]">
                            <strong>Diagnóstico:</strong> {order.diagnosedProblem}
                          </p>
                        )}
                      </div>

                      <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-850">
                        <span className="text-[10px] text-neutral-500 uppercase font-mono block mb-1">
                          Responsable & Entrega
                        </span>
                        <p className="text-neutral-200">
                          Técnico: <strong className="text-white">{order.assignedTechnician}</strong>
                        </p>
                        <p className="text-neutral-400 text-[11px] mt-0.5">
                          {order.completedDate ? `Entregado: ${order.completedDate}` : `Estimado: ${order.estimatedCompletionDate || 'Pendiente'}`}
                        </p>
                      </div>
                    </div>

                    {/* Parts list */}
                    {order.partsUsed && order.partsUsed.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-neutral-500 font-mono uppercase mr-1">
                          Repuestos:
                        </span>
                        {order.partsUsed.map((p, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300"
                          >
                            {p.name} (x{p.quantity}) · {formatUSD(p.total)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
                      <div className="flex items-center gap-2">
                        {order.clientId && (
                          <button
                            onClick={() => {
                              setSelectedClientId(order.clientId);
                              setActiveViewMode('clients');
                            }}
                            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Ver Expediente del Cliente</span>
                          </button>
                        )}

                        {onNavigateToOT && (
                          <button
                            onClick={() => onNavigateToOT(order.id)}
                            className="px-2.5 py-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-300 font-medium cursor-pointer transition-colors flex items-center gap-1 border border-red-500/30"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Abrir Orden</span>
                          </button>
                        )}
                      </div>

                      {canSendWhatsApp && order.clientPhone && (
                        <button
                          onClick={() =>
                            onOpenWhatsApp(order.clientPhone, order.clientName, 'personalizado', {
                              vehicle: `${order.vehicleBrand} ${order.vehicleModel}`,
                              plate: order.vehiclePlate,
                              otNumber: order.otNumber,
                            })
                          }
                          className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium cursor-pointer transition-colors flex items-center gap-1 border border-emerald-500/20"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal: Registrar Nuevo Cliente */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/70">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-red-500" />
                <span>Registrar Nuevo Cliente</span>
              </h3>
              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej. Roberto Gómez Martínez"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">WhatsApp / Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+503 7000-0000"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">DUI / NIT (El Salvador)</label>
                  <input
                    type="text"
                    value={identification}
                    onChange={e => setIdentification(e.target.value.toUpperCase())}
                    placeholder="Ej. 02345678-9 o NIT"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Dirección / Localidad</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="El Salvador, Usulután"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Initial vehicle information */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-red-500" />
                  <span>Primer Vehículo del Cliente (Opcional)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Placas (El Salvador)</label>
                    <input
                      type="text"
                      value={vPlate}
                      onChange={e => setVPlate(e.target.value.toUpperCase())}
                      placeholder="P 123-456"
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-white font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Marca</label>
                    <input
                      type="text"
                      value={vBrand}
                      onChange={e => setVBrand(e.target.value)}
                      placeholder="Honda, Toyota..."
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Modelo</label>
                    <input
                      type="text"
                      value={vModel}
                      onChange={e => setVModel(e.target.value)}
                      placeholder="Civic Si"
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Año</label>
                    <input
                      type="number"
                      value={vYear}
                      onChange={e => setVYear(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Color</label>
                    <input
                      type="text"
                      value={vColor}
                      onChange={e => setVColor(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Kilometraje (km)</label>
                    <input
                      type="number"
                      value={vMileage}
                      onChange={e => setVMileage(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Notas del Cliente</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Preferencias del cliente, marcas recomendadas..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer shadow-sm shadow-red-950"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agregar Vehículo a Cliente */}
      {isAddVehicleModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/70">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-red-500" />
                <span>Agregar Vehículo a {selectedClient.name}</span>
              </h3>
              <button
                onClick={() => setIsAddVehicleModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddVehicleToClient} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Placas (El Salvador) *</label>
                <input
                  type="text"
                  required
                  value={evPlate}
                  onChange={e => setEvPlate(e.target.value.toUpperCase())}
                  placeholder="P 782-310"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    value={evBrand}
                    onChange={e => setEvBrand(e.target.value)}
                    placeholder="Toyota, Ford..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Modelo</label>
                  <input
                    type="text"
                    required
                    value={evModel}
                    onChange={e => setEvModel(e.target.value)}
                    placeholder="RAV4 Hybrid"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Año</label>
                  <input
                    type="number"
                    value={evYear}
                    onChange={e => setEvYear(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Color</label>
                  <input
                    type="text"
                    value={evColor}
                    onChange={e => setEvColor(e.target.value)}
                    className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Km Actual</label>
                  <input
                    type="number"
                    value={evMileage}
                    onChange={e => setEvMileage(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer"
                >
                  Agregar a la Flota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Editar Cliente */}
      {isEditClientModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/70">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-red-500" />
                <span>Editar Datos de {selectedClient.name}</span>
              </h3>
              <button
                onClick={() => setIsEditClientModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={editClientName}
                    onChange={e => setEditClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">WhatsApp / Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={editClientPhone}
                    onChange={e => setEditClientPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editClientEmail}
                    onChange={e => setEditClientEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">DUI / NIT (El Salvador)</label>
                  <input
                    type="text"
                    value={editClientIdentification}
                    onChange={e => setEditClientIdentification(e.target.value.toUpperCase())}
                    placeholder="Ej. 02345678-9 o NIT"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Dirección</label>
                <input
                  type="text"
                  value={editClientAddress}
                  onChange={e => setEditClientAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Notas del Cliente</label>
                <textarea
                  rows={2}
                  value={editClientNotes}
                  onChange={e => setEditClientNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditClientModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer"
                >
                  Actualizar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Vehículo */}
      {isEditVehicleModalOpen && editingVehicleIndex !== null && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/70">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-red-500" />
                <span>Editar Vehículo ({editVPlate})</span>
              </h3>
              <button
                onClick={() => setIsEditVehicleModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateVehicle} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Placas (El Salvador) *</label>
                <input
                  type="text"
                  required
                  value={editVPlate}
                  onChange={e => setEditVPlate(e.target.value.toUpperCase())}
                  placeholder="P 123-456"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    value={editVBrand}
                    onChange={e => setEditVBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Modelo</label>
                  <input
                    type="text"
                    required
                    value={editVModel}
                    onChange={e => setEditVModel(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Año</label>
                  <input
                    type="number"
                    value={editVYear}
                    onChange={e => setEditVYear(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Color</label>
                  <input
                    type="text"
                    value={editVColor}
                    onChange={e => setEditVColor(e.target.value)}
                    className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Km Actual</label>
                  <input
                    type="number"
                    value={editVMileage}
                    onChange={e => setEditVMileage(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditVehicleModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
