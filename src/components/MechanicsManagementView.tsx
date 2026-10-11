import React, { useState, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { User, MechanicPermissions, WorkshopContact, WorkshopLegalDocument } from '../types';
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
  Building2,
  FileBadge,
  FileCheck,
  MapPin,
  Globe,
  Save,
  Briefcase,
  Scale,
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
    workshopContact,
    updateWorkshopContact,
    addLegalDocument,
    updateLegalDocument,
    deleteLegalDocument,
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

  // Sub-tab view mode: 'datos_taller' | 'mecanicos'
  const [adminViewMode, setAdminViewMode] = useState<'datos_taller' | 'mecanicos'>('datos_taller');

  // Workshop Form State
  const [tallerForm, setTallerForm] = useState<WorkshopContact>(workshopContact);
  const [tallerSavedSuccess, setTallerSavedSuccess] = useState(false);

  useEffect(() => {
    setTallerForm(workshopContact);
  }, [workshopContact]);

  // Legal document modal state
  const [isLegalDocModalOpen, setIsLegalDocModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docName, setDocName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [docIssuer, setDocIssuer] = useState('');
  const [docIssueDate, setDocIssueDate] = useState('');
  const [docExpiryDate, setDocExpiryDate] = useState('');
  const [docStatus, setDocStatus] = useState<'vigente' | 'en_tramite' | 'por_renovar'>('vigente');
  const [docNotes, setDocNotes] = useState('');

  const handleSaveTallerForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('Solo el Jefe de Taller o personal autorizado puede modificar los datos del taller.');
      return;
    }
    updateWorkshopContact(tallerForm);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    setTallerSavedSuccess(true);
    setTimeout(() => setTallerSavedSuccess(false), 3500);
  };

  const handleOpenAddDocModal = () => {
    setEditingDocId(null);
    setDocName('');
    setDocNumber('');
    setDocIssuer('');
    setDocIssueDate(new Date().toISOString().split('T')[0]);
    setDocExpiryDate('');
    setDocStatus('vigente');
    setDocNotes('');
    setIsLegalDocModalOpen(true);
  };

  const handleOpenEditDocModal = (doc: WorkshopLegalDocument) => {
    setEditingDocId(doc.id);
    setDocName(doc.name);
    setDocNumber(doc.documentNumber);
    setDocIssuer(doc.issuer);
    setDocIssueDate(doc.issueDate);
    setDocExpiryDate(doc.expiryDate || '');
    setDocStatus(doc.status);
    setDocNotes(doc.notes || '');
    setIsLegalDocModalOpen(true);
  };

  const handleSaveLegalDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docNumber.trim()) {
      alert('Por favor completa al menos el nombre y número o folio del documento.');
      return;
    }
    if (editingDocId) {
      updateLegalDocument(editingDocId, {
        name: docName.trim(),
        documentNumber: docNumber.trim(),
        issuer: docIssuer.trim(),
        issueDate: docIssueDate,
        expiryDate: docExpiryDate || undefined,
        status: docStatus,
        notes: docNotes.trim(),
      });
    } else {
      addLegalDocument({
        name: docName.trim(),
        documentNumber: docNumber.trim(),
        issuer: docIssuer.trim(),
        issueDate: docIssueDate,
        expiryDate: docExpiryDate || undefined,
        status: docStatus,
        notes: docNotes.trim(),
      });
    }
    confetti({ particleCount: 30, spread: 45 });
    setIsLegalDocModalOpen(false);
  };

  const handleDeleteDoc = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el registro del documento "${name}"?`)) {
      deleteLegalDocument(id);
    }
  };

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
      phone: newPhone || workshopContact.phone || '+503 6427-2531',
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
              <Building2 className="w-6 h-6 text-red-500" />
              <span>Administración del Taller, Contactos & Personal</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30 uppercase font-bold">
              Panel del Jefe
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Gestiona la información oficial del taller, datos de contacto del Jefe de Taller, expediente de documentos legales y control de mecánicos.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            {adminViewMode === 'datos_taller' ? (
              <button
                type="button"
                onClick={handleOpenAddDocModal}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-950"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Documento Legal</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-950"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Nuevo Mecánico</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl">
        <button
          type="button"
          onClick={() => setAdminViewMode('datos_taller')}
          className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            adminViewMode === 'datos_taller'
              ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Datos & Documentos Legales del Taller</span>
          <span className="px-1.5 py-0.5 bg-black/30 rounded text-[10px] font-mono">
            {workshopContact.legalDocuments?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAdminViewMode('mecanicos')}
          className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            adminViewMode === 'mecanicos'
              ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Plantilla de Mecánicos & Permisos</span>
          <span className="px-1.5 py-0.5 bg-black/30 rounded text-[10px] font-mono">
            {totalStaff}
          </span>
        </button>
      </div>

      {adminViewMode === 'datos_taller' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Privacy & Trust Notice */}
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-emerald-200 font-semibold">
                Garantía de Contacto Oficial del Taller
              </p>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                Los contactos configurados a continuación corresponden <strong className="text-white">exclusivamente al Jefe de Taller</strong> ({workshopContact.bossName}). Este teléfono y correo son los únicos que se muestran en el portal de clientes, impresiones de órdenes de trabajo, cotizaciones y mensajes de WhatsApp. <span className="text-emerald-300">Los datos del programador VlaSwink51 se mantienen únicamente como cuenta técnica interna y nunca se envían ni se comparten con clientes.</span>
              </p>
            </div>
          </div>

          {/* Form: General & Contact Information */}
          <form onSubmit={handleSaveTallerForm} className="space-y-6">
            <div className="p-5 sm:p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Contactos Oficiales del Jefe de Taller</h3>
                    <p className="text-[11px] text-neutral-400">Canales de comunicación oficiales para los clientes del taller</p>
                  </div>
                </div>
                {tallerSavedSuccess && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> ¡Guardado con éxito!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Jefe de Taller (Responsable Técnico) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tallerForm.bossName}
                    onChange={e => setTallerForm({ ...tallerForm, bossName: e.target.value })}
                    placeholder="Ej. Edwin Rodríguez"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">Nombre del Jefe que firma órdenes y presupuestos</span>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Teléfono Oficial del Taller (Llamadas) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tallerForm.phone}
                    onChange={e => setTallerForm({ ...tallerForm, phone: e.target.value })}
                    placeholder="Ej. +503 6427-2531"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">Teléfono al que llamarán los clientes</span>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    WhatsApp Oficial del Taller <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tallerForm.whatsappNumber}
                    onChange={e => setTallerForm({ ...tallerForm, whatsappNumber: e.target.value })}
                    placeholder="Ej. 50364272531"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">Número con código de país para enlaces wa.me</span>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Correo Electrónico Oficial del Taller <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={tallerForm.email}
                    onChange={e => setTallerForm({ ...tallerForm, email: e.target.value })}
                    placeholder="Ej. contacto@taller-rodriguez.com"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">Correo del Jefe que aparece en facturas e impresiones</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-300 font-medium mb-1">
                    Dirección Física del Taller <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tallerForm.address}
                    onChange={e => setTallerForm({ ...tallerForm, address: e.target.value })}
                    placeholder="Ej. Final 4ª Calle Poniente, Barrio El Calvario, Usulután"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">Dirección impresa en encabezados oficiales</span>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Ciudad / Municipio</label>
                  <input
                    type="text"
                    value={tallerForm.city || ''}
                    onChange={e => setTallerForm({ ...tallerForm, city: e.target.value })}
                    placeholder="Usulután"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">País</label>
                  <input
                    type="text"
                    value={tallerForm.country || ''}
                    onChange={e => setTallerForm({ ...tallerForm, country: e.target.value })}
                    placeholder="El Salvador"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Business & Legal Identifiers */}
            <div className="p-5 sm:p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Registro Fiscal & Documentos Legales del Taller</h3>
                    <p className="text-[11px] text-neutral-400">Información tributaria, denominación legal y matrículas de comercio</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Nombre Comercial del Taller</label>
                  <input
                    type="text"
                    required
                    value={tallerForm.name}
                    onChange={e => setTallerForm({ ...tallerForm, name: e.target.value })}
                    placeholder="TALLER RODRIGUEZ RODRIGUEZ"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-semibold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Razón Social / Denominación Legal</label>
                  <input
                    type="text"
                    required
                    value={tallerForm.legalName}
                    onChange={e => setTallerForm({ ...tallerForm, legalName: e.target.value })}
                    placeholder="Taller Automotriz Rodríguez Rodríguez S.A. de C.V."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Eslogan o Especialidad</label>
                  <input
                    type="text"
                    value={tallerForm.tagline || ''}
                    onChange={e => setTallerForm({ ...tallerForm, tagline: e.target.value })}
                    placeholder="Mecánica Especializada · Diagnóstico Computarizado"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">NIT (Número Identificación Tributaria)</label>
                  <input
                    type="text"
                    value={tallerForm.taxId}
                    onChange={e => setTallerForm({ ...tallerForm, taxId: e.target.value })}
                    placeholder="NIT: 0614-141098-102-1"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">NRC (Registro de Contribuyente)</label>
                  <input
                    type="text"
                    value={tallerForm.taxNRC}
                    onChange={e => setTallerForm({ ...tallerForm, taxNRC: e.target.value })}
                    placeholder="NRC: 298104-5"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Giro Comercial / Actividad Económica</label>
                  <input
                    type="text"
                    value={tallerForm.businessActivity || ''}
                    onChange={e => setTallerForm({ ...tallerForm, businessActivity: e.target.value })}
                    placeholder="Mantenimiento y Reparación de Vehículos Automotores"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Matrícula de Comercio / Registro Mercantil</label>
                  <input
                    type="text"
                    value={tallerForm.commercialRegistry || ''}
                    onChange={e => setTallerForm({ ...tallerForm, commercialRegistry: e.target.value })}
                    placeholder="N° 2024098712 · Libro 45 de Sociedades"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Licencia de Operación Municipal</label>
                  <input
                    type="text"
                    value={tallerForm.municipalLicense || ''}
                    onChange={e => setTallerForm({ ...tallerForm, municipalLicense: e.target.value })}
                    placeholder="Alcaldía de Usulután N° ALC-USU-2026-089"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Póliza de Responsabilidad Civil / Seguro</label>
                  <input
                    type="text"
                    value={tallerForm.insurancePolicy || ''}
                    onChange={e => setTallerForm({ ...tallerForm, insurancePolicy: e.target.value })}
                    placeholder="Póliza SISA RC-9821034-A"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-neutral-300 font-medium mb-1">Términos de Garantía Estándar para Clientes</label>
                  <textarea
                    rows={2}
                    value={tallerForm.warrantyTerms || ''}
                    onChange={e => setTallerForm({ ...tallerForm, warrantyTerms: e.target.value })}
                    placeholder="Garantía de 6 meses o 10,000 km en mano de obra y repuestos originales instalados."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                <span className="text-[11px] text-neutral-500">
                  Los cambios se sincronizan en tiempo real y se imprimen en los próximos presupuestos y órdenes.
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-red-950/50"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Información Oficial del Taller</span>
                </button>
              </div>
            </div>
          </form>

          {/* Section: Legal Documents Registered */}
          <div className="p-5 sm:p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <FileBadge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Expediente de Documentos Legales del Taller</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-normal">
                      {workshopContact.legalDocuments?.length || 0} registrados
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Control de licencias municipales, tarjetas tributarias, pólizas de seguro y resoluciones de operación
                  </p>
                </div>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={handleOpenAddDocModal}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Agregar Documento Legal</span>
                </button>
              )}
            </div>

            {/* Documents List */}
            {(!workshopContact.legalDocuments || workshopContact.legalDocuments.length === 0) ? (
              <div className="p-8 text-center rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-3">
                <FileCheck className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs text-neutral-400">No hay documentos legales registrados aún en el expediente del taller.</p>
                <button
                  type="button"
                  onClick={handleOpenAddDocModal}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer"
                >
                  Registrar Primer Documento Legal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {workshopContact.legalDocuments.map(doc => {
                  const statusColors = {
                    vigente: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    en_tramite: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    por_renovar: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                  };
                  const statusLabels = {
                    vigente: 'Vigente',
                    en_tramite: 'En Trámite',
                    por_renovar: 'Por Renovar',
                  };

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-xs text-white leading-tight">{doc.name}</h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold shrink-0 ${statusColors[doc.status]}`}>
                            {statusLabels[doc.status]}
                          </span>
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center gap-1.5 text-neutral-300 font-mono">
                            <span className="text-neutral-500">N° / Folio:</span>
                            <span className="font-bold text-white">{doc.documentNumber}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-neutral-400">
                            <span className="text-neutral-500">Emisor:</span>
                            <span>{doc.issuer}</span>
                          </div>
                          <div className="flex items-center gap-3 text-neutral-400 font-mono text-[10px] pt-1">
                            <span>Emisión: {doc.issueDate}</span>
                            {doc.expiryDate && <span>Vence: {doc.expiryDate}</span>}
                          </div>
                          {doc.notes && (
                            <p className="text-[11px] text-neutral-400 italic pt-1 border-t border-neutral-900 mt-1">
                              {doc.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-neutral-900">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDocModal(doc)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                            title="Editar documento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id, doc.name)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                            title="Eliminar documento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
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
    </div>
  )}

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

      {/* MODAL: REGISTRAR / EDITAR DOCUMENTO LEGAL DEL TALLER */}
      {isLegalDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileBadge className="w-4 h-4 text-amber-400" />
                <span>
                  {editingDocId ? 'Editar Documento Legal del Taller' : 'Registrar Nuevo Documento Legal'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsLegalDocModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLegalDoc} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Quick Template Buttons when creating */}
              {!editingDocId && (
                <div>
                  <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1.5">
                    Plantillas Rápidas Frecuentes:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Matrícula de Empresa / Comercio', issuer: 'Centro Nacional de Registros (CNR)' },
                      { name: 'Licencia Municipal de Operación', issuer: 'Alcaldía Municipal de Usulután' },
                      { name: 'Tarjeta NIT / NRC Taller', issuer: 'Ministerio de Hacienda de El Salvador' },
                      { name: 'Póliza de Responsabilidad Civil', issuer: 'Aseguradora SISA / ASESUISA' },
                      { name: 'Inspección del Cuerpo de Bomberos', issuer: 'Cuerpo de Bomberos de El Salvador' },
                      { name: 'Escritura de Constitución Social', issuer: 'Notaría Pública y Registro Mercantil' },
                    ].map(tpl => (
                      <button
                        key={tpl.name}
                        type="button"
                        onClick={() => {
                          setDocName(tpl.name);
                          setDocIssuer(tpl.issuer);
                        }}
                        className="px-2 py-1 text-[10px] rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors cursor-pointer"
                      >
                        + {tpl.name.split('/')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nombre del Documento o Resolución <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  placeholder="Ej. Matrícula de Comercio de Establecimiento"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Número / Folio / Resolución <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={e => setDocNumber(e.target.value)}
                    placeholder="Ej. CNR-2026-098412"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Institución o Emisor <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={docIssuer}
                    onChange={e => setDocIssuer(e.target.value)}
                    placeholder="Ej. Centro Nacional de Registros (CNR)"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Fecha de Emisión</label>
                  <input
                    type="date"
                    required
                    value={docIssueDate}
                    onChange={e => setDocIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={docExpiryDate}
                    onChange={e => setDocExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Estado Legal</label>
                  <select
                    value={docStatus}
                    onChange={e => setDocStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="vigente">🟢 Vigente</option>
                    <option value="en_tramite">🔵 En Trámite</option>
                    <option value="por_renovar">🟡 Por Renovar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Observaciones / Notas Adicionales
                </label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={e => setDocNotes(e.target.value)}
                  placeholder="Ej. Copia autenticada resguardada en archivo de administración; renovación anual requerida."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsLegalDocModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm shadow-red-950"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingDocId ? 'Actualizar Documento' : 'Registrar Documento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
