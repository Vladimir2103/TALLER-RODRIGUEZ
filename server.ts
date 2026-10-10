import http from 'http';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import {
  INITIAL_CLIENTS,
  INITIAL_PARTS,
  INITIAL_APPOINTMENTS,
  INITIAL_BUDGETS,
  INITIAL_WORK_ORDERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_USERS,
  INITIAL_MECHANIC_NOTIFICATIONS,
} from './src/data/initialData';

const app = express();
const server = http.createServer(app);

// Enable trust proxy for Render, Cloud Run, and reverse proxies with SSL termination
app.set('trust proxy', 1);

// Security Headers Middleware (Production-Hardened for Render)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '25mb' }));

// ---------------------------------------------------------------------------
// Robust Storage Configuration for Render & Local Environments
// ---------------------------------------------------------------------------
// Render Persistent Disk is typically mounted at /var/data or custom DATA_DIR
const isRenderEnvironment = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
const DEFAULT_DATA_DIR = fs.existsSync('/var/data') ? '/var/data' : process.cwd();
const STORAGE_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : DEFAULT_DATA_DIR;

try {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('[DB] Warning creating STORAGE_DIR, falling back to cwd:', err);
}

const DB_FILE = process.env.DATABASE_PATH || path.resolve(STORAGE_DIR, 'workshop_database.json');
const BACKUPS_DIR = path.resolve(STORAGE_DIR, 'backups');

try {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('[DB] Warning creating BACKUPS_DIR:', err);
}

console.log(`[Taller Rodríguez] Almacenamiento persistente configurado en: ${DB_FILE}`);
console.log(`[Taller Rodríguez] Directorio de respaldos automáticos: ${BACKUPS_DIR}`);

// Interface for Workshop Database State
interface WorkshopDatabaseState {
  clients: any[];
  parts: any[];
  appointments: any[];
  budgets: any[];
  workOrders: any[];
  notifications: any[];
  users: any[];
  mechanicNotifications: any[];
  workshopContact?: any;
  lastUpdated: string;
}

// Helper: Rotate old snapshots to keep disk optimized (max 30 snapshots)
function rotateBackupSnapshots() {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return;
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a)); // Newest first

    if (files.length > 30) {
      const toDelete = files.slice(30);
      for (const file of toDelete) {
        try {
          fs.unlinkSync(path.join(BACKUPS_DIR, file));
        } catch {}
      }
    }
  } catch (err) {
    console.warn('[DB] Error rotating backups:', err);
  }
}

// Helper: Create a timestamped backup snapshot
function createBackupSnapshot(label: string = 'auto') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUPS_DIR, `backup_${timestamp}_${label}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(state, null, 2), 'utf-8');
    rotateBackupSnapshots();
    return backupPath;
  } catch (err) {
    console.warn('[DB] Could not create snapshot:', err);
    return null;
  }
}

// Find latest valid backup file if primary DB is missing or corrupted
function recoverFromLatestBackup(): WorkshopDatabaseState | null {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return null;
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a));

    for (const f of files) {
      try {
        const full = path.join(BACKUPS_DIR, f);
        const raw = fs.readFileSync(full, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
          console.log(`[DB] Recuperada base de datos exitosamente desde respaldo: ${f}`);
          return parsed;
        }
      } catch {}
    }
  } catch {}
  return null;
}

function loadDatabaseState(): WorkshopDatabaseState {
  // 1. Try reading from primary DB_FILE
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        let loadedUsers = Array.isArray(data.users) && data.users.length > 0 ? data.users : [...INITIAL_USERS];
        if (!loadedUsers.some((u: any) => u.username?.toLowerCase() === 'vlaswink51')) {
          loadedUsers = [INITIAL_USERS[0], ...loadedUsers];
        }
        return {
          clients: Array.isArray(data.clients) ? data.clients : [],
          parts: Array.isArray(data.parts) ? data.parts : [],
          appointments: Array.isArray(data.appointments) ? data.appointments : [],
          budgets: Array.isArray(data.budgets) ? data.budgets : [],
          workOrders: Array.isArray(data.workOrders) ? data.workOrders : [],
          notifications: Array.isArray(data.notifications) ? data.notifications : [],
          users: loadedUsers,
          mechanicNotifications: Array.isArray(data.mechanicNotifications) ? data.mechanicNotifications : [],
          workshopContact: data.workshopContact || null,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.error('[DB] Error leyendo DB_FILE:', err);
  }

  // 2. Check root workspace database file if different from DB_FILE
  try {
    const rootPath = path.resolve(process.cwd(), 'workshop_database.json');
    if (rootPath !== path.resolve(DB_FILE) && fs.existsSync(rootPath)) {
      const raw = fs.readFileSync(rootPath, 'utf-8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        let loadedUsers = Array.isArray(data.users) && data.users.length > 0 ? data.users : [...INITIAL_USERS];
        if (!loadedUsers.some((u: any) => u.username?.toLowerCase() === 'vlaswink51')) {
          loadedUsers = [INITIAL_USERS[0], ...loadedUsers];
        }
        return {
          clients: Array.isArray(data.clients) ? data.clients : [],
          parts: Array.isArray(data.parts) ? data.parts : [],
          appointments: Array.isArray(data.appointments) ? data.appointments : [],
          budgets: Array.isArray(data.budgets) ? data.budgets : [],
          workOrders: Array.isArray(data.workOrders) ? data.workOrders : [],
          notifications: Array.isArray(data.notifications) ? data.notifications : [],
          users: loadedUsers,
          mechanicNotifications: Array.isArray(data.mechanicNotifications) ? data.mechanicNotifications : [],
          workshopContact: data.workshopContact || null,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        };
      }
    }
  } catch (err2) {
    console.error('[DB] Error leyendo archivo de base de datos en workspace:', err2);
  }

  // 3. Attempt recovery from backup snapshot before starting fresh
  const recovered = recoverFromLatestBackup();
  if (recovered) {
    return recovered;
  }

  // 4. Default clean database state
  const cleanDefault: WorkshopDatabaseState = {
    clients: [],
    parts: [],
    appointments: [],
    budgets: [],
    workOrders: [],
    notifications: [],
    users: [...INITIAL_USERS],
    mechanicNotifications: [],
    lastUpdated: new Date().toISOString(),
  };

  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(cleanDefault, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (e) {
    console.error('[DB] Error inicializando archivo de base de datos:', e);
  }

  return cleanDefault;
}

// In-Memory Server-Authoritative State loaded from persistent disk file
let state: WorkshopDatabaseState = loadDatabaseState();
let mutationCount = 0;

// Bulletproof Atomic Database Persistence (Zero Corruption & Immediate Disk Flush)
function persistDatabaseState(forceSnapshot: boolean = false) {
  try {
    state.lastUpdated = new Date().toISOString();
    const jsonStr = JSON.stringify(state, null, 2);

    // Primary write to DB_FILE
    const tempFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
    const fd = fs.openSync(tempFile, 'w');
    fs.writeSync(fd, jsonStr, 0, 'utf-8');
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fs.renameSync(tempFile, DB_FILE);

    // Mirror to workspace cwd if different
    const rootPath = path.resolve(process.cwd(), 'workshop_database.json');
    if (path.resolve(DB_FILE) !== rootPath) {
      try {
        fs.writeFileSync(rootPath, jsonStr, 'utf-8');
      } catch {}
    }

    mutationCount++;
    // Periodic snapshot every 10 mutations or forced
    if (forceSnapshot || mutationCount % 10 === 0) {
      createBackupSnapshot('auto_sync');
    }
  } catch (err) {
    console.error('[DB] Error persistiendo workshop_database.json atómicamente, intentando respaldo directo:', err);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (e2) {
      console.error('[DB] Crítico: Falló persistencia directa de base de datos', e2);
    }
  }
}

// Take an initial startup snapshot to guarantee safety
createBackupSnapshot('startup');

// WebSocket Server for Real-Time Multi-User Collaboration
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(data: any, excludeWs?: WebSocket) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastAll(data: any) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', ws => {
  const connectedCount = wss.clients.size;

  // Send initial full authoritative state to newly connected client
  ws.send(
    JSON.stringify({
      type: 'INIT_STATE',
      payload: state,
      connectedClients: connectedCount,
      timestamp: state.lastUpdated,
    })
  );

  // Notify everyone of updated connection presence
  broadcastAll({
    type: 'PRESENCE_UPDATE',
    connectedClients: connectedCount,
  });

  ws.on('message', rawMessage => {
    try {
      const data = JSON.parse(rawMessage.toString());

      switch (data.type) {
        // CLIENTS
        case 'CLIENT_CREATE': {
          const newClient = data.payload.client;
          state.clients = [newClient, ...state.clients.filter(c => c.id !== newClient.id)];
          persistDatabaseState();
          broadcast({ type: 'CLIENT_CREATED', payload: { client: newClient }, connectedClients: wss.clients.size }, ws);
          break;
        }

        case 'CLIENT_UPDATE': {
          const updatedClient = data.payload.client;
          state.clients = state.clients.map(c => (c.id === updatedClient.id ? updatedClient : c));
          persistDatabaseState();
          broadcast({ type: 'CLIENT_UPDATED', payload: { client: updatedClient }, connectedClients: wss.clients.size }, ws);
          break;
        }

        case 'CLIENT_DELETE': {
          const clientId = data.payload.clientId;
          state.clients = state.clients.filter(c => c.id !== clientId);
          persistDatabaseState();
          broadcast({ type: 'CLIENT_DELETED', payload: { clientId }, connectedClients: wss.clients.size }, ws);
          break;
        }

        // PARTS / INVENTORY
        case 'PART_CREATE': {
          const newPart = data.payload.part;
          state.parts = [newPart, ...state.parts.filter(p => p.id !== newPart.id)];
          persistDatabaseState();
          broadcast({ type: 'PART_CREATED', payload: { part: newPart }, connectedClients: wss.clients.size }, ws);
          break;
        }

        case 'PART_UPDATE': {
          const updatedPart = data.payload.part;
          state.parts = state.parts.map(p => (p.id === updatedPart.id ? updatedPart : p));
          persistDatabaseState();
          broadcast({ type: 'PART_UPDATED', payload: { part: updatedPart }, connectedClients: wss.clients.size }, ws);
          break;
        }

        case 'PART_DELETE': {
          const partId = data.payload.partId;
          state.parts = state.parts.filter(p => p.id !== partId);
          persistDatabaseState();
          broadcast({ type: 'PART_DELETED', payload: { partId }, connectedClients: wss.clients.size }, ws);
          break;
        }

        case 'PART_STOCK_ADJUST': {
          const { id, delta } = data.payload;
          state.parts = state.parts.map(p =>
            p.id === id ? { ...p, stockQuantity: Math.max(0, p.stockQuantity + delta) } : p
          );
          persistDatabaseState();
          broadcast({ type: 'PART_STOCK_ADJUSTED', payload: { id, delta }, connectedClients: wss.clients.size }, ws);
          break;
        }

        // APPOINTMENTS
        case 'APPOINTMENT_CREATE': {
          const newApp = data.payload.appointment;
          state.appointments = [newApp, ...state.appointments.filter(a => a.id !== newApp.id)];
          persistDatabaseState();
          broadcast({ type: 'APPOINTMENT_CREATED', payload: { appointment: newApp }, connectedClients: wss.clients.size }, ws);
          break;
        }

        case 'APPOINTMENT_UPDATE': {
          const updatedApp = data.payload.appointment;
          state.appointments = state.appointments.map(a => (a.id === updatedApp.id ? updatedApp : a));
          persistDatabaseState();
          broadcast({ type: 'APPOINTMENT_UPDATED', payload: { appointment: updatedApp }, connectedClients: wss.clients.size }, ws);
          break;
        }

        case 'APPOINTMENT_DELETE': {
          const appointmentId = data.payload.appointmentId;
          state.appointments = state.appointments.filter(a => a.id !== appointmentId);
          persistDatabaseState();
          broadcast({ type: 'APPOINTMENT_DELETED', payload: { appointmentId }, connectedClients: wss.clients.size }, ws);
          break;
        }

        // BUDGETS
        case 'BUDGET_CREATE': {
          const newBudget = data.payload.budget;
          state.budgets = [newBudget, ...state.budgets.filter(b => b.id !== newBudget.id)];
          persistDatabaseState();
          broadcast({ type: 'BUDGET_CREATED', payload: { budget: newBudget }, connectedClients: wss.clients.size }, ws);
          break;
        }

        case 'BUDGET_UPDATE': {
          const updatedBudget = data.payload.budget;
          state.budgets = state.budgets.map(b => (b.id === updatedBudget.id ? updatedBudget : b));
          persistDatabaseState();
          broadcast({ type: 'BUDGET_UPDATED', payload: { budget: updatedBudget }, connectedClients: wss.clients.size }, ws);
          break;
        }

        case 'BUDGET_DELETE': {
          const budgetId = data.payload.budgetId;
          state.budgets = state.budgets.filter(b => b.id !== budgetId);
          persistDatabaseState();
          broadcast({ type: 'BUDGET_DELETED', payload: { budgetId }, connectedClients: wss.clients.size }, ws);
          break;
        }

        // WORK ORDERS
        case 'WORK_ORDER_CREATE': {
          const newOrder = data.payload.order;
          const notification = data.payload.notification;

          const exists = state.workOrders.some(o => o.id === newOrder.id);
          if (!exists) {
            state.workOrders = [newOrder, ...state.workOrders];
          }

          if (notification) {
            const notifExists = state.mechanicNotifications.some(n => n.id === notification.id);
            if (!notifExists) {
              state.mechanicNotifications = [notification, ...state.mechanicNotifications];
            }
          }

          persistDatabaseState();
          broadcast({
            type: 'WORK_ORDER_CREATED',
            payload: { order: newOrder, notification },
            connectedClients: wss.clients.size,
          }, ws);
          break;
        }

        case 'WORK_ORDER_UPDATE': {
          const updatedOrder = data.payload.order;
          state.workOrders = state.workOrders.map(o => (o.id === updatedOrder.id ? updatedOrder : o));
          persistDatabaseState();
          broadcast({
            type: 'WORK_ORDER_UPDATED',
            payload: { order: updatedOrder },
            connectedClients: wss.clients.size,
          }, ws);
          break;
        }

        case 'WORK_ORDER_REASSIGN': {
          const { otId, newTechnician, notification } = data.payload;
          state.workOrders = state.workOrders.map(o =>
            o.id === otId ? { ...o, assignedTechnician: newTechnician } : o
          );

          if (notification) {
            const notifExists = state.mechanicNotifications.some(n => n.id === notification.id);
            if (!notifExists) {
              state.mechanicNotifications = [notification, ...state.mechanicNotifications];
            }
          }

          persistDatabaseState();
          broadcast({
            type: 'WORK_ORDER_REASSIGNED',
            payload: { otId, newTechnician, notification },
            connectedClients: wss.clients.size,
          }, ws);
          break;
        }

        case 'WORK_ORDER_DELETE': {
          const otId = data.payload.otId;
          state.workOrders = state.workOrders.filter(o => o.id !== otId);
          persistDatabaseState();
          broadcast({
            type: 'WORK_ORDER_DELETED',
            payload: { otId },
            connectedClients: wss.clients.size,
          }, ws);
          break;
        }

        // USERS / MECHANICS
        case 'USER_UPDATE': {
          const updatedUser = data.payload.user;
          state.users = state.users.map(u => (u.id === updatedUser.id ? updatedUser : u));
          persistDatabaseState();
          broadcast({
            type: 'USER_UPDATED',
            payload: { user: updatedUser },
            connectedClients: wss.clients.size,
          }, ws);
          break;
        }

        case 'USER_CREATE': {
          const newUser = data.payload.user;
          const exists = state.users.some(u => u.id === newUser.id);
          if (!exists) {
            state.users = [...state.users, newUser];
          }
          persistDatabaseState();
          broadcast({
            type: 'USER_CREATED',
            payload: { user: newUser },
            connectedClients: wss.clients.size,
          }, ws);
          break;
        }

        case 'USER_DELETE': {
          const userId = data.payload.userId;
          state.users = state.users.filter(u => u.id !== userId);
          persistDatabaseState();
          broadcast({
            type: 'USER_DELETED',
            payload: { userId },
            connectedClients: wss.clients.size,
          }, ws);
          break;
        }

        // NOTIFICATIONS
        case 'NOTIFICATIONS_MARK_READ': {
          const { technicianName } = data.payload;
          state.mechanicNotifications = state.mechanicNotifications.map(n =>
            !technicianName || n.technicianName.toLowerCase().includes(technicianName.toLowerCase())
              ? { ...n, read: true }
              : n
          );
          persistDatabaseState();
          broadcast({
            type: 'NOTIFICATIONS_READ_UPDATED',
            payload: { technicianName },
            connectedClients: wss.clients.size,
          }, ws);
          break;
        }

        case 'FULL_STATE_SYNC': {
          if (data.payload) {
            state = { ...state, ...data.payload, lastUpdated: new Date().toISOString() };
            persistDatabaseState();
            broadcast({
              type: 'STATE_SYNCED',
              payload: state,
              connectedClients: wss.clients.size,
            }, ws);
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[WS] Error handling WebSocket message', err);
    }
  });

  ws.on('close', () => {
    broadcastAll({
      type: 'PRESENCE_UPDATE',
      connectedClients: wss.clients.size,
    });
  });
});

// REST Endpoints
app.get('/api/tracking/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const cleanId = (id || '').trim().toLowerCase();
  const rawId = (id || '').trim();

  const normalizePlate = (p?: string) => (p || '').toLowerCase().replace(/[\s\-_]/g, '');

  if (type === 'ot' || type === 'orden' || type === 'trabajo') {
    const order = state.workOrders.find(
      o =>
        o.id.toLowerCase() === cleanId ||
        o.otNumber.toLowerCase() === cleanId ||
        normalizePlate(o.vehiclePlate) === normalizePlate(cleanId)
    );
    if (!order) {
      return res.status(404).json({ success: false, error: 'Orden de trabajo no encontrada' });
    }
    return res.json({ success: true, type: 'ot', data: order, timestamp: state.lastUpdated });
  } else if (type === 'cita') {
    const appointment = state.appointments.find(
      a =>
        a.id.toLowerCase() === cleanId ||
        normalizePlate(a.vehiclePlate) === normalizePlate(cleanId)
    );
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Cita no encontrada' });
    }
    return res.json({ success: true, type: 'cita', data: appointment, timestamp: state.lastUpdated });
  }

  // Fallback search across both
  const matchedOT = state.workOrders.find(
    o =>
      o.id.toLowerCase() === cleanId ||
      o.otNumber.toLowerCase() === cleanId ||
      normalizePlate(o.vehiclePlate) === normalizePlate(cleanId)
  );
  if (matchedOT) {
    return res.json({ success: true, type: 'ot', data: matchedOT, timestamp: state.lastUpdated });
  }

  const matchedApp = state.appointments.find(
    a =>
      a.id.toLowerCase() === cleanId ||
      normalizePlate(a.vehiclePlate) === normalizePlate(cleanId)
  );
  if (matchedApp) {
    return res.json({ success: true, type: 'cita', data: matchedApp, timestamp: state.lastUpdated });
  }

  return res.status(404).json({ success: false, error: 'Registro de seguimiento no encontrado' });
});

app.get('/api/database', (req, res) => {
  res.json({
    success: true,
    data: state,
    connectedClients: wss.clients.size,
    timestamp: state.lastUpdated,
  });
});

app.get('/api/state', (req, res) => {
  res.json({
    success: true,
    data: state,
    connectedClients: wss.clients.size,
    timestamp: state.lastUpdated,
  });
});

// Specialized Direct Database Mutation Endpoints
app.post('/api/users/update', (req, res) => {
  try {
    const { user } = req.body;
    if (!user || !user.id) {
      return res.status(400).json({ success: false, error: 'Datos de usuario requeridos' });
    }
    const idx = state.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      state.users[idx] = { ...state.users[idx], ...user };
    } else {
      state.users.push(user);
    }
    persistDatabaseState();
    broadcastAll({
      type: 'USER_UPDATED',
      payload: { user: state.users.find(u => u.id === user.id) },
      connectedClients: wss.clients.size,
    });
    res.json({ success: true, user: state.users.find(u => u.id === user.id) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users/save', (req, res) => {
  try {
    const { user } = req.body;
    if (!user || !user.id) {
      return res.status(400).json({ success: false, error: 'Datos de usuario requeridos' });
    }
    const idx = state.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      state.users[idx] = { ...state.users[idx], ...user };
    } else {
      state.users.push(user);
    }
    persistDatabaseState();
    broadcastAll({
      type: 'USER_UPDATED',
      payload: { user: state.users.find(u => u.id === user.id) },
      connectedClients: wss.clients.size,
    });
    res.json({ success: true, user: state.users.find(u => u.id === user.id) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users/delete', (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID de usuario requerido' });
    }
    state.users = state.users.filter(u => u.id !== id);
    persistDatabaseState();
    broadcastAll({
      type: 'USER_DELETED',
      payload: { userId: id },
      connectedClients: wss.clients.size,
    });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/work-orders/save', (req, res) => {
  try {
    const { order, notification } = req.body;
    if (!order || !order.id) {
      return res.status(400).json({ success: false, error: 'Datos de orden requeridos' });
    }
    const idx = state.workOrders.findIndex(o => o.id === order.id);
    if (idx >= 0) {
      state.workOrders[idx] = { ...state.workOrders[idx], ...order };
    } else {
      state.workOrders = [order, ...state.workOrders];
    }
    if (notification) {
      const notifExists = state.mechanicNotifications.some(n => n.id === notification.id);
      if (!notifExists) {
        state.mechanicNotifications = [notification, ...state.mechanicNotifications];
      }
    }
    persistDatabaseState();
    broadcastAll({
      type: 'WORK_ORDER_UPDATED',
      payload: { order, notification },
      connectedClients: wss.clients.size,
    });
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/work-orders/delete', (req, res) => {
  try {
    const { id } = req.body;
    state.workOrders = state.workOrders.filter(o => o.id !== id);
    persistDatabaseState();
    broadcastAll({
      type: 'WORK_ORDER_DELETED',
      payload: { otId: id },
      connectedClients: wss.clients.size,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/appointments/save', (req, res) => {
  try {
    const { appointment } = req.body;
    if (!appointment || !appointment.id) {
      return res.status(400).json({ success: false, error: 'Datos de cita requeridos' });
    }
    const idx = state.appointments.findIndex(a => a.id === appointment.id);
    if (idx >= 0) {
      state.appointments[idx] = { ...state.appointments[idx], ...appointment };
    } else {
      state.appointments = [appointment, ...state.appointments];
    }
    persistDatabaseState();
    broadcastAll({
      type: 'APPOINTMENT_UPDATED',
      payload: { appointment },
      connectedClients: wss.clients.size,
    });
    res.json({ success: true, appointment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/appointments/delete', (req, res) => {
  try {
    const { id } = req.body;
    state.appointments = state.appointments.filter(a => a.id !== id);
    persistDatabaseState();
    broadcastAll({
      type: 'APPOINTMENT_DELETED',
      payload: { appointmentId: id },
      connectedClients: wss.clients.size,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/clients/save', (req, res) => {
  try {
    const { client } = req.body;
    if (!client || !client.id) {
      return res.status(400).json({ success: false, error: 'Datos de cliente requeridos' });
    }
    const idx = state.clients.findIndex(c => c.id === client.id);
    if (idx >= 0) {
      state.clients[idx] = { ...state.clients[idx], ...client };
    } else {
      state.clients = [client, ...state.clients];
    }
    persistDatabaseState();
    broadcastAll({
      type: 'CLIENT_UPDATED',
      payload: { client },
      connectedClients: wss.clients.size,
    });
    res.json({ success: true, client });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/clients/delete', (req, res) => {
  try {
    const { id } = req.body;
    state.clients = state.clients.filter(c => c.id !== id);
    persistDatabaseState();
    broadcastAll({
      type: 'CLIENT_DELETED',
      payload: { clientId: id },
      connectedClients: wss.clients.size,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/parts/save', (req, res) => {
  try {
    const { part } = req.body;
    if (!part || !part.id) {
      return res.status(400).json({ success: false, error: 'Datos de repuesto requeridos' });
    }
    const idx = state.parts.findIndex(p => p.id === part.id);
    if (idx >= 0) {
      state.parts[idx] = { ...state.parts[idx], ...part };
    } else {
      state.parts = [part, ...state.parts];
    }
    persistDatabaseState();
    broadcastAll({
      type: 'PART_UPDATED',
      payload: { part },
      connectedClients: wss.clients.size,
    });
    res.json({ success: true, part });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/parts/delete', (req, res) => {
  try {
    const { id } = req.body;
    state.parts = state.parts.filter(p => p.id !== id);
    persistDatabaseState();
    broadcastAll({
      type: 'PART_DELETED',
      payload: { partId: id },
      connectedClients: wss.clients.size,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/budgets/save', (req, res) => {
  try {
    const { budget } = req.body;
    if (!budget || !budget.id) {
      return res.status(400).json({ success: false, error: 'Datos de presupuesto requeridos' });
    }
    const idx = state.budgets.findIndex(b => b.id === budget.id);
    if (idx >= 0) {
      state.budgets[idx] = { ...state.budgets[idx], ...budget };
    } else {
      state.budgets = [budget, ...state.budgets];
    }
    persistDatabaseState();
    broadcastAll({
      type: 'BUDGET_UPDATED',
      payload: { budget },
      connectedClients: wss.clients.size,
    });
    res.json({ success: true, budget });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/budgets/delete', (req, res) => {
  try {
    const { id } = req.body;
    state.budgets = state.budgets.filter(b => b.id !== id);
    persistDatabaseState();
    broadcastAll({
      type: 'BUDGET_DELETED',
      payload: { budgetId: id },
      connectedClients: wss.clients.size,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sync', (req, res) => {
  try {
    const incoming = req.body;
    if (incoming && typeof incoming === 'object') {
      const arrayKeys: (keyof WorkshopDatabaseState)[] = [
        'clients',
        'parts',
        'appointments',
        'budgets',
        'workOrders',
        'notifications',
        'users',
        'mechanicNotifications',
      ];

      for (const k of arrayKeys) {
        if (Array.isArray(incoming[k])) {
          if (k === 'users') {
            if (incoming[k].length > 0) {
              state.users = incoming[k];
            }
          } else {
            (state as any)[k] = incoming[k];
          }
        }
      }
      if (incoming.workshopContact && typeof incoming.workshopContact === 'object') {
        state.workshopContact = incoming.workshopContact;
      }
      persistDatabaseState(true);
      broadcastAll({
        type: 'STATE_SYNCED',
        payload: state,
        connectedClients: wss.clients.size,
      });
    }
    res.json({ success: true, timestamp: state.lastUpdated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to get and update official workshop contact (Jefe de Taller)
app.get('/api/workshop-contact', (_req, res) => {
  res.json({ success: true, workshopContact: state.workshopContact || null });
});

app.post('/api/workshop-contact', (req, res) => {
  try {
    const { workshopContact } = req.body;
    if (workshopContact && typeof workshopContact === 'object') {
      state.workshopContact = workshopContact;
      persistDatabaseState(true);
      broadcastAll({
        type: 'WORKSHOP_CONTACT_UPDATED',
        payload: { workshopContact },
        connectedClients: wss.clients.size,
      });
    }
    res.json({ success: true, workshopContact: state.workshopContact });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to download entire live database file (1-click backup for workshop owner)
app.get('/api/database/backup', (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `taller_rodriguez_backup_${timestamp}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(state, null, 2));
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to restore database from JSON file with safety pre-backup
app.post('/api/database/restore', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'Cuerpo de respaldo no válido.' });
    }

    // Safety pre-backup before applying restore
    createBackupSnapshot('pre_restore');

    const updatedState: WorkshopDatabaseState = {
      clients: Array.isArray(payload.clients) ? payload.clients : state.clients,
      parts: Array.isArray(payload.parts) ? payload.parts : state.parts,
      appointments: Array.isArray(payload.appointments) ? payload.appointments : state.appointments,
      budgets: Array.isArray(payload.budgets) ? payload.budgets : state.budgets,
      workOrders: Array.isArray(payload.workOrders) ? payload.workOrders : state.workOrders,
      notifications: Array.isArray(payload.notifications) ? payload.notifications : state.notifications,
      users: Array.isArray(payload.users) && payload.users.length > 0 ? payload.users : state.users,
      mechanicNotifications: Array.isArray(payload.mechanicNotifications) ? payload.mechanicNotifications : state.mechanicNotifications,
      lastUpdated: new Date().toISOString(),
    };

    state = updatedState;
    persistDatabaseState(true);

    broadcastAll({
      type: 'STATE_SYNCED',
      payload: state,
      connectedClients: wss.clients.size,
    });

    res.json({
      success: true,
      message: 'Base de datos restaurada y sincronizada exitosamente.',
      stats: {
        clients: state.clients.length,
        workOrders: state.workOrders.length,
        parts: state.parts.length,
        users: state.users.length,
        appointments: state.appointments.length,
        budgets: state.budgets.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to inspect database health, storage path & snapshot status
app.get('/api/database/info', (req, res) => {
  try {
    let sizeBytes = 0;
    if (fs.existsSync(DB_FILE)) {
      sizeBytes = fs.statSync(DB_FILE).size;
    }

    let snapshotsCount = 0;
    if (fs.existsSync(BACKUPS_DIR)) {
      snapshotsCount = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json')).length;
    }

    res.json({
      success: true,
      isRender: isRenderEnvironment,
      storageDirectory: STORAGE_DIR,
      databaseFile: DB_FILE,
      backupsDirectory: BACKUPS_DIR,
      fileSizeBytes: sizeBytes,
      fileSizeKb: (sizeBytes / 1024).toFixed(2),
      snapshotsAvailable: snapshotsCount,
      lastUpdated: state.lastUpdated,
      records: {
        users: state.users.length,
        clients: state.clients.length,
        parts: state.parts.length,
        workOrders: state.workOrders.length,
        appointments: state.appointments.length,
        budgets: state.budgets.length,
      },
      connectedClients: wss.clients.size,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to reset to clean slate (empty data, keeping mechanics)
app.post('/api/reset-clean', (req, res) => {
  try {
    // Safety snapshot before reset
    createBackupSnapshot('pre_reset');

    state = {
      clients: [],
      parts: [],
      appointments: [],
      budgets: [],
      workOrders: [],
      notifications: [],
      users: [...INITIAL_USERS],
      mechanicNotifications: [],
      lastUpdated: new Date().toISOString(),
    };
    persistDatabaseState(true);
    broadcastAll({
      type: 'STATE_SYNCED',
      payload: state,
      connectedClients: wss.clients.size,
    });
    res.json({ success: true, message: 'Database reset to clean state successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    workshop: 'TALLER RODRIGUEZ RODRIGUEZ',
    isRender: isRenderEnvironment,
    connectedClients: wss.clients.size,
    databaseFile: DB_FILE,
    lastUpdated: state.lastUpdated,
    time: new Date().toISOString(),
  });
});

// Graceful Shutdown for Render Containers (flushes disk immediately on SIGTERM/SIGINT)
function handleGracefulShutdown(signal: string) {
  console.log(`[Taller Rodríguez] Señal ${signal} recibida. Forzando guardado y respaldo final de base de datos...`);
  try {
    createBackupSnapshot(`shutdown_${signal.toLowerCase()}`);
    persistDatabaseState(true);
    console.log('[Taller Rodríguez] Base de datos persistida con éxito.');
  } catch (err) {
    console.error('[Taller Rodríguez] Error durante guardado de apagado:', err);
  }

  wss.clients.forEach(client => {
    try {
      client.close(1001, 'Server restarting');
    } catch {}
  });

  server.close(() => {
    console.log('[Taller Rodríguez] Servidor cerrado ordenadamente.');
    process.exit(0);
  });

  setTimeout(() => process.exit(0), 4000);
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

// Vite middleware in dev / Static files in prod
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  
  // Start HTTP & WebSocket server immediately so container healthchecks pass instantly (preventing 'running the code' stalls)
  if (!server.listening) {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[Taller Rodríguez] Servidor activo inmediatamente en http://0.0.0.0:${PORT} (WebSocket: /ws)`);
    });
  }

  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(process.cwd(), 'dist');
  const distIndex = path.join(distDir, 'index.html');

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/workshop_database.json',
            '**/*.tmp.*',
            '**/backups/**',
            '**/data/**',
          ],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    if (fs.existsSync(distIndex)) {
      app.use(express.static(distDir));
      app.get('*', (req, res) => {
        res.sendFile(distIndex);
      });
    } else {
      app.get('*', (req, res) => {
        res.status(200).send(`
          <!DOCTYPE html>
          <html lang="es">
            <head><meta charset="utf-8"><title>Taller Rodríguez Rodríguez</title></head>
            <body style="font-family:sans-serif;background:#0a0a0c;color:#fff;padding:40px;">
              <h2>Iniciando Taller Rodríguez Rodríguez...</h2>
              <p>Por favor ejecuta <code>npm run build</code> para el bundle de producción.</p>
            </body>
          </html>
        `);
      });
    }
  }
}

startServer().catch(err => {
  console.error('Error starting server', err);
  process.exit(1);
});
