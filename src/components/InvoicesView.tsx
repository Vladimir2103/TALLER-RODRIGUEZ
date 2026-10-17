import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Printer,
  Share2,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  Ban,
  Wrench,
  DollarSign,
  Calendar,
  User as UserIcon,
  Car,
  FileText,
  AlertCircle,
  FileCheck,
  Percent,
  X,
  CreditCard,
  Building2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { FinalConsumerInvoice, InvoiceStatus, InvoicePaymentMethod, WorkOrder, Budget, Client } from '../types';
import { WORKSHOP_CONFIG } from '../data/initialData';

// Helper: Convert number to Spanish words for official invoice footer (El Salvador USD)
function numberToSpanishWords(amount: number): string {
  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const fixed = amount.toFixed(2);
  const [intPartStr, decPartStr] = fixed.split('.');
  let n = parseInt(intPartStr, 10);
  const dec = decPartStr || '00';

  if (n === 0) return `CERO CON ${dec}/100 USD`;
  if (n === 100) return `CIEN CON ${dec}/100 USD`;

  function convertGroup(val: number): string {
    let output = '';
    const c = Math.floor(val / 100);
    const remainder = val % 100;

    if (val === 100) return 'CIEN';
    if (c > 0) output += hundreds[c] + ' ';

    if (remainder >= 10 && remainder <= 19) {
      output += teens[remainder - 10] + ' ';
    } else if (remainder >= 20) {
      const t = Math.floor(remainder / 10);
      const u = remainder % 10;
      if (remainder === 20) output += 'VEINTE ';
      else if (t === 2) output += 'VEINTI' + units[u] + ' ';
      else {
        output += tens[t] + (u > 0 ? ' Y ' + units[u] : '') + ' ';
      }
    } else if (remainder > 0) {
      output += units[remainder] + ' ';
    }
    return output.trim();
  }

  let words = '';
  if (n >= 1000000) {
    const millions = Math.floor(n / 1000000);
    words += (millions === 1 ? 'UN MILLÓN ' : convertGroup(millions) + ' MILLONES ');
    n %= 1000000;
  }
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    words += (thousands === 1 ? 'MIL ' : convertGroup(thousands) + ' MIL ');
    n %= 1000;
  }
  if (n > 0) {
    words += convertGroup(n) + ' ';
  }

  return `${words.trim()} CON ${dec}/100 USD`;
}

interface InvoicesViewProps {
  onOpenWhatsApp?: (phone: string, clientName: string, template: any, data: any) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ onOpenWhatsApp }) => {
  const {
    invoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    generateInvoiceFromWorkOrder,
    generateInvoiceFromBudget,
    workOrders,
    budgets,
    clients,
    workshopContact,
    hasPermission,
    currentUser,
  } = useWorkshop();

  const activeContact = workshopContact || WORKSHOP_CONFIG;
  const canManage = hasPermission('canManageInvoices') || hasPermission('canManageBudgets') || currentUser?.role === 'boss';
  const canDelete = hasPermission('canDeleteRecords') || currentUser?.role === 'boss';

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | InvoiceStatus>('todos');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportOTModalOpen, setIsImportOTModalOpen] = useState(false);
  const [isImportBudgetModalOpen, setIsImportBudgetModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<FinalConsumerInvoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<FinalConsumerInvoice | null>(null);

  // Form State for Manual / Edit
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>('emitida');
  const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethod>('Efectivo');

  // Client info form
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientIdentification, setClientIdentification] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState<number | string>(2020);

  // EXACTLY 2 LINE ITEMS (Requerimiento estricto)
  const [laborDescription, setLaborDescription] = useState('Mano de obra y servicios de diagnóstico mecánico especializado');
  const [laborAmount, setLaborAmount] = useState<number | ''>(0);

  const [partsDescription, setPartsDescription] = useState('Total de repuestos, lubricantes e insumos originales');
  const [partsTotalAmount, setPartsTotalAmount] = useState<number | ''>(0);

  // EDITABLE IVA (Requerimiento estricto: que se pueda editar el IVA y haga el total)
  const [taxPercent, setTaxPercent] = useState<number>(13); // 13% El Salvador standard default
  const [discountAmount, setDiscountAmount] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');
  const [warrantyNotes, setWarrantyNotes] = useState(activeContact.warrantyTerms || 'Garantía por escrito de 6 meses o 10,000 km en mano de obra y repuestos originales instalados.');

  // Live Computed values for form
  const parsedLabor = typeof laborAmount === 'number' ? laborAmount : 0;
  const parsedParts = typeof partsTotalAmount === 'number' ? partsTotalAmount : 0;
  const parsedDiscount = typeof discountAmount === 'number' ? discountAmount : 0;
  const formSubtotal = Number((parsedLabor + parsedParts).toFixed(2));
  const formTaxableBase = Math.max(0, formSubtotal - parsedDiscount);
  const formTaxAmount = Number(((formTaxableBase * (taxPercent || 0)) / 100).toFixed(2));
  const formTotal = Number((formTaxableBase + formTaxAmount).toFixed(2));

  // Quick select existing client
  const handleClientSelect = (cId: string) => {
    setSelectedClientId(cId);
    const client = clients.find(c => c.id === cId);
    if (client) {
      setClientName(client.name);
      setClientPhone(client.phone);
      setClientEmail(client.email || '');
      setClientIdentification(client.identification || '');
      setClientAddress(client.address || '');
      if (client.vehicles && client.vehicles.length > 0) {
        setVehiclePlate(client.vehicles[0].plate);
        setVehicleModel(`${client.vehicles[0].brand} ${client.vehicles[0].model}`);
        setVehicleYear(client.vehicles[0].year);
      }
    }
  };

  const handleOpenCreateModal = () => {
    const nextNum = `FCF-${String(invoices.length + 1).padStart(4, '0')}`;
    setEditingInvoice(null);
    setInvoiceNumber(nextNum);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setInvoiceDueDate(new Date().toISOString().split('T')[0]);
    setInvoiceStatus('emitida');
    setPaymentMethod('Efectivo');
    setSelectedClientId('');
    setClientName('');
    setClientIdentification('');
    setClientPhone('');
    setClientEmail('');
    setClientAddress('');
    setVehiclePlate('');
    setVehicleModel('');
    setVehicleYear(2022);
    setLaborDescription('Mano de obra especializada y servicios mecánicos');
    setLaborAmount(0);
    setPartsDescription('Total de repuestos, lubricantes y materiales utilizados');
    setPartsTotalAmount(0);
    setTaxPercent(13);
    setDiscountAmount(0);
    setNotes('Gracias por confiar en Taller Rodríguez Rodríguez. Conserve esta factura como comprobante de garantía.');
    setWarrantyNotes(activeContact.warrantyTerms || 'Garantía por escrito de 6 meses o 10,000 km en mano de obra y repuestos originales instalados.');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (inv: FinalConsumerInvoice) => {
    setEditingInvoice(inv);
    setInvoiceNumber(inv.invoiceNumber);
    setInvoiceDate(inv.date);
    setInvoiceDueDate(inv.dueDate || inv.date);
    setInvoiceStatus(inv.status);
    setPaymentMethod(inv.paymentMethod);
    setSelectedClientId(inv.clientId || '');
    setClientName(inv.clientName);
    setClientIdentification(inv.clientIdentification || '');
    setClientPhone(inv.clientPhone);
    setClientEmail(inv.clientEmail || '');
    setClientAddress(inv.clientAddress || '');
    setVehiclePlate(inv.vehiclePlate || '');
    setVehicleModel(inv.vehicleModel || '');
    setVehicleYear(inv.vehicleYear || 2022);
    setLaborDescription(inv.laborDescription);
    setLaborAmount(inv.laborAmount);
    setPartsDescription(inv.partsDescription);
    setPartsTotalAmount(inv.partsTotalAmount);
    setTaxPercent(inv.taxPercent);
    setDiscountAmount(inv.discountAmount || 0);
    setNotes(inv.notes || '');
    setWarrantyNotes(inv.warrantyNotes || activeContact.warrantyTerms || '');
    setIsCreateModalOpen(true);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Por favor ingresa el nombre del cliente para la factura.');
      return;
    }

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, {
        invoiceNumber,
        date: invoiceDate,
        dueDate: invoiceDueDate,
        status: invoiceStatus,
        paymentMethod,
        clientId: selectedClientId || undefined,
        clientName: clientName.trim(),
        clientIdentification: clientIdentification.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        clientAddress: clientAddress.trim(),
        vehiclePlate: vehiclePlate.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleYear: typeof vehicleYear === 'number' ? vehicleYear : parseInt(String(vehicleYear)) || 2022,
        laborDescription: laborDescription.trim() || 'Mano de obra y servicios técnicos',
        laborAmount: parsedLabor,
        partsDescription: partsDescription.trim() || 'Total de repuestos y materiales',
        partsTotalAmount: parsedParts,
        taxPercent,
        discountAmount: parsedDiscount,
        notes: notes.trim(),
        warrantyNotes: warrantyNotes.trim(),
      });
      setIsCreateModalOpen(false);
      setEditingInvoice(null);
    } else {
      createInvoice({
        invoiceNumber,
        date: invoiceDate,
        dueDate: invoiceDueDate,
        status: invoiceStatus,
        paymentMethod,

        // Workshop header data
        workshopName: activeContact.name || WORKSHOP_CONFIG.name,
        workshopLegalName: activeContact.legalName || WORKSHOP_CONFIG.legalName,
        workshopTaxId: activeContact.taxId || WORKSHOP_CONFIG.taxId,
        workshopNRC: activeContact.taxNRC || WORKSHOP_CONFIG.taxNRC,
        workshopActivity: activeContact.businessActivity || WORKSHOP_CONFIG.businessActivity,
        workshopAddress: activeContact.address || WORKSHOP_CONFIG.address,
        workshopPhone: activeContact.phone || WORKSHOP_CONFIG.phone,
        workshopEmail: activeContact.email || WORKSHOP_CONFIG.email,

        // Client & Vehicle data
        clientId: selectedClientId || undefined,
        clientName: clientName.trim(),
        clientIdentification: clientIdentification.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        clientAddress: clientAddress.trim(),
        vehiclePlate: vehiclePlate.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleYear: typeof vehicleYear === 'number' ? vehicleYear : parseInt(String(vehicleYear)) || 2022,

        // Exactly 2 line items
        laborDescription: laborDescription.trim() || 'Mano de obra y servicios técnicos',
        laborAmount: parsedLabor,
        partsDescription: partsDescription.trim() || 'Total de repuestos y materiales',
        partsTotalAmount: parsedParts,

        subtotal: formSubtotal,
        taxPercent,
        taxAmount: formTaxAmount,
        discountAmount: parsedDiscount,
        total: formTotal,

        notes: notes.trim(),
        warrantyNotes: warrantyNotes.trim(),
      });
      setIsCreateModalOpen(false);
    }
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchStatus = statusFilter === 'todos' || inv.status === statusFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.clientName.toLowerCase().includes(term) ||
        (inv.vehiclePlate && inv.vehiclePlate.toLowerCase().includes(term)) ||
        (inv.clientIdentification && inv.clientIdentification.toLowerCase().includes(term)) ||
        (inv.otNumber && inv.otNumber.toLowerCase().includes(term));
      return matchStatus && matchSearch;
    });
  }, [invoices, statusFilter, searchTerm]);

  // Overall financial summary metrics
  const totalBilled = useMemo(() => {
    return invoices.filter(i => i.status !== 'anulada').reduce((sum, i) => sum + i.total, 0);
  }, [invoices]);

  const totalTaxCollected = useMemo(() => {
    return invoices.filter(i => i.status !== 'anulada').reduce((sum, i) => sum + i.taxAmount, 0);
  }, [invoices]);

  const paidCount = useMemo(() => {
    return invoices.filter(i => i.status === 'pagada').length;
  }, [invoices]);

  // WhatsApp share
  const handleShareWhatsApp = (inv: FinalConsumerInvoice) => {
    const text =
      `*FACTURA DE CONSUMIDOR FINAL - TALLER AUTOMOTRIZ RODRÍGUEZ RODRÍGUEZ*\n` +
      `🧾 *Factura N°:* ${inv.invoiceNumber}\n` +
      `📅 *Fecha:* ${inv.date}\n` +
      `👤 *Cliente:* ${inv.clientName}\n` +
      `🚗 *Vehículo:* ${inv.vehicleModel || 'Vehículo'} [${inv.vehiclePlate || 'N/A'}]\n\n` +
      `*DETALLE DE FACTURA (2 RENGLONES):*\n` +
      `1️⃣ *Mano de Obra:* $${inv.laborAmount.toFixed(2)} USD\n` +
      `   _${inv.laborDescription}_\n` +
      `2️⃣ *Total de Repuestos:* $${inv.partsTotalAmount.toFixed(2)} USD\n` +
      `   _${inv.partsDescription}_\n\n` +
      `*RESUMEN:*\n` +
      `• *Subtotal:* $${inv.subtotal.toFixed(2)} USD\n` +
      `• *IVA (${inv.taxPercent}%):* $${inv.taxAmount.toFixed(2)} USD\n` +
      `💰 *TOTAL A PAGAR:* $${inv.total.toFixed(2)} USD\n` +
      `📌 *Estado:* ${inv.status.toUpperCase()}\n\n` +
      `📍 *Taller Rodríguez Rodríguez:* ${activeContact.address}\n` +
      `📞 *Teléfono:* ${activeContact.phone} · ${activeContact.tagline || ''}`;

    if (onOpenWhatsApp && inv.clientPhone) {
      onOpenWhatsApp(inv.clientPhone, inv.clientName, 'personalizado', { customMessage: text });
    } else {
      const cleanPhone = (inv.clientPhone || '').replace(/\D/g, '');
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-500">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Facturas de Consumidor Final
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-red-600/20 text-red-400 border border-red-600/30">
                Oficial Taller Rodríguez
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Módulo de facturación directa a clientes con encabezado y datos oficiales del taller, IVA 100% editable con cálculo automático de totales y exactamente dos renglones de desglose: <span className="text-neutral-200 font-semibold">Mano de Obra</span> y <span className="text-neutral-200 font-semibold">Total de Repuestos</span>.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsImportOTModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              title="Cargar automáticamente datos de cliente, vehículo, mano de obra y repuestos desde una Orden de Trabajo"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Desde Orden (OT)</span>
            </button>

            <button
              onClick={() => setIsImportBudgetModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              title="Cargar desde un Presupuesto o Cotización"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Desde Presupuesto</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Factura</span>
            </button>
          </div>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Total Facturado</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono mt-2">
            ${totalBilled.toFixed(2)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 font-mono">
            {invoices.length} factura(s) registrada(s)
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>IVA Total Recaudado</span>
            <Percent className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-400 font-mono mt-2">
            ${totalTaxCollected.toFixed(2)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Impuesto al Valor Agregado
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Facturas Pagadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-2">
            {paidCount}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {invoices.length > 0 ? `${Math.round((paidCount / invoices.length) * 100)}% de cobro` : 'Sin registros'}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Encabezado Oficial</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xs font-bold text-white truncate mt-2" title={activeContact.name}>
            {activeContact.name}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono truncate mt-0.5">
            {activeContact.taxId || 'NIT Oficial Configurado'}
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por N° factura (FCF-0001), cliente, placa, DUI/NIT u OT..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-neutral-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Estado:
          </span>
          {(['todos', 'emitida', 'pagada', 'anulada'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-red-600 text-white font-semibold'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List / Table */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No hay facturas registradas</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
              {searchTerm || statusFilter !== 'todos'
                ? 'No se encontraron facturas con los filtros de búsqueda aplicados.'
                : 'Genera tu primera factura de consumidor final con los datos del taller, IVA editable y los dos renglones de mano de obra y repuestos.'}
            </p>
          </div>
          {canManage && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                + Crear Factura Manual
              </button>
              {workOrders.length > 0 && (
                <button
                  onClick={() => setIsImportOTModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors cursor-pointer border border-neutral-700 flex items-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  Facturar desde OT
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/70 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">N° Factura</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente & Vehículo</th>
                  <th className="py-3 px-4">Desglose (2 Detalles)</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">IVA</th>
                  <th className="py-3 px-4 text-right">Total Factura</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredInvoices.map(inv => {
                  const statusColors = {
                    pagada: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    emitida: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    anulada: 'bg-red-500/10 text-red-400 border-red-500/30 line-through',
                  }[inv.status];

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-neutral-850/60 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{inv.invoiceNumber}</span>
                        </div>
                        {inv.otNumber && (
                          <span className="block text-[10px] text-neutral-400 font-mono mt-0.5">
                            OT: {inv.otNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-neutral-300 font-mono whitespace-nowrap">
                        {inv.date}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white truncate max-w-[180px]">
                          {inv.clientName}
                        </div>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                          {inv.vehiclePlate && (
                            <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono">
                              {inv.vehiclePlate}
                            </span>
                          )}
                          <span className="truncate max-w-[140px]">{inv.vehicleModel || 'S/V'}</span>
                        </div>
                        {inv.clientIdentification && (
                          <div className="text-[10px] text-neutral-400 font-mono">
                            DUI/NIT: {inv.clientIdentification}
                          </div>
                        )}
                      </td>

                      {/* Desglose de los 2 renglones estrictos */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-neutral-400 flex items-center gap-1 truncate max-w-[150px]">
                              <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
                              Mano de Obra:
                            </span>
                            <span className="font-mono text-white font-medium">
                              ${inv.laborAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-neutral-400 flex items-center gap-1 truncate max-w-[150px]">
                              <Car className="w-3 h-3 text-blue-400 shrink-0" />
                              Total Repuestos:
                            </span>
                            <span className="font-mono text-white font-medium">
                              ${inv.partsTotalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-neutral-300 text-right whitespace-nowrap">
                        ${inv.subtotal.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-right whitespace-nowrap">
                        <div className="text-neutral-300">${inv.taxAmount.toFixed(2)}</div>
                        <span className="text-[10px] text-neutral-400 bg-neutral-800 px-1 rounded">
                          {inv.taxPercent}% IVA
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-right text-sm whitespace-nowrap">
                        ${inv.total.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors}`}>
                          {inv.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver e Imprimir Oficial */}
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer transition-colors"
                            title="Ver e Imprimir Factura Oficial"
                          >
                            <Printer className="w-4 h-4 text-neutral-300" />
                          </button>

                          {/* WhatsApp */}
                          <button
                            onClick={() => handleShareWhatsApp(inv)}
                            className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/50 text-emerald-400 cursor-pointer transition-colors"
                            title="Enviar resumen por WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Editar */}
                          {canManage && (
                            <button
                              onClick={() => handleOpenEditModal(inv)}
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer transition-colors"
                              title="Editar Factura"
                            >
                              <Edit className="w-4 h-4 text-neutral-300" />
                            </button>
                          )}

                          {/* Cambiar Estado Rápido */}
                          {canManage && (
                            <button
                              onClick={() => {
                                const nextState: Record<InvoiceStatus, InvoiceStatus> = {
                                  emitida: 'pagada',
                                  pagada: 'anulada',
                                  anulada: 'emitida',
                                };
                                updateInvoice(inv.id, { status: nextState[inv.status] });
                              }}
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer transition-colors"
                              title={`Cambiar estado (actual: ${inv.status})`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Eliminar */}
                          {canDelete && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Estás seguro de eliminar permanentemente la factura ${inv.invoiceNumber}?`)) {
                                  deleteInvoice(inv.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950/80 hover:text-red-400 text-neutral-400 cursor-pointer transition-colors"
                              title="Eliminar Factura"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FACTURAR DESDE ORDEN DE TRABAJO (OT)                             */}
      {/* ========================================================================= */}
      {isImportOTModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Facturar desde Orden de Trabajo (OT)</h3>
                  <p className="text-xs text-neutral-400">
                    Selecciona una OT para importar automáticamente el cliente, vehículo, total de mano de obra y suma de repuestos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportOTModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {workOrders.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  No hay órdenes de trabajo registradas en el sistema.
                </div>
              ) : (
                workOrders.map(order => {
                  const partsTotal = (order.partsUsed || []).reduce((s, p) => s + (p.total || p.quantity * p.unitPrice), 0);
                  const laborTotal = order.laborTotal || 0;
                  const alreadyInvoiced = invoices.some(i => i.workOrderId === order.id || i.otNumber === order.otNumber);

                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{order.otNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-800 text-neutral-300">
                            {order.stage.replace('_', ' ')}
                          </span>
                          {alreadyInvoiced && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Ya Facturada
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white font-medium">
                          {order.clientName} · <span className="text-neutral-400">{order.vehicleBrand} {order.vehicleModel} [{order.vehiclePlate}]</span>
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {order.reportedFault}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono pt-1 text-neutral-300">
                          <span>Mano de Obra: <strong className="text-white">${laborTotal.toFixed(2)}</strong></span>
                          <span>Repuestos: <strong className="text-white">${partsTotal.toFixed(2)}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const generated = generateInvoiceFromWorkOrder(order.id, 13);
                          setIsImportOTModalOpen(false);
                          if (generated) {
                            setViewInvoice(generated);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>Generar Factura</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FACTURAR DESDE PRESUPUESTO                                       */}
      {/* ========================================================================= */}
      {isImportBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Facturar desde Presupuesto / Cotización</h3>
                  <p className="text-xs text-neutral-400">
                    Convierte una cotización en factura con los 2 renglones de mano de obra y repuestos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportBudgetModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {budgets.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  No hay presupuestos registrados en el sistema.
                </div>
              ) : (
                budgets.map(b => {
                  const laborTotal = b.items.filter(i => i.type === 'mano_de_obra').reduce((s, i) => s + i.total, 0);
                  const partsTotal = b.items.filter(i => i.type === 'repuesto').reduce((s, i) => s + i.total, 0);

                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{b.quoteNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-800 text-neutral-300">
                            {b.status}
                          </span>
                        </div>
                        <div className="text-xs text-white font-medium">
                          {b.clientName} · <span className="text-neutral-400">{b.vehicleModel} [{b.vehiclePlate}]</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono pt-1 text-neutral-300">
                          <span>Mano de Obra: <strong className="text-white">${laborTotal.toFixed(2)}</strong></span>
                          <span>Repuestos: <strong className="text-white">${partsTotal.toFixed(2)}</strong></span>
                          <span>Total: <strong className="text-emerald-400">${b.total.toFixed(2)}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const generated = generateInvoiceFromBudget(b.id, 13);
                          setIsImportBudgetModalOpen(false);
                          if (generated) {
                            setViewInvoice(generated);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>Generar Factura</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREAR / EDITAR FACTURA MANUAL CON IVA EDITABLE Y 2 RENGLONES     */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingInvoice ? 'Editar Factura de Consumidor Final' : 'Nueva Factura de Consumidor Final'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Encabezado del taller preconfigurado · 2 renglones de detalle · IVA editable con cálculo automático.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Sección 1: Encabezado y Datos del Taller (Lectura / Verificación) */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Encabezado y Datos del Taller
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Configurado desde «Administrar Taller»
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-300">
                  <div>
                    <strong className="text-white block">{activeContact.name}</strong>
                    <span className="text-neutral-400 text-[11px] block">{activeContact.legalName}</span>
                    <span className="text-neutral-400 text-[11px] block">{activeContact.address}</span>
                  </div>
                  <div className="sm:text-right font-mono text-[11px]">
                    <span className="text-white block">{activeContact.taxId || 'NIT: Pendiente'}</span>
                    <span className="text-neutral-300 block">{activeContact.taxNRC || 'NRC: Pendiente'}</span>
                    <span className="text-neutral-400 block">{activeContact.phone}</span>
                  </div>
                </div>
              </div>

              {/* Sección 2: Datos de Emisión y Factura */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    N° de Factura *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    placeholder="FCF-0001"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Fecha de Emisión *
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Condición de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as InvoicePaymentMethod)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta de Débito / Crédito">Tarjeta de Débito / Crédito</option>
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Caja Taller / Otro">Caja Taller / Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Estado de Factura
                  </label>
                  <select
                    value={invoiceStatus}
                    onChange={e => setInvoiceStatus(e.target.value as InvoiceStatus)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="emitida">Emitida (Pendiente)</option>
                    <option value="pagada">Pagada</option>
                    <option value="anulada">Anulada</option>
                  </select>
                </div>
              </div>

              {/* Sección 3: Datos del Cliente y Vehículo */}
              <div className="space-y-3 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-red-500" /> Datos del Cliente & Vehículo
                  </span>
                  {clients.length > 0 && (
                    <select
                      value={selectedClientId}
                      onChange={e => handleClientSelect(e.target.value)}
                      className="bg-neutral-900 border border-neutral-700 text-neutral-300 text-[11px] rounded px-2 py-1 focus:outline-none"
                    >
                      <option value="">-- Cargar cliente registrado --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1">Nombre Completo del Cliente *</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Ej. Juan Carlos Pérez"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">DUI / NIT del Cliente</label>
                    <input
                      type="text"
                      value={clientIdentification}
                      onChange={e => setClientIdentification(e.target.value)}
                      placeholder="Ej. 04829103-4"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Teléfono de Contacto</label>
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      placeholder="Ej. +503 7000-0000"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1">Dirección del Cliente</label>
                    <input
                      type="text"
                      value={clientAddress}
                      onChange={e => setClientAddress(e.target.value)}
                      placeholder="Ej. Usulután, El Salvador"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Placa del Vehículo</label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                      placeholder="Ej. P 892-104"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Marca / Modelo / Año</label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={e => setVehicleModel(e.target.value)}
                      placeholder="Ej. Toyota Corolla 2020"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 4: EXACTAMENTE 2 DETALLES DE FACTURA (REQUERIMIENTO PRINCIPAL) */}
              <div className="p-4 sm:p-5 rounded-xl bg-neutral-950 border-2 border-red-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div>
                    <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-red-500" />
                      Detalles de la Factura (Solo 2 Renglones Oficiales)
                    </span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      1. Mano de Obra y 2. Total de Repuestos, según el formato legal y simplificado solicitado.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-600/20 text-red-400">
                    2 Renglones
                  </span>
                </div>

                {/* DETALLE 1: MANO DE OBRA */}
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">1</span>
                      Renglón 1: Mano de Obra ($ USD)
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">1 Servicio Técnico</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-neutral-400 text-[11px] mb-1">Descripción del Servicio Técnico</label>
                      <input
                        type="text"
                        value={laborDescription}
                        onChange={e => setLaborDescription(e.target.value)}
                        placeholder="Mano de obra especializada..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 text-[11px] font-bold mb-1">Monto Mano de Obra ($) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={laborAmount}
                          onChange={e => setLaborAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          placeholder="0.00"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-7 pr-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* DETALLE 2: TOTAL DE LOS REPUESTOS */}
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">2</span>
                      Renglón 2: Total de Repuestos ($ USD)
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">Total Global Insumos</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-neutral-400 text-[11px] mb-1">Descripción de Repuestos y Materiales</label>
                      <input
                        type="text"
                        value={partsDescription}
                        onChange={e => setPartsDescription(e.target.value)}
                        placeholder="Total de repuestos originales, lubricantes y materiales..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 text-[11px] font-bold mb-1">Total Repuestos ($) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={partsTotalAmount}
                          onChange={e => setPartsTotalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          placeholder="0.00"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-7 pr-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 5: CÁLCULO DE IVA EDITABLE Y TOTAL (REQUERIMIENTO ESTRICTO) */}
              <div className="p-4 sm:p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-red-500" />
                    Cálculo de Impuestos (IVA Editable) y Total
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    Subtotal: ${formSubtotal.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Selector / Input de Tasa de IVA Editable */}
                  <div className="space-y-2">
                    <label className="block text-neutral-300 font-bold">
                      Tasa de IVA (% Editable) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        required
                        value={taxPercent}
                        onChange={e => setTaxPercent(parseFloat(e.target.value) || 0)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono font-bold text-base focus:outline-none focus:border-red-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono font-bold">%</span>
                    </div>

                    {/* Botones de plantilla rápida para IVA */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {[
                        { label: '13% (El Salvador)', val: 13 },
                        { label: '0% (Exento)', val: 0 },
                        { label: '16%', val: 16 },
                      ].map(preset => (
                        <button
                          type="button"
                          key={preset.val}
                          onClick={() => setTaxPercent(preset.val)}
                          className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                            taxPercent === preset.val
                              ? 'bg-red-600 text-white font-bold'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Descuento opcional */}
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">
                      Descuento Especial ($ USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={discountAmount}
                        onChange={e => setDiscountAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-7 pr-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 mt-1 block">Aplica antes de calcular IVA</span>
                  </div>

                  {/* Recuadro de Totales Calculados */}
                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-neutral-400">
                      <span>Mano de Obra:</span>
                      <span className="text-white">${parsedLabor.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Total Repuestos:</span>
                      <span className="text-white">${parsedParts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-300 font-bold border-t border-neutral-800 pt-1">
                      <span>Subtotal:</span>
                      <span>${formSubtotal.toFixed(2)}</span>
                    </div>
                    {parsedDiscount > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>Descuento:</span>
                        <span>-${parsedDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-red-400">
                      <span>IVA ({taxPercent}%):</span>
                      <span>+${formTaxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold text-sm border-t border-neutral-800 pt-1">
                      <span>TOTAL FACTURA:</span>
                      <span>${formTotal.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notas y Garantía */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Notas al Pie de Factura</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Comentarios adicionales o agradecimiento al cliente..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Términos de Garantía Taller</label>
                  <textarea
                    rows={2}
                    value={warrantyNotes}
                    onChange={e => setWarrantyNotes(e.target.value)}
                    placeholder="Garantía de mano de obra y repuestos..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer transition-colors shadow-md flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{editingInvoice ? 'Guardar Cambios' : 'Emitir Factura Consumidor Final'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: VISTA DE IMPRESIÓN OFICIAL (HOJA DE FACTURA DE CONSUMIDOR FINAL)  */}
      {/* ========================================================================= */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
            {/* Top Toolbar */}
            <div className="no-print p-3 sm:p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-sm">
                  Factura N° {viewInvoice.invoiceNumber}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  viewInvoice.status === 'pagada'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : viewInvoice.status === 'anulada'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {viewInvoice.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShareWhatsApp(viewInvoice)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  onClick={() => setViewInvoice(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Hoja de Factura Oficial Estilo Papel A4 / Carta */}
            <div className="overflow-y-auto p-4 sm:p-8 bg-neutral-950 flex justify-center">
              <div
                id="printable-invoice"
                className="w-full max-w-[800px] bg-white text-neutral-900 p-6 sm:p-10 rounded-xl shadow-lg border border-neutral-200 font-sans print:shadow-none print:border-none print:m-0 print:p-6"
                style={{ minHeight: '900px' }}
              >
                {/* 1. ENCABEZADO OFICIAL DEL TALLER CON LOGO Y DATOS LEGALES */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-neutral-900">
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 aspect-square rounded-xl bg-black border border-neutral-800 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                      <img
                        src="/logo.png"
                        alt="Logo Taller Rodríguez"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight leading-tight uppercase font-sans">
                        {viewInvoice.workshopName || activeContact.name}
                      </h1>
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wider font-mono">
                        {viewInvoice.workshopLegalName || activeContact.legalName}
                      </p>
                      <p className="text-[11px] text-neutral-600 mt-1 max-w-md leading-snug">
                        {viewInvoice.workshopActivity || activeContact.businessActivity}
                      </p>
                      <div className="text-[11px] text-neutral-700 mt-1 space-y-0.5">
                        <div>📍 {viewInvoice.workshopAddress || activeContact.address}</div>
                        <div>📞 Tel: {viewInvoice.workshopPhone || activeContact.phone} · ✉️ {viewInvoice.workshopEmail || activeContact.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Recuadro de Factura Oficial */}
                  <div className="w-full sm:w-auto text-left sm:text-right shrink-0">
                    <div className="border-2 border-red-600 rounded-xl p-3 bg-red-50/50 inline-block text-center sm:text-right w-full sm:w-auto">
                      <div className="text-[11px] font-black uppercase text-red-700 tracking-wider">
                        Factura de Consumidor Final
                      </div>
                      <div className="text-xl font-black text-neutral-950 font-mono tracking-tight mt-0.5">
                        N° {viewInvoice.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-neutral-700 font-mono mt-1 font-semibold">
                        {viewInvoice.workshopTaxId || activeContact.taxId}
                      </div>
                      <div className="text-[11px] text-neutral-700 font-mono">
                        {viewInvoice.workshopNRC || activeContact.taxNRC}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. DATOS DE EMISIÓN & CLIENTE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-neutral-300 text-xs">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      Datos del Cliente:
                    </div>
                    <div className="text-sm font-bold text-neutral-950">
                      {viewInvoice.clientName}
                    </div>
                    {viewInvoice.clientIdentification && (
                      <div className="text-neutral-700 font-mono">
                        <strong>DUI / NIT:</strong> {viewInvoice.clientIdentification}
                      </div>
                    )}
                    {viewInvoice.clientPhone && (
                      <div className="text-neutral-700">
                        <strong>Teléfono:</strong> {viewInvoice.clientPhone}
                      </div>
                    )}
                    {viewInvoice.clientAddress && (
                      <div className="text-neutral-700">
                        <strong>Dirección:</strong> {viewInvoice.clientAddress}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 sm:text-right">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      Datos de Emisión & Vehículo:
                    </div>
                    <div className="text-neutral-800">
                      <strong>Fecha de Emisión:</strong> <span className="font-mono">{viewInvoice.date}</span>
                    </div>
                    <div className="text-neutral-800">
                      <strong>Condición de Pago:</strong> {viewInvoice.paymentMethod}
                    </div>
                    {viewInvoice.vehiclePlate && (
                      <div className="text-neutral-800">
                        <strong>Vehículo:</strong> {viewInvoice.vehicleModel} <span className="font-mono font-bold bg-neutral-100 px-1 rounded">[{viewInvoice.vehiclePlate}]</span>
                      </div>
                    )}
                    {viewInvoice.otNumber && (
                      <div className="text-neutral-600 font-mono text-[11px]">
                        Ref. Orden de Trabajo: {viewInvoice.otNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. TABLA DE DETALLES: EXACTAMENTE 2 RENGLONES (REQUERIMIENTO PRINCIPAL) */}
                <div className="py-6">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-neutral-900 bg-neutral-100 text-neutral-800 font-bold uppercase text-[11px]">
                        <th className="py-2.5 px-3 text-center w-12">Cant.</th>
                        <th className="py-2.5 px-3">Descripción / Detalle del Servicio</th>
                        <th className="py-2.5 px-3 text-right w-28">Precio Unit.</th>
                        <th className="py-2.5 px-3 text-right w-28">Ventas Afectas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {/* Renglón 1: Mano de Obra */}
                      <tr className="text-neutral-900 font-medium">
                        <td className="py-3 px-3 text-center font-mono text-neutral-600">1</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-neutral-950">Mano de Obra Especializada</div>
                          <div className="text-[11px] text-neutral-600 mt-0.5">
                            {viewInvoice.laborDescription}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          ${viewInvoice.laborAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          ${viewInvoice.laborAmount.toFixed(2)}
                        </td>
                      </tr>

                      {/* Renglón 2: Total de Repuestos */}
                      <tr className="text-neutral-900 font-medium">
                        <td className="py-3 px-3 text-center font-mono text-neutral-600">1</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-neutral-950">Total de Repuestos y Materiales</div>
                          <div className="text-[11px] text-neutral-600 mt-0.5">
                            {viewInvoice.partsDescription}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          ${viewInvoice.partsTotalAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          ${viewInvoice.partsTotalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. TOTALES & RESUMEN TRIBUTARIO (IVA EDITABLE CALCULADO) */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t-2 border-neutral-900 text-xs">
                  <div className="space-y-2 max-w-sm">
                    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        Valor en Letras:
                      </div>
                      <div className="text-xs font-bold text-neutral-950 mt-0.5 uppercase">
                        SON: {numberToSpanishWords(viewInvoice.total)}
                      </div>
                    </div>

                    {viewInvoice.warrantyNotes && (
                      <div className="text-[10px] text-neutral-600 leading-tight">
                        <strong>Garantía Oficial Rodríguez:</strong> {viewInvoice.warrantyNotes}
                      </div>
                    )}
                  </div>

                  <div className="w-full sm:w-72 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-neutral-700 py-0.5">
                      <span>Sumas / Subtotal:</span>
                      <span className="font-bold">${viewInvoice.subtotal.toFixed(2)}</span>
                    </div>

                    {viewInvoice.discountAmount && viewInvoice.discountAmount > 0 ? (
                      <div className="flex justify-between text-red-600 py-0.5">
                        <span>Descuento Especial:</span>
                        <span>-${viewInvoice.discountAmount.toFixed(2)}</span>
                      </div>
                    ) : null}

                    {/* IVA con desglose de porcentaje configurado */}
                    <div className="flex justify-between text-neutral-800 py-0.5 font-semibold">
                      <span>IVA ({viewInvoice.taxPercent}%):</span>
                      <span>+${viewInvoice.taxAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-base font-black text-neutral-950 border-t-2 border-neutral-900 pt-2 text-sm sm:text-base">
                      <span>TOTAL A PAGAR:</span>
                      <span className="text-red-700">${viewInvoice.total.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>

                {/* 5. FIRMAS Y SELLOS LEGALES */}
                <div className="grid grid-cols-2 gap-8 pt-16 mt-8 border-t border-dashed border-neutral-300 text-center text-xs">
                  <div>
                    <div className="border-t border-neutral-400 w-44 mx-auto pt-1 font-bold text-neutral-800">
                      Taller Rodríguez Rodríguez
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      Firma y Sello de Autorización
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-neutral-400 w-44 mx-auto pt-1 font-bold text-neutral-800">
                      {viewInvoice.clientName}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      Recibido Conforme (Cliente)
                    </div>
                  </div>
                </div>

                {/* Pie de página legal */}
                <div className="pt-8 text-center text-[10px] text-neutral-400 font-mono">
                  Documento emitido conforme a normativas de facturación comercial · Taller Rodríguez Rodríguez Usulután · Tel: {activeContact.phone}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
