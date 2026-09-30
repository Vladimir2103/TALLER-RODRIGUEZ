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

app.use(express.json({ limit: '20mb' }));

// Persistent Database File Path
const DB_FILE = path.resolve('workshop_database.json');

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
  lastUpdated: string;
}

function loadDatabaseState(): WorkshopDatabaseState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return {
        clients: Array.isArray(data.clients) ? data.clients : [],
        parts: Array.isArray(data.parts) ? data.parts : [],
        appointments: Array.isArray(data.appointments) ? data.appointments : [],
        budgets: Array.isArray(data.budgets) ? data.budgets : [],
        workOrders: Array.isArray(data.workOrders) ? data.workOrders : [],
        notifications: Array.isArray(data.notifications) ? data.notifications : [],
        users: Array.isArray(data.users) && data.users.length > 0 ? data.users : [...INITIAL_USERS],
        mechanicNotifications: Array.isArray(data.mechanicNotifications) ? data.mechanicNotifications : [],
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error('[DB] Error loading workshop_database.json, initializing clean state', err);
  }

  // Default clean database state (empty operational tables, preserved mechanics)
  const cleanDefault: WorkshopDatabaseState = {
    clients: [...INITIAL_CLIENTS],
    parts: [...INITIAL_PARTS],
    appointments: [...INITIAL_APPOINTMENTS],
    budgets: [...INITIAL_BUDGETS],
    workOrders: [...INITIAL_WORK_ORDERS],
    notifications: [...INITIAL_NOTIFICATIONS],
    users: [...INITIAL_USERS],
    mechanicNotifications: [...INITIAL_MECHANIC_NOTIFICATIONS],
    lastUpdated: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(cleanDefault, null, 2), 'utf-8');
  } catch (e) {
    console.error('[DB] Error initializing database file', e);
  }

  return cleanDefault;
}

// In-Memory Server-Authoritative State loaded from persistent disk file
let state: WorkshopDatabaseState = loadDatabaseState();

function persistDatabaseState() {
  try {
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error persisting workshop_database.json', err);
  }
}

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
app.get('/api/state', (req, res) => {
  res.json({
    success: true,
    data: state,
    connectedClients: wss.clients.size,
  });
});

app.post('/api/sync', (req, res) => {
  try {
    const incoming = req.body;
    if (incoming) {
      state = { ...state, ...incoming, lastUpdated: new Date().toISOString() };
      persistDatabaseState();
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

// Endpoint to reset to clean slate (empty data, keeping mechanics)
app.post('/api/reset-clean', (req, res) => {
  try {
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
    persistDatabaseState();
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
    connectedClients: wss.clients.size,
    databaseFile: DB_FILE,
    time: new Date().toISOString(),
  });
});

// Vite middleware in dev / Static files in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(process.cwd(), 'dist');
  const distIndex = path.join(distDir, 'index.html');

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Check if dist/index.html was built; if not, try to build it automatically
    if (!fs.existsSync(distIndex)) {
      console.warn('[Server] ADVERTENCIA: No se encontró dist/index.html en producción.');
      console.log('[Server] Ejecutando compilación automática (npm run build)...');
      try {
        const { execSync } = await import('child_process');
        execSync('npm run build', { stdio: 'inherit' });
        console.log('[Server] ¡Compilación finalizada exitosamente!');
      } catch (buildError) {
        console.error('[Server] No se pudo compilar dist automáticamente:', buildError);
      }
    }

    if (fs.existsSync(distIndex)) {
      app.use(express.static(distDir));
      app.get('*', (req, res) => {
        res.sendFile(distIndex);
      });
    } else {
      // Diagnostic fallback instead of crashing with unhandled ENOENT
      app.get('*', (req, res) => {
        res.status(500).send(`
          <!DOCTYPE html>
          <html lang="es">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Configuración de Despliegue en Render</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #ededed; padding: 32px 20px; max-width: 680px; margin: 0 auto; line-height: 1.6; }
                .card { background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 24px; margin-top: 20px; }
                h1 { color: #f87171; font-size: 20px; margin-top: 0; }
                code { background: #262626; color: #4ade80; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 14px; }
                ol { padding-left: 20px; }
                li { margin-bottom: 14px; }
                .highlight { background: #000; border: 1px solid #333; padding: 12px; border-radius: 8px; display: block; margin: 8px 0; word-break: break-all; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>⚠️ Falta compilar los archivos de la aplicación (dist/index.html)</h1>
                <p>El servidor inició correctamente en Render, pero los archivos estáticos de React no fueron generados durante el paso de compilación (Build Command).</p>
                
                <h3>Cómo solucionarlo en el panel de Render:</h3>
                <ol>
                  <li>Ingresa a tu dashboard en <strong>dashboard.render.com</strong> y abre tu servicio.</li>
                  <li>Ve a la pestaña <strong>Settings</strong> (Configuración) a la izquierda.</li>
                  <li>Busca el campo <strong>Build Command</strong> y cámbialo a:
                    <div class="highlight"><code>npm install && npm run build</code></div>
                  </li>
                  <li>Asegúrate de que <strong>Start Command</strong> sea:
                    <div class="highlight"><code>npm start</code></div>
                  </li>
                  <li>Haz clic en <strong>Save Changes</strong> y luego en <strong>Manual Deploy &gt; Deploy latest commit</strong>.</li>
                </ol>
              </div>
            </body>
          </html>
        `);
      });
    }
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Taller Rodríguez] Servidor con base de datos en tiempo real activo en http://0.0.0.0:${PORT} (WebSocket: /ws)`);
  });
}

startServer().catch(err => {
  console.error('Error starting server', err);
  process.exit(1);
});
