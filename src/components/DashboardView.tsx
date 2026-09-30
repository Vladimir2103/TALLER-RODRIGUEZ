import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  DollarSign,
  TrendingUp,
  Wrench,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Car,
  ChevronRight,
  MessageSquare,
  FileText,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatUSD } from '../utils/format';
import { WorkOrderStage } from '../types';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenWhatsApp: (phone: string, clientName: string, template: any, data: any) => void;
  onNewAppointment: () => void;
  onNewBudget: () => void;
  onNewWorkOrder: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenWhatsApp,
  onNewAppointment,
  onNewBudget,
  onNewWorkOrder,
}) => {
  const {
    workOrders,
    appointments,
    budgets,
    parts,
    lowStockParts,
    updateWorkOrderStage,
    hasPermission,
    currentUser,
  } = useWorkshop();

  const canViewFinancials = hasPermission('canViewFinancialReports');

  // Metrics calculation
  const totalRevenue = workOrders.reduce((sum, o) => sum + o.total, 0);
  const completedOrders = workOrders.filter(o => o.stage === 'entregado');
  const activeOrders = workOrders.filter(o => o.stage !== 'entregado');
  const readyOrders = workOrders.filter(o => o.stage === 'listo_entrega');
  const pendingAppointments = appointments.filter(a => a.status === 'pendiente' || a.status === 'confirmada');

  // Interactive chart state
  const [chartMetric, setChartMetric] = useState<'revenue' | 'profit' | 'orders'>(() =>
    canViewFinancials ? 'revenue' : 'orders'
  );
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(8); // September (0-indexed 8)

  // Monthly performance data in US Dollars (USD - 2026)
  const monthlyData = [
    { month: 'Ene', revenue: 8500, partsCost: 3200, profit: 5300, orders: 24 },
    { month: 'Feb', revenue: 9800, partsCost: 3800, profit: 6000, orders: 28 },
    { month: 'Mar', revenue: 11200, partsCost: 4300, profit: 6900, orders: 31 },
    { month: 'Abr', revenue: 10400, partsCost: 4000, profit: 6400, orders: 29 },
    { month: 'May', revenue: 12100, partsCost: 4600, profit: 7500, orders: 34 },
    { month: 'Jun', revenue: 12900, partsCost: 4900, profit: 8000, orders: 36 },
    { month: 'Jul', revenue: 12600, partsCost: 4800, profit: 7800, orders: 35 },
    { month: 'Ago', revenue: 13500, partsCost: 5100, profit: 8400, orders: 38 },
    { month: 'Sep', revenue: 14200, partsCost: 5400, profit: 8800, orders: 41 },
    { month: 'Oct', revenue: 14800, partsCost: 5600, profit: 9200, orders: 42 },
    { month: 'Nov', revenue: 15300, partsCost: 5800, profit: 9500, orders: 44 },
    { month: 'Dic', revenue: 16900, partsCost: 6400, profit: 10500, orders: 48 },
  ];

  const maxChartValue = Math.max(
    ...monthlyData.map(d => (chartMetric === 'revenue' ? d.revenue : chartMetric === 'profit' ? d.profit : d.orders))
  );

  const selectedData = monthlyData[selectedMonthIndex];

  // Service distribution categories
  const servicesShare = [
    { name: 'Mantenimiento Preventivo & Afinación', percent: 38, count: 52, color: 'bg-emerald-500' },
    { name: 'Frenos & Rectificado de Discos', percent: 24, count: 33, color: 'bg-blue-500' },
    { name: 'Motor & Diagnóstico Computarizado', percent: 18, count: 25, color: 'bg-amber-500' },
    { name: 'Suspensión & Dirección Hidráulica', percent: 12, count: 16, color: 'bg-indigo-500' },
    { name: 'Sistema Eléctrico & Baterías', percent: 8, count: 11, color: 'bg-purple-500' },
  ];

  const getStageLabel = (stage: WorkOrderStage) => {
    switch (stage) {
      case 'recepcion':
        return { text: 'Recepción', color: 'text-neutral-400' };
      case 'diagnostico':
        return { text: 'En Diagnóstico', color: 'text-amber-400' };
      case 'espera_repuestos':
        return { text: 'Espera Repuestos', color: 'text-orange-400' };
      case 'en_reparacion':
        return { text: 'En Reparación', color: 'text-blue-400' };
      case 'control_calidad':
        return { text: 'Control de Calidad', color: 'text-purple-400' };
      case 'listo_entrega':
        return { text: 'Listo para Entrega', color: 'text-emerald-400' };
      case 'entregado':
        return { text: 'Entregado', color: 'text-neutral-400' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Panel de Control Financiero & Operativo</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Métricas en tiempo real · Taller Mecánico Rodríguez Rodríguez
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onNewWorkOrder}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-950"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Nueva Orden (OT)</span>
          </button>
          <button
            onClick={onNewBudget}
            className="px-3 py-1.5 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Nuevo Presupuesto</span>
          </button>
          <button
            onClick={onNewAppointment}
            className="px-3 py-1.5 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Agendar Cita</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Monthly Revenue or Completed Orders if mechanic */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              {canViewFinancials ? 'Ingresos Facturados (USD)' : 'Vehículos Entregados'}
            </span>
            {canViewFinancials ? (
              <DollarSign className="w-4 h-4 text-emerald-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
              {canViewFinancials ? formatCurrency(totalRevenue) : `${completedOrders.length} reparaciones`}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
              {canViewFinancials ? (
                <>
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+14.8% vs mes anterior</span>
                </>
              ) : (
                <span>100% control de calidad cumplido</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2: Active Work Orders */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Órdenes en Taller</span>
            <Wrench className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
              {activeOrders.length} <span className="text-xs font-normal text-neutral-400">vehículos</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              <span className="text-emerald-400 font-medium">{readyOrders.length} listos</span> para entrega
            </div>
          </div>
        </div>

        {/* Metric 3: Upcoming Appointments */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Citas Programadas</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
              {pendingAppointments.length}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              <span>Agenda de hoy y próximas 48h</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Low Stock Alert */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Stock Crítico Repuestos</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockParts.length > 0 ? 'text-amber-400' : 'text-neutral-500'}`} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
              {lowStockParts.length}{' '}
              <span className="text-xs font-normal text-neutral-400">ítems bajo mínimo</span>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-medium mt-1 cursor-pointer flex items-center gap-0.5"
            >
              <span>Ver catálogo a reabastecer</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Performance Visualizer (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Rendimiento Mensual 2026</h2>
              <p className="text-xs text-neutral-400">Selecciona el mes o la métrica para auditar</p>
            </div>

            {/* Segmented Filter Buttons */}
            <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800 self-start sm:self-auto">
              {canViewFinancials && (
                <>
                  <button
                    type="button"
                    onClick={() => setChartMetric('revenue')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      chartMetric === 'revenue'
                        ? 'bg-neutral-800 text-white shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Ingresos
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('profit')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      chartMetric === 'profit'
                        ? 'bg-neutral-800 text-white shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Ganancia Neta
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setChartMetric('orders')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  chartMetric === 'orders'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Vehículos / OTs
              </button>
            </div>
          </div>

          {/* Interactive Bar Chart */}
          <div className="pt-2 pb-2">
            <div className="h-44 sm:h-52 w-full flex items-end gap-1.5 sm:gap-3 px-1 border-b border-neutral-800">
              {monthlyData.map((item, idx) => {
                const value =
                  chartMetric === 'revenue'
                    ? item.revenue
                    : chartMetric === 'profit'
                    ? item.profit
                    : item.orders;
                const heightPercent = Math.max(12, Math.round((value / maxChartValue) * 100));
                const isSelected = selectedMonthIndex === idx;

                return (
                  <div
                    key={item.month}
                    onClick={() => setSelectedMonthIndex(idx)}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer group"
                  >
                    {/* Tooltip on hover/active */}
                    <div
                      className={`text-[10px] font-mono tabular-nums px-1 py-0.5 rounded transition-all duration-200 ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 -translate-y-1'
                          : 'opacity-0 group-hover:opacity-100 text-neutral-400'
                      }`}
                    >
                      {chartMetric === 'orders' ? `${value} veh` : formatUSD(value)}
                    </div>

                    {/* Bar */}
                    <div className="w-full max-w-[28px] h-full flex items-end">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isSelected
                            ? 'bg-gradient-to-t from-red-600 via-amber-500 to-emerald-400 shadow-md shadow-emerald-500/10'
                            : 'bg-neutral-800 group-hover:bg-neutral-700'
                        }`}
                      />
                    </div>

                    {/* Month Label */}
                    <span
                      className={`text-[10px] font-medium transition-colors ${
                        isSelected ? 'text-white font-bold' : 'text-neutral-500 group-hover:text-neutral-300'
                      }`}
                    >
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Month Inspector details bar */}
          <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Detalle de {selectedData.month} 2026:</span>
              {canViewFinancials ? (
                <span className="text-neutral-400">
                  Ingresos:{' '}
                  <strong className="text-neutral-200 font-mono tabular-nums">
                    {formatCurrency(selectedData.revenue)}
                  </strong>
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">Modo Técnico Operativo</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-neutral-400">
              {canViewFinancials && (
                <>
                  <span>
                    Costo Repuestos:{' '}
                    <strong className="text-neutral-200 font-mono tabular-nums">
                      {formatCurrency(selectedData.partsCost)}
                    </strong>
                  </span>
                  <span>
                    Margen Utilidad:{' '}
                    <strong className="text-emerald-400 font-mono tabular-nums">
                      {formatCurrency(selectedData.profit)} (
                      {Math.round((selectedData.profit / selectedData.revenue) * 100)}%)
                    </strong>
                  </span>
                </>
              )}
              <span>
                Órdenes Completadas:{' '}
                <strong className="text-neutral-200 font-mono tabular-nums">{selectedData.orders} OTs</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Services Share Distribution (1 Col) */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-1">Distribución por Servicio</h2>
            <p className="text-xs text-neutral-400 mb-4">Volumen de especialidades automotrices</p>

            {/* Proportion Bars */}
            <div className="space-y-3">
              {servicesShare.map(serv => (
                <div key={serv.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-300 truncate font-medium">{serv.name}</span>
                    <span className="font-mono text-neutral-400 tabular-nums shrink-0 ml-2">{serv.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div style={{ width: `${serv.percent}%` }} className={`h-full ${serv.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>Ticket Promedio por OT:</span>
            <span className="font-mono text-white font-semibold text-sm tabular-nums">
              {formatCurrency(totalRevenue / Math.max(1, workOrders.length))}
            </span>
          </div>
        </div>
      </div>

      {/* Active Work Orders Quick Board */}
      <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-red-500" />
              <span>Vehículos en Taller (Órdenes Activas)</span>
            </h2>
            <p className="text-xs text-neutral-400">Control de etapa y comunicación instantánea</p>
          </div>

          <button
            onClick={() => onNavigate('work_orders')}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Ver todas las órdenes</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            No hay vehículos activos en este momento.
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {activeOrders.slice(0, 4).map(order => {
              const stage = getStageLabel(order.stage);
              return (
                <div key={order.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 text-neutral-300">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-neutral-400 font-semibold">{order.otNumber}</span>
                        <span className="font-semibold text-sm text-white">
                          {order.vehicleBrand} {order.vehicleModel}
                        </span>
                        <span className="font-mono text-xs text-neutral-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                          {order.vehiclePlate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                        <span>Cliente: {order.clientName}</span>
                        <span>·</span>
                        <span>Técnico: {order.assignedTechnician}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    {/* Stage selector dropdown */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold ${stage.color}`}>{stage.text}</span>
                    </div>

                    {/* WhatsApp Action Button */}
                    <button
                      type="button"
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
                      className="px-2.5 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Enviar actualización por WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    {/* Quick stage advance */}
                    {order.stage !== 'listo_entrega' && order.stage !== 'entregado' && (
                      <button
                        onClick={() => {
                          const stages: WorkOrderStage[] = [
                            'recepcion',
                            'diagnostico',
                            'espera_repuestos',
                            'en_reparacion',
                            'control_calidad',
                            'listo_entrega',
                            'entregado',
                          ];
                          const nextIdx = stages.indexOf(order.stage) + 1;
                          if (nextIdx < stages.length) {
                            updateWorkOrderStage(order.id, stages[nextIdx]);
                          }
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Avanzar Etapa
                      </button>
                    )}

                    {order.stage === 'listo_entrega' && (
                      <button
                        onClick={() => updateWorkOrderStage(order.id, 'entregado')}
                        className="px-2.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Entregar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
