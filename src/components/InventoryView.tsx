import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Part, PartCategory } from '../types';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  Tag,
  MapPin,
} from 'lucide-react';
import { formatCurrency, formatUSD } from '../utils/format';

const CATEGORIES: PartCategory[] = [
  'Frenos',
  'Motor',
  'Suspensión y Dirección',
  'Filtros y Lubricantes',
  'Transmisión',
  'Eléctrico e Iluminación',
  'Refrigeración',
  'Neumáticos',
  'Accesorios y Varios',
];

export const InventoryView: React.FC = () => {
  const {
    parts,
    addPart,
    updatePart,
    deletePart,
    adjustPartStock,
    lowStockParts,
    hasPermission,
    currentUser,
  } = useWorkshop();

  const canManageInventory = hasPermission('canManageInventory');
  const canViewFinancials = hasPermission('canViewFinancialReports');
  const canDelete = hasPermission('canDeleteRecords');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  // Form states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<PartCategory>('Frenos');
  const [stockQuantity, setStockQuantity] = useState(10);
  const [minStockAlert, setMinStockAlert] = useState(5);
  const [unitCost, setUnitCost] = useState(45);
  const [salePrice, setSalePrice] = useState(75);
  const [location, setLocation] = useState('Estante A-01');
  const [compatibleVehicles, setCompatibleVehicles] = useState('');
  const [supplier, setSupplier] = useState('');

  // Total valuation
  const totalCostValuation = parts.reduce((sum, p) => sum + p.stockQuantity * p.unitCost, 0);
  const totalRetailValuation = parts.reduce((sum, p) => sum + p.stockQuantity * p.salePrice, 0);
  const expectedProfit = totalRetailValuation - totalCostValuation;

  const openNewModal = () => {
    setEditingPart(null);
    setSku(`REP-${Math.floor(1000 + Math.random() * 9000)}`);
    setName('');
    setBrand('');
    setCategory('Frenos');
    setStockQuantity(10);
    setMinStockAlert(4);
    setUnitCost(45);
    setSalePrice(75);
    setLocation('Estante A-01');
    setCompatibleVehicles('');
    setSupplier('');
    setIsModalOpen(true);
  };

  const openEditModal = (part: Part) => {
    setEditingPart(part);
    setSku(part.sku);
    setName(part.name);
    setBrand(part.brand);
    setCategory(part.category);
    setStockQuantity(part.stockQuantity);
    setMinStockAlert(part.minStockAlert);
    setUnitCost(part.unitCost);
    setSalePrice(part.salePrice);
    setLocation(part.location);
    setCompatibleVehicles(part.compatibleVehicles || '');
    setSupplier(part.supplier || '');
    setIsModalOpen(true);
  };

  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) {
      alert('Por favor introduce el nombre y código SKU de la pieza.');
      return;
    }

    if (editingPart) {
      updatePart(editingPart.id, {
        sku,
        name,
        brand,
        category,
        stockQuantity: Number(stockQuantity),
        minStockAlert: Number(minStockAlert),
        unitCost: Number(unitCost),
        salePrice: Number(salePrice),
        location,
        compatibleVehicles,
        supplier,
      });
    } else {
      addPart({
        sku,
        name,
        brand,
        category,
        stockQuantity: Number(stockQuantity),
        minStockAlert: Number(minStockAlert),
        unitCost: Number(unitCost),
        salePrice: Number(salePrice),
        location,
        compatibleVehicles,
        supplier,
      });
    }

    setIsModalOpen(false);
  };

  const filteredParts = parts.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      (p.compatibleVehicles && p.compatibleVehicles.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesLowStock = !filterLowStockOnly || p.stockQuantity <= p.minStockAlert;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-red-500" />
            <span>Inventario de Repuestos & Autopartes</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Catálogo físico, existencias mínimas, costos y ubicación en taller
          </p>
        </div>

        {canManageInventory ? (
          <button
            onClick={openNewModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-950 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Nuevo Repuesto</span>
          </button>
        ) : (
          <div className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Modo Consulta Técnico</span>
          </div>
        )}
      </div>

      {/* Inventory KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider block mb-1">
            Total Referencias (SKU)
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">{parts.length}</div>
          <span className="text-[11px] text-neutral-500">Repuestos catalogados</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider block mb-1">
            {canViewFinancials ? 'Valor a Costo (USD)' : 'Unidades en Almacén'}
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-200 tabular-nums">
            {canViewFinancials
              ? formatCurrency(totalCostValuation)
              : `${parts.reduce((sum, p) => sum + p.stockQuantity, 0)} pzas`}
          </div>
          <span className="text-[11px] text-neutral-500">
            {canViewFinancials ? 'Inversión actual en almacén' : 'Existencias totales físicas'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider block mb-1">
            {canViewFinancials ? 'Valor Venta Estimado (USD)' : 'Familias de Repuestos'}
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {canViewFinancials ? formatCurrency(totalRetailValuation) : `${CATEGORIES.length} categorías`}
          </div>
          <span className="text-[11px] text-emerald-500/80">
            {canViewFinancials
              ? `Margen: +${formatCurrency(expectedProfit)}`
              : 'Frenos, Motor, Suspensión, etc.'}
          </span>
        </div>

        <div
          onClick={() => setFilterLowStockOnly(prev => !prev)}
          className={`p-4 rounded-xl border transition-colors cursor-pointer ${
            filterLowStockOnly
              ? 'bg-amber-500/10 border-amber-500/40'
              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-400 font-medium uppercase tracking-wider block mb-1">
              Bajo Stock Crítico
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 tabular-nums">
            {lowStockParts.length}
          </div>
          <span className="text-[11px] text-amber-400/80 underline underline-offset-2">
            {filterLowStockOnly ? 'Mostrando solo críticos (click para ver todos)' : 'Click para filtrar reabastecimiento'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por repuesto, código SKU, marca o compatibilidad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {filterLowStockOnly && (
            <button
              onClick={() => setFilterLowStockOnly(false)}
              className="px-3 py-2 text-xs font-medium text-amber-300 bg-amber-500/20 border border-amber-500/40 rounded-lg cursor-pointer whitespace-nowrap"
            >
              Quitar Filtro Crítico (X)
            </button>
          )}
        </div>

        {/* Category Pills Scroller */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-850 hover:text-white'
            }`}
          >
            Todas las categorías ({parts.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = parts.filter(p => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'bg-neutral-950 text-neutral-400 border border-neutral-850 hover:text-white'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase font-mono text-[11px]">
                <th className="py-3 px-4 font-semibold">SKU / Marca</th>
                <th className="py-3 px-4 font-semibold">Descripción del Repuesto</th>
                <th className="py-3 px-4 font-semibold">Categoría</th>
                <th className="py-3 px-4 font-semibold text-center">Stock Actual</th>
                <th className="py-3 px-4 font-semibold text-right">P. Costo (USD)</th>
                <th className="py-3 px-4 font-semibold text-right">P. Venta (USD)</th>
                <th className="py-3 px-4 font-semibold text-center">Ubicación</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    No se encontraron repuestos con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredParts.map(part => {
                  const isLow = part.stockQuantity <= part.minStockAlert;
                  const marginPercent = Math.round(((part.salePrice - part.unitCost) / part.unitCost) * 100);

                  return (
                    <tr key={part.id} className="hover:bg-neutral-850/40 transition-colors">
                      {/* SKU & Brand */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-white font-semibold block">{part.sku}</span>
                        <span className="text-neutral-400 text-[11px]">{part.brand}</span>
                      </td>

                      {/* Name & Compatibility */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-white font-medium block truncate">{part.name}</span>
                        {part.compatibleVehicles && (
                          <span className="text-[11px] text-neutral-400 truncate block">
                            Compat: {part.compatibleVehicles}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                          {part.category}
                        </span>
                      </td>

                      {/* Stock with quick buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
                          <button
                            onClick={() => adjustPartStock(part.id, -1)}
                            className="text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Descontar 1 unidad"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                          </button>
                          <span
                            className={`font-mono font-bold px-1 tabular-nums ${
                              isLow ? 'text-amber-400' : 'text-white'
                            }`}
                          >
                            {part.stockQuantity}
                          </span>
                          <button
                            onClick={() => adjustPartStock(part.id, 1)}
                            className="text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer"
                            title="Agregar 1 unidad"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {isLow && (
                          <span className="block text-[10px] text-amber-400 font-medium mt-0.5">
                            Mínimo: {part.minStockAlert}
                          </span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 px-4 text-right font-mono text-neutral-400 tabular-nums">
                        {canViewFinancials ? formatUSD(part.unitCost) : '••••'}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        <span className="text-emerald-400 font-semibold block">
                          {formatUSD(part.salePrice)}
                        </span>
                        {canViewFinancials && (
                          <span className="text-[10px] text-neutral-500">+{marginPercent}%</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                          <MapPin className="w-3 h-3 text-neutral-500" />
                          {part.location}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {canManageInventory ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(part)}
                              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                              title="Editar repuesto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar repuesto "${part.name}"?`)) {
                                    deletePart(part.id);
                                  }
                                }}
                                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                                title="Eliminar repuesto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-500 font-mono">Lectura</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar / Editar Repuesto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-red-500" />
                <span>{editingPart ? 'Editar Repuesto' : 'Registrar Nuevo Repuesto'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePart} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Código SKU *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={e => setSku(e.target.value.toUpperCase())}
                    placeholder="FRE-BRM-001"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Marca / Fabricante *</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    placeholder="Brembo, Bosch, Mobil 1..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre / Descripción de la Pieza *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Pastillas de Freno Cerámicas Delanteras"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Ubicación en Taller</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Estante A-02, Pasillo 1..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Stock and thresholds */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantity}
                    onChange={e => setStockQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Mínimo Alerta</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minStockAlert}
                    onChange={e => setMinStockAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">P. Costo ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={unitCost}
                    onChange={e => setUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">P. Venta ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={salePrice}
                    onChange={e => setSalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-emerald-400 font-mono font-semibold focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Vehículos Compatibles</label>
                <input
                  type="text"
                  value={compatibleVehicles}
                  onChange={e => setCompatibleVehicles(e.target.value)}
                  placeholder="Ej. Honda Civic 2016-2022, CR-V, Mazda 3"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Proveedor / Distribuidor</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  placeholder="Ej. Auto Partes Especializadas SA"
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
                  {editingPart ? 'Actualizar Repuesto' : 'Guardar en Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
