import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Budget, BudgetItem, BudgetStatus } from '../types';
import {
  FileText,
  Plus,
  Search,
  Printer,
  MessageSquare,
  Wrench,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Edit2,
  X,
  PlusCircle,
  Car,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/initialData';
import { Logo } from './Logo';
import { formatCurrency, formatUSD } from '../utils/format';
import confetti from 'canvas-confetti';

interface BudgetsViewProps {
  onOpenWhatsApp: (phone: string, clientName: string, template: any, data: any) => void;
  onNavigateToOT: () => void;
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  onOpenWhatsApp,
  onNavigateToOT,
  isCreateModalOpen = false,
  onCloseCreateModal,
}) => {
  const {
    budgets,
    createBudget,
    updateBudget,
    deleteBudget,
    convertBudgetToWorkOrder,
    clients,
    parts,
    hasPermission,
    workshopContact,
  } = useWorkshop();

  const canManageBudgets = hasPermission('canManageBudgets');
  const canDelete = hasPermission('canDeleteRecords');
  const canSendWhatsApp = hasPermission('canSendWhatsApp');
  const canManageWorkOrders = hasPermission('canManageWorkOrders');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(isCreateModalOpen);
  const [selectedBudgetForPrint, setSelectedBudgetForPrint] = useState<Budget | null>(null);

  // Form State
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(WORKSHOP_CONFIG.defaultTaxPercent);
  const [notes, setNotes] = useState('Garantía de 6 meses o 10,000 km en mano de obra y repuestos originales instalados.');
  const [items, setItems] = useState<BudgetItem[]>([
    {
      id: `bi-${Date.now()}-1`,
      type: 'mano_de_obra',
      description: 'Mano de obra especializada: Diagnóstico y servicio preventivo',
      quantity: 1,
      unitPrice: WORKSHOP_CONFIG.defaultLaborRate,
      total: WORKSHOP_CONFIG.defaultLaborRate,
    },
  ]);

  // Client Selection Helper
  const handleSelectClient = (id: string) => {
    setClientId(id);
    const found = clients.find(c => c.id === id);
    if (found) {
      setClientName(found.name);
      setClientPhone(found.phone);
      if (found.vehicles && found.vehicles.length > 0) {
        const v = found.vehicles[0];
        setVehiclePlate(v.plate);
        setVehicleModel(`${v.brand} ${v.model} (${v.year})`);
      }
    }
  };

  // Add Item Line
  const handleAddItem = (type: 'repuesto' | 'mano_de_obra') => {
    if (type === 'repuesto') {
      const firstPart = parts[0];
      setItems(prev => [
        ...prev,
        {
          id: `bi-${Date.now()}`,
          type: 'repuesto',
          partId: firstPart ? firstPart.id : undefined,
          description: firstPart ? firstPart.name : 'Repuesto Automotriz',
          quantity: 1,
          unitPrice: firstPart ? firstPart.salePrice : 45,
          total: firstPart ? firstPart.salePrice : 45,
        },
      ]);
    } else {
      setItems(prev => [
        ...prev,
        {
          id: `bi-${Date.now()}`,
          type: 'mano_de_obra',
          description: 'Mano de obra especializada / Servicio técnico',
          quantity: 1,
          unitPrice: WORKSHOP_CONFIG.defaultLaborRate,
          total: WORKSHOP_CONFIG.defaultLaborRate,
        },
      ]);
    }
  };

  const handleUpdateItem = (index: number, updates: Partial<BudgetItem>) => {
    setItems(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const merged = { ...item, ...updates };
        if (merged.type === 'mano_de_obra') {
          merged.quantity = 1;
          if (updates.total !== undefined) {
            merged.unitPrice = Number(updates.total);
          } else if (updates.unitPrice !== undefined) {
            merged.total = Number(updates.unitPrice);
          }
        } else {
          merged.total = Number(merged.quantity) * Number(merged.unitPrice);
        }
        return merged;
      })
    );
  };

  const handleSelectPartForItem = (index: number, partId: string) => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;
    handleUpdateItem(index, {
      partId: part.id,
      description: `${part.name} (${part.brand})`,
      unitPrice: part.salePrice,
      total: part.salePrice * (items[index]?.quantity || 1),
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Live Totals calculation
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !vehiclePlate || items.length === 0) {
      alert('Por favor completa los datos del cliente, vehículo e ítems cotizados.');
      return;
    }

    createBudget({
      clientId: clientId || `cli-temp-${Date.now()}`,
      clientName,
      clientPhone,
      vehiclePlate,
      vehicleModel: vehicleModel || 'Vehículo',
      date,
      expiryDate,
      status: 'enviado',
      items,
      taxPercent,
      discountAmount,
      notes,
    });

    confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    setIsModalOpen(false);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  // Convert to Work Order
  const handleConvert = (b: Budget) => {
    if (confirm(`¿Convertir presupuesto ${b.quoteNumber} a Orden de Trabajo y descontar repuestos del inventario?`)) {
      const newOT = convertBudgetToWorkOrder(b.id);
      if (newOT) {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        onNavigateToOT();
      }
    }
  };

  const filteredBudgets = budgets.filter(b => {
    const matchesSearch =
      b.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.clientName.toLowerCase().includes(search.toLowerCase()) ||
      b.vehiclePlate.toLowerCase().includes(search.toLowerCase()) ||
      b.vehicleModel.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (st: BudgetStatus) => {
    switch (st) {
      case 'aprobado':
        return <span className="text-emerald-400 font-semibold">Aprobado</span>;
      case 'enviado':
        return <span className="text-blue-400 font-medium">Enviado al Cliente</span>;
      case 'convertido_a_ot':
        return <span className="text-purple-400 font-semibold">En Orden de Trabajo (OT)</span>;
      case 'borrador':
        return <span className="text-neutral-400 font-medium">Borrador</span>;
      case 'rechazado':
        return <span className="text-red-400 font-medium">Rechazado</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className={selectedBudgetForPrint ? 'no-print space-y-6' : 'space-y-6'}>
        {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-red-500" />
            <span>Presupuestos Automáticos & Cotizaciones</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Cálculo instantáneo con inventario en tiempo real y conversión directa a orden de trabajo
          </p>
        </div>

        {canManageBudgets && (
          <button
            onClick={() => {
              setItems([
                {
                  id: `bi-${Date.now()}-1`,
                  type: 'mano_de_obra',
                  description: 'Mano de obra: Afinación mayor y escáner de diagnóstico',
                  quantity: 1,
                  unitPrice: WORKSHOP_CONFIG.defaultLaborRate,
                  total: WORKSHOP_CONFIG.defaultLaborRate,
                },
              ]);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-950 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Generar Presupuesto Automático</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por cotización, cliente, auto o placas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'enviado', label: 'Enviados' },
            { id: 'aprobado', label: 'Aprobados' },
            { id: 'convertido_a_ot', label: 'Convertidos a OT' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === st.id ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budgets List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {filteredBudgets.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            No se encontraron presupuestos registrados con los filtros actuales.
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {filteredBudgets.map(b => (
              <div
                key={b.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-neutral-850/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 text-red-400">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-white">{b.quoteNumber}</span>
                      <span className="text-xs text-neutral-400">·</span>
                      <span className="font-semibold text-neutral-200 text-sm">{b.clientName}</span>
                      <span className="font-mono text-xs text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                        {b.vehiclePlate}
                      </span>
                      <span className="text-xs">{getStatusBadge(b.status)}</span>
                    </div>

                    <p className="text-xs text-neutral-400">
                      Vehículo: <strong className="text-neutral-300">{b.vehicleModel}</strong> · Fecha: {b.date} · Vence: {b.expiryDate}
                    </p>

                    <p className="text-xs text-neutral-400">
                      Incluye: <span className="text-neutral-300">{b.items.length} conceptos</span> (
                      {b.items.filter(i => i.type === 'repuesto').length} repuestos,{' '}
                      {b.items.filter(i => i.type === 'mano_de_obra').length} mano de obra)
                    </p>
                  </div>
                </div>

                {/* Right: Total & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-mono text-neutral-500 block">Total Cotizado</span>
                    <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                      {formatCurrency(b.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* View / Print button */}
                    <button
                      onClick={() => setSelectedBudgetForPrint(b)}
                      className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Ver e imprimir presupuesto formal"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver / Imprimir</span>
                    </button>

                    {/* WhatsApp button */}
                    {canSendWhatsApp && (
                      <button
                        onClick={() =>
                          onOpenWhatsApp(b.clientPhone, b.clientName, 'presupuesto', {
                            quoteNumber: b.quoteNumber,
                            vehicle: b.vehicleModel,
                            plate: b.vehiclePlate,
                            total: b.total,
                          })
                        }
                        className="px-2.5 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Enviar presupuesto por WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    )}

                    {/* 1-Click Convert to Work Order */}
                    {b.status !== 'convertido_a_ot' ? (
                      canManageWorkOrders && (
                        <button
                          onClick={() => handleConvert(b)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-sm shadow-red-950"
                          title="Crear Orden de Trabajo automáticamente"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Aprobar y Crear OT</span>
                        </button>
                      )
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>OT Activa</span>
                      </span>
                    )}

                    {/* Delete */}
                    {canDelete && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar presupuesto ${b.quoteNumber}?`)) {
                            deleteBudget(b.id);
                          }
                        }}
                        className="p-1.5 text-neutral-500 hover:text-red-400 rounded cursor-pointer"
                        title="Eliminar presupuesto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Generador Automático de Presupuesto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/70">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-500" />
                  <span>Nuevo Presupuesto Automático</span>
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Agrega repuestos con stock disponible y mano de obra
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Client Auto Selector */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Cliente Registrado (Opcional)
                </label>
                <select
                  onChange={e => handleSelectClient(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-red-500"
                >
                  <option value="">-- Seleccionar cliente para autocompletar --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.vehicles[0]?.brand} {c.vehicles[0]?.model} ({c.vehicles[0]?.plate})
                    </option>
                  ))}
                </select>
              </div>

              {/* Client & Vehicle fields */}
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
                  <label className="block text-xs font-medium text-neutral-300 mb-1">WhatsApp / Teléfono *</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Vehículo (Marca, Modelo, Año)</label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={e => setVehicleModel(e.target.value)}
                    placeholder="Ej. Honda Civic 2022"
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

              {/* Items Section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs">Conceptos del Presupuesto</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddItem('repuesto')}
                      className="px-2.5 py-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Repuesto de Inventario</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('mano_de_obra')}
                      className="px-2.5 py-1 text-[11px] font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Mano de Obra</span>
                    </button>
                  </div>
                </div>

                {/* Items List Table / Row */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-neutral-500 uppercase">
                          {item.type === 'repuesto' ? '📦 Repuesto' : '🔧 Mano de Obra'} #{idx + 1}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {item.type === 'repuesto' ? (
                        <div>
                          <label className="text-[10px] text-neutral-400 block mb-0.5">
                            Seleccionar Pieza de Almacén:
                          </label>
                          <select
                            value={item.partId || ''}
                            onChange={e => handleSelectPartForItem(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 text-xs focus:outline-none"
                          >
                            {parts.map(p => (
                              <option key={p.id} value={p.id}>
                                [{p.sku}] {p.name} - Stock: {p.stockQuantity} un. (${p.salePrice} USD)
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] text-neutral-400 block mb-0.5">
                            Descripción del trabajo:
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={e => handleUpdateItem(idx, { description: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 text-xs focus:outline-none"
                          />
                        </div>
                      )}

                      {item.type === 'mano_de_obra' ? (
                        <div className="pt-1">
                          <label className="text-[10px] font-semibold text-neutral-300 block mb-0.5">
                            Precio Mano de Obra Total ($ USD):
                          </label>
                          <div className="relative max-w-xs">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">$</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.total}
                              onChange={e => {
                                const val = Number(e.target.value) || 0;
                                handleUpdateItem(idx, { total: val, unitPrice: val, quantity: 1 });
                              }}
                              placeholder="Ej. 35.00"
                              className="w-full pl-6 pr-3 py-1.5 bg-neutral-900 border border-neutral-700 focus:border-red-500 rounded-md text-white font-mono font-semibold text-xs focus:outline-none"
                            />
                          </div>
                          <span className="text-[10px] text-neutral-500 mt-0.5 block">
                            Monto fijo total de mano de obra para este servicio (sin cobro por hora)
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div>
                            <label className="text-[10px] text-neutral-400 block mb-0.5">
                              Cantidad
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={e => handleUpdateItem(idx, { quantity: Number(e.target.value) })}
                              className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-md text-white font-mono text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-neutral-400 block mb-0.5">
                              Precio Unitario ($ USD)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="5"
                              value={item.unitPrice}
                              onChange={e => handleUpdateItem(idx, { unitPrice: Number(e.target.value) })}
                              className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-md text-white font-mono text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-neutral-400 block mb-0.5">Total Concepto (USD)</label>
                            <div className="w-full px-2 py-1 bg-neutral-900/60 border border-neutral-800 rounded-md text-emerald-400 font-mono font-semibold text-xs tabular-nums">
                              {formatUSD(item.total)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Summary Bar */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Subtotal Conceptos:</span>
                  <span className="font-mono text-white tabular-nums">
                    {formatUSD(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-400 gap-4">
                  <div className="flex items-center gap-1.5">
                    <span>IVA (%):</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxPercent}
                      onChange={e => setTaxPercent(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-center text-white font-mono text-xs"
                    />
                  </div>
                  <span className="font-mono text-white tabular-nums">
                    {formatUSD(taxAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-400 gap-4">
                  <div className="flex items-center gap-1.5">
                    <span>Descuento Comercial ($ USD):</span>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={e => setDiscountAmount(Number(e.target.value))}
                      className="w-24 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-center text-amber-300 font-mono text-xs"
                    />
                  </div>
                  <span className="font-mono text-amber-300 tabular-nums">
                    -{formatUSD(discountAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-sm font-bold">
                  <span className="text-white">TOTAL DEL PRESUPUESTO:</span>
                  <span className="font-mono text-emerald-400 tabular-nums text-base">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Términos y Notas de Garantía
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
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
                  Generar y Guardar Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Modal: Vista Formal / Impresión de Presupuesto */}
      {selectedBudgetForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs print-modal-container">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none print:overflow-visible">
            {/* Header controls (hidden in print) */}
            <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/70">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Vista Previa para Cliente / Impresión</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  1 Sola Copia (1 Hoja)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-950"
                  title="Imprimir presupuesto en 1 sola copia"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir (1 Sola Copia)</span>
                </button>
                <button
                  onClick={() => setSelectedBudgetForPrint(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-5 sm:p-6 overflow-y-auto bg-neutral-950 text-white font-sans text-xs space-y-4 print:space-y-3 print:p-2 print-clean print-single-page">
              {/* Header with Workshop Logo */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <Logo className="w-16 h-16 shrink-0" theme="dark" showText={false} />
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight text-white uppercase">
                      {workshopContact.name}
                    </h2>
                    <p className="text-[11px] text-neutral-400">{workshopContact.legalName}</p>
                    <p className="text-[11px] text-neutral-400">{workshopContact.address}</p>
                    <div className="text-[11px] text-neutral-300 font-medium mt-0.5">
                      <span className="text-red-400 font-semibold">Jefe de Taller:</span> {workshopContact.bossName}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      Tel / WhatsApp: <span className="text-white">{workshopContact.phone}</span> · Correo: <span className="text-white">{workshopContact.email}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {workshopContact.taxId} · {workshopContact.taxNRC}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-red-400">Presupuesto Formal</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {selectedBudgetForPrint.quoteNumber}
                  </div>
                  <div className="text-neutral-400 text-[11px] mt-1">
                    Fecha de Emisión: {selectedBudgetForPrint.date}
                  </div>
                  <div className="text-neutral-400 text-[11px]">
                    Válido hasta: {selectedBudgetForPrint.expiryDate}
                  </div>
                </div>
              </div>

              {/* Client & Vehicle Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <div>
                  <span className="text-[10px] uppercase font-mono text-neutral-500 block mb-1">
                    Datos del Cliente
                  </span>
                  <div className="font-semibold text-white text-sm">{selectedBudgetForPrint.clientName}</div>
                  <div className="text-neutral-400 font-mono mt-0.5">Tel: {selectedBudgetForPrint.clientPhone}</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-neutral-500 block mb-1">
                    Datos del Vehículo
                  </span>
                  <div className="font-semibold text-white text-sm">{selectedBudgetForPrint.vehicleModel}</div>
                  <div className="text-neutral-400 font-mono mt-0.5">
                    Placas: <strong className="text-white">{selectedBudgetForPrint.vehiclePlate}</strong>
                  </div>
                </div>
              </div>

              {/* Table of items */}
              <div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 uppercase font-mono text-[10px]">
                      <th className="py-2 px-3">Tipo</th>
                      <th className="py-2 px-3">Descripción / Referencia</th>
                      <th className="py-2 px-3 text-center">Cantidad</th>
                      <th className="py-2 px-3 text-right">P. Unitario</th>
                      <th className="py-2 px-3 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {selectedBudgetForPrint.items.map(item => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-400">
                          {item.type === 'repuesto' ? 'Repuesto' : 'Mano de Obra'}
                        </td>
                        <td className="py-2.5 px-3 text-white font-medium">{item.description}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-neutral-300">
                          {item.type === 'mano_de_obra' ? '1 serv.' : item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-400 tabular-nums">
                          {formatUSD(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-white font-semibold tabular-nums">
                          {formatUSD(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals breakdown */}
              <div className="flex justify-end pt-4 border-t border-neutral-800">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">
                      {formatUSD(selectedBudgetForPrint.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>IVA ({selectedBudgetForPrint.taxPercent}%):</span>
                    <span className="font-mono text-white">
                      {formatUSD(selectedBudgetForPrint.taxAmount)}
                    </span>
                  </div>
                  {selectedBudgetForPrint.discountAmount > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>Descuento Especial:</span>
                      <span className="font-mono">
                        -{formatUSD(selectedBudgetForPrint.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-neutral-800 text-sm font-bold text-emerald-400">
                    <span>TOTAL:</span>
                    <span className="font-mono text-base">
                      {formatCurrency(selectedBudgetForPrint.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warranty and legal note */}
              {selectedBudgetForPrint.notes && (
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
                  <strong className="text-neutral-300 block mb-0.5">Términos de Servicio y Garantía:</strong>
                  {selectedBudgetForPrint.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-800 text-center">
                <div className="pt-8 border-t border-neutral-700">
                  <span className="text-[10px] text-neutral-400 block uppercase font-mono">
                    Por Taller Rodríguez Rodríguez
                  </span>
                  <span className="text-xs text-white font-medium">VlaSwink51 - Administrador de Taller</span>
                </div>
                <div className="pt-8 border-t border-neutral-700">
                  <span className="text-[10px] text-neutral-400 block uppercase font-mono">
                    Firma de Aprobación del Cliente
                  </span>
                  <span className="text-xs text-white font-medium">{selectedBudgetForPrint.clientName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
