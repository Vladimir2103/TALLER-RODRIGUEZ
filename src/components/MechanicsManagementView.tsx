import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { User, MechanicPermissions } from '../types';
import {
  Wrench,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Plus,
  KeyRound,
  Edit2,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Crown,
  DollarSign,
  Package,
  Calendar,
  FileText,
  Users,
  MessageSquare,
  AlertTriangle,
  X,
  Search,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MechanicsManagementViewProps {
  onNavigateToOTs?: (techName: string) => void;
}

export const MechanicsManagementView: React.FC<MechanicsManagementViewProps> = ({
  onNavigateToOTs,
}) => {
  const {
    users,
    currentUser,
    workOrders,
    addUser,
    updateUser,
    deleteUser,
    updateUserPermissions,
    hasPermission,
  } = useWorkshop();

  const isBoss = currentUser?.role === 'boss';
  const canManage = hasPermission('canManageMechanics');

  const [search, setSearch] = useState('');
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<MechanicPermissions | null>(null);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [userBeingEdited, setUserBeingEdited] = useState<User | null>(null);

  // Form states for new mechanic
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newPin, setNewPin] = useState('1111');
  const [newRole, setNewRole] = useState<'boss' | 'mechanic'>('mechanic');
  const [newPermissions, setNewPermissions] = useState<MechanicPermissions>({
    canManageAppointments: true,
    canManageWorkOrders: true,
    canManageBudgets: false,
    canManageInventory: false,
    canManageClients: false,
    canViewFinancialReports: false,
    canManageMechanics: false,
    canSendWhatsApp: false,
    canDeleteRecords: false,
  });

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editRole, setEditRole] = useState<'boss' | 'mechanic'>('mechanic');

  // Stats
  const totalStaff = users.length;
  const activeStaff = users.filter(u => u.isActive).length;
  const activeOTs = workOrders.filter(o => o.stage !== 'entregado');

  // Filtered mechanics
  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.specialty.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q)
    );
  });

  const openPermissionModal = (user: User) => {
    setSelectedUserForPermissions(user);
    setTempPermissions({ ...user.permissions });
  };

  const handleTogglePermission = (key: keyof MechanicPermissions) => {
    if (!tempPermissions) return;
    setTempPermissions({
      ...tempPermissions,
      [key]: !tempPermissions[key],
    });
  };

  const handleApplyPreset = (preset: 'basic' | 'advanced' | 'all') => {
    if (!tempPermissions) return;
    if (preset === 'basic') {
      setTempPermissions({
        canManageAppointments: true,
        canManageWorkOrders: true,
        canManageBudgets: false,
        canManageInventory: false,
        canManageClients: false,
        canViewFinancialReports: false,
        canManageMechanics: false,
        canSendWhatsApp: false,
        canDeleteRecords: false,
      });
    } else if (preset === 'advanced') {
      setTempPermissions({
        canManageAppointments: true,
        canManageWorkOrders: true,
        canManageBudgets: true,
        canManageInventory: false,
        canManageClients: true,
        canViewFinancialReports: false,
        canManageMechanics: false,
        canSendWhatsApp: true,
        canDeleteRecords: false,
      });
    } else {
      setTempPermissions({
        canManageAppointments: true,
        canManageWorkOrders: true,
        canManageBudgets: true,
        canManageInventory: true,
        canManageClients: true,
        canViewFinancialReports: true,
        canManageMechanics: true,
        canSendWhatsApp: true,
        canDeleteRecords: true,
      });
    }
  };

  const handleSavePermissions = () => {
    if (!selectedUserForPermissions || !tempPermissions) return;
    updateUserPermissions(selectedUserForPermissions.id, tempPermissions);
    confetti({ particleCount: 35, spread: 55, origin: { y: 0.6 } });
    setSelectedUserForPermissions(null);
  };

  const handleToggleActive = (user: User) => {
    if (user.role === 'boss' && users.filter(u => u.role === 'boss').length <= 1) {
      alert('No se puede desactivar al Jefe principal del taller.');
      return;
    }
    updateUser(user.id, { isActive: !user.isActive });
  };

  const openEditModal = (user: User) => {
    setUserBeingEdited(user);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditSpecialty(user.specialty);
    setEditPin(user.pin);
    setEditRole(user.role);
    setIsEditUserModalOpen(true);
  };

  const handleSaveEditedUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userBeingEdited) return;

    const cleanUsername = editUsername.trim().toLowerCase();
    if (!cleanUsername) {
      alert('Por favor ingresa un nombre de usuario válido.');
      return;
    }

    // Verify username uniqueness among other users
    const existsOther = users.some(
      u => u.id !== userBeingEdited.id && u.username.toLowerCase() === cleanUsername
    );
    if (existsOther) {
      alert(`El nombre de usuario "@${cleanUsername}" ya está registrado para otro usuario. Por favor elige otro.`);
      return;
    }

    updateUser(userBeingEdited.id, {
      name: editName,
      username: cleanUsername,
      email: editEmail,
      phone: editPhone,
      specialty: editSpecialty,
      pin: editPin,
      role: editRole,
    });

    setIsEditUserModalOpen(false);
  };

  const handleCreateNewMechanic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Por favor ingresa el nombre del mecánico.');
      return;
    }

    const username = newUsername.trim() || newName.toLowerCase().replace(/\s+/g, '.');

    addUser({
      name: newName,
      username,
      email: newEmail || `${username}@taller-rodriguez.com`,
      phone: newPhone || '+503 7000 0000',
      role: newRole,
      specialty: newSpecialty || 'Mecánico General Automotriz',
      pin: newPin || '1234',
      password: 'password123',
      avatarColor: newRole === 'boss' ? 'bg-red-600' : 'bg-blue-600',
      isActive: true,
      permissions: newRole === 'boss'
        ? {
            canManageAppointments: true,
            canManageWorkOrders: true,
            canManageBudgets: true,
            canManageInventory: true,
            canManageClients: true,
            canViewFinancialReports: true,
            canManageMechanics: true,
            canSendWhatsApp: true,
            canDeleteRecords: true,
          }
        : newPermissions,
    });

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    setIsAddUserModalOpen(false);

    // Reset form
    setNewName('');
    setNewUsername('');
    setNewEmail('');
    setNewPhone('');
    setNewSpecialty('');
    setNewPin('1111');
  };

  const handleDeleteUser = (user: User) => {
    if (user.role === 'boss') {
      alert('No se puede eliminar la cuenta principal del Jefe de Taller.');
      return;
    }
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${user.name}"?`)) {
      deleteUser(user.id);
    }
  };

  // Permission dictionary
  const PERMISSION_CONFIG: {
    key: keyof MechanicPermissions;
    label: string;
    icon: any;
    desc: string;
    category: string;
  }[] = [
    {
      key: 'canManageWorkOrders',
      label: 'Órdenes de Trabajo (OT)',
      icon: Wrench,
      desc: 'Crear, diagnosticar vehículos, registrar repuestos usados y avanzar etapas.',
      category: 'Operativo',
    },
    {
      key: 'canManageAppointments',
      label: 'Agenda de Citas',
      icon: Calendar,
      desc: 'Agendar nuevas citas, reprogramar fechas y confirmar con clientes.',
      category: 'Operativo',
    },
    {
      key: 'canManageBudgets',
      label: 'Presupuestos & Cotizaciones',
      icon: FileText,
      desc: 'Generar cotizaciones formales para clientes y autorizar repuestos.',
      category: 'Comercial',
    },
    {
      key: 'canManageClients',
      label: 'Administración de Clientes',
      icon: Users,
      desc: 'Crear y editar expedientes de clientes y flotas de vehículos.',
      category: 'Clientes',
    },
    {
      key: 'canSendWhatsApp',
      label: 'Notificaciones WhatsApp',
      icon: MessageSquare,
      desc: 'Enviar presupuestos, avisos de vehículo terminado y citas por WhatsApp.',
      category: 'Clientes',
    },
    {
      key: 'canManageInventory',
      label: 'Inventario de Repuestos',
      icon: Package,
      desc: 'Modificar existencias, editar costos de compra y precios de venta.',
      category: 'Almacén',
    },
    {
      key: 'canViewFinancialReports',
      label: 'Métricas Financieras & Utilidad',
      icon: DollarSign,
      desc: 'Ver ingresos brutos facturados, margen neto y balance en el panel.',
      category: 'Finanzas',
    },
    {
      key: 'canDeleteRecords',
      label: 'Eliminar Registros',
      icon: Trash2,
      desc: 'Permiso crítico para borrar clientes, órdenes o piezas del sistema.',
      category: 'Seguridad',
    },
    {
      key: 'canManageMechanics',
      label: 'Administrar Mecánicos & Permisos',
      icon: Shield,
      desc: 'Dar de alta personal y otorgar o revocar permisos a otros mecánicos.',
      category: 'Seguridad',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-500" />
              <span>Gestión de Mecánicos & Control de Permisos</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30 uppercase font-bold">
              Panel del Jefe
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Administra la plantilla del taller, credenciales de inicio de sesión y asigna permisos específicos a cada mecánico.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-950 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Mecánico</span>
          </button>
        )}
      </div>

      {/* Role Alert / Security Note */}
      <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-neutral-200">
            <strong className="text-white">Control de Roles Operativo:</strong> Como{' '}
            <span className="text-red-400 font-bold uppercase">{currentUser?.role === 'boss' ? 'Jefe de Taller' : currentUser?.name}</span>,
            tienes acceso para otorgar permisos a cada mecánico. Cuando un mecánico sin permiso de finanzas o inventario inicia sesión, esas secciones se protegen automáticamente.
          </p>
          <p className="text-neutral-400 text-[11px]">
            Los mecánicos pueden iniciar sesión con su nombre de usuario o su PIN de 4 dígitos en cualquier dispositivo del taller.
          </p>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">Total Personal</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">{totalStaff}</div>
          <span className="text-[11px] text-neutral-500">Mecánicos y Jefe</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">En Turno Activo</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{activeStaff}</div>
          <span className="text-[11px] text-neutral-500">Cuentas habilitadas</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">Órdenes en Proceso</span>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-1">{activeOTs.length}</div>
          <span className="text-[11px] text-neutral-500">OTs asignadas</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">Permisos Modificados</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">Activo</div>
          <span className="text-[11px] text-neutral-500">Granularidad 9 puntos</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar mecánico por nombre, especialidad o correo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <span className="text-xs text-neutral-400 font-mono">
          {filteredUsers.length} mecánico(s)
        </span>
      </div>

      {/* Mechanics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUsers.map(user => {
          const isUserBoss = user.role === 'boss';
          const assignedOrders = activeOTs.filter(o => o.assignedTechnician.toLowerCase().includes(user.name.toLowerCase()));
          const isCurrentLoggedIn = currentUser?.id === user.id;

          return (
            <div
              key={user.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                isCurrentLoggedIn
                  ? 'bg-neutral-900/90 border-red-500/50 shadow-md shadow-red-950/30'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
              } ${!user.isActive ? 'opacity-60 bg-neutral-950' : ''}`}
            >
              <div>
                {/* Card Top: Avatar, Name, Role Badge, Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-base shrink-0 ${
                        isUserBoss ? 'bg-red-600 shadow-md shadow-red-950' : 'bg-neutral-800 border border-neutral-700 text-neutral-200'
                      }`}
                    >
                      {isUserBoss ? (
                        <Crown className="w-6 h-6 text-amber-300" />
                      ) : (
                        <Wrench className="w-5 h-5 text-blue-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-white">{user.name}</h3>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            isUserBoss
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {isUserBoss ? 'Jefe de Taller' : 'Mecánico'}
                        </span>
                        {isCurrentLoggedIn && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                            Tú
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-400 mt-0.5 font-medium">{user.specialty}</p>
                    </div>
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggleActive(user)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      user.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-750'
                    }`}
                    title={user.isActive ? 'Cuenta activa' : 'Cuenta inactiva (deshabilitada)'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
                    <span>{user.isActive ? 'Activo' : 'Inactivo'}</span>
                  </button>
                </div>

                {/* Contact info & Credentials */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-neutral-950 rounded-lg border border-neutral-850 text-[11px] mt-3.5">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500 font-mono block">Usuario Login</span>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="text-[10px] text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                          title="Modificar nombre de usuario o PIN"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                    <span className="text-white font-mono font-medium truncate block bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 mt-0.5">
                      @{user.username}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 font-mono block">PIN de Acceso</span>
                    <span className="text-amber-400 font-mono font-bold block mt-0.5">•••• ({user.pin})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 font-mono block">OTs Asignadas</span>
                    <span className="text-white font-mono font-semibold block mt-0.5">
                      {assignedOrders.length} activas
                    </span>
                  </div>
                </div>

                {/* Permissions Chip Matrix Preview */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase mb-1.5">
                    <span>Permisos Operativos Asignados:</span>
                    {isUserBoss ? (
                      <span className="text-amber-400 font-semibold">Acceso Total</span>
                    ) : (
                      <span>
                        {Object.values(user.permissions).filter(Boolean).length} / 9 activos
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {PERMISSION_CONFIG.map(p => {
                      const hasIt = isUserBoss || user.permissions[p.key];
                      const Icon = p.icon;

                      return (
                        <span
                          key={p.key}
                          className={`text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 border transition-colors ${
                            hasIt
                              ? 'bg-neutral-800/90 text-neutral-200 border-neutral-700'
                              : 'bg-neutral-950 text-neutral-600 border-neutral-900 line-through opacity-50'
                          }`}
                        >
                          <Icon className={`w-3 h-3 ${hasIt ? 'text-red-400' : 'text-neutral-600'}`} />
                          <span>{p.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div className="pt-4 mt-4 border-t border-neutral-850 flex items-center justify-between gap-2">
                <button
                  onClick={() => openPermissionModal(user)}
                  disabled={!canManage}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    canManage
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                      : 'bg-neutral-950 text-neutral-500 border border-neutral-900 cursor-not-allowed'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                  <span>Modificar Permisos</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(user)}
                    disabled={!canManage}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Editar datos del mecánico"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {!isUserBoss && canManage && (
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Eliminar mecánico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: MODIFICAR PERMISOS DEL MECÁNICO */}
      {selectedUserForPermissions && tempPermissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Permisos de: {selectedUserForPermissions.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {selectedUserForPermissions.role === 'boss' ? 'Jefe' : 'Mecánico'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    El Jefe de Taller define qué acciones y vistas están autorizadas para este técnico.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForPermissions(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div className="px-5 py-3 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-[11px] font-mono text-neutral-400">Perfiles rápidos:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('basic')}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 cursor-pointer"
                >
                  Técnico Básico (Solo OTs)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('advanced')}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 cursor-pointer"
                >
                  Mecánico Avanzado (+Cotizar)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all')}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 cursor-pointer"
                >
                  Acceso Total (Jefe)
                </button>
              </div>
            </div>

            {/* Permissions Toggles List */}
            <div className="p-5 space-y-3 overflow-y-auto max-h-[60vh]">
              {PERMISSION_CONFIG.map(item => {
                const isEnabled = tempPermissions[item.key];
                const Icon = item.icon;

                return (
                  <div
                    key={item.key}
                    onClick={() => handleTogglePermission(item.key)}
                    className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-all ${
                      isEnabled
                        ? 'bg-neutral-950 border-neutral-700/80 shadow-xs'
                        : 'bg-neutral-950/40 border-neutral-850 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isEnabled
                            ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                            : 'bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">{item.label}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>

                    {/* Toggle Switch Pill */}
                    <div
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                        isEnabled ? 'bg-red-600' : 'bg-neutral-800'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-800 bg-neutral-950/80">
              <span className="text-[11px] text-neutral-400 font-mono">
                {Object.values(tempPermissions).filter(Boolean).length} de 9 permisos habilitados
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPermissions(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer shadow-sm shadow-red-950"
                >
                  Guardar Permisos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVO MECÁNICO */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-red-500" />
                <span>Registrar Nuevo Mecánico en Plantilla</span>
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewMechanic} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ej. Jorge Ramírez Castillo"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre de Usuario (Login)</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, '.'))}
                    placeholder="jorge.ramirez"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Especialidad Mecánica *</label>
                <input
                  type="text"
                  required
                  value={newSpecialty}
                  onChange={e => setNewSpecialty(e.target.value)}
                  placeholder="Ej. Transmisión Automática & Embragues / Frenos ABS"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="+503 7000-0000"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="mecanico@taller-rodriguez.com"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">PIN de 4 dígitos para Login *</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Tipo de Cargo *</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="mechanic">Mecánico Operativo</option>
                    <option value="boss">Jefe de Taller / Co-Administrador</option>
                  </select>
                </div>
              </div>

              {/* Quick permissions preview */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <span className="text-[11px] font-mono text-neutral-400 block uppercase">
                  Permisos Iniciales:
                </span>
                <p className="text-[11px] text-neutral-400">
                  Por defecto se le habilitará gestión de Órdenes de Trabajo (OT) y Citas. Podrás personalizar cada uno de sus 9 permisos en cualquier momento.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer shadow-sm shadow-red-950"
                >
                  Dar de Alta Mecánico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR DATOS DEL MECÁNICO */}
      {isEditUserModalOpen && userBeingEdited && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-red-500" />
                <span>Editar Datos de {userBeingEdited.name}</span>
              </h3>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-neutral-300">
                    Nombre de Usuario para Login (@usuario)
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">Credencial de acceso</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    placeholder="ej. miguel.rodriguez"
                    className="w-full pl-7 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Modifica este nombre para que el mecánico ingrese con él en la pantalla de login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Especialidad</label>
                <input
                  type="text"
                  required
                  value={editSpecialty}
                  onChange={e => setEditSpecialty(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">PIN (4 dígitos)</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={editPin}
                    onChange={e => setEditPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-center tracking-wider focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
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
