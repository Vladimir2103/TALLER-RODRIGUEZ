# Guía de Despliegue en Render (Render.com) - Taller Rodríguez Rodríguez

Esta guía detalla los pasos para alojar el sistema integral de **Taller Rodríguez Rodríguez** en Render con base de datos 100% optimizada, segura y funcional.

---

## 1. Características de la Base de Datos en Producción (Render)

- **Escrituras Atómicas con `fsync`**: El servidor nunca sobrescribe el archivo directamente. Escribe en un archivo temporal, sincroniza los bloques físicos en disco (`fs.fsyncSync`) y renombra atómicamente. Si el contenedor se apaga o reinicia a media escritura, la base de datos jamás se corrompe.
- **Respaldos Automáticos Rotativos**: Cada modificación crea una instantánea con marca de tiempo en la carpeta `backups/`. Se guardan automáticamente las últimas 30 copias de seguridad.
- **Recuperación Automática ante Fallos**: Si el archivo principal sufre alguna anomalía, el servidor busca automáticamente la copia de respaldo más reciente y la restaura sin pérdida de datos.
- **Soporte de Disco Persistente (Render Disk)**: El servidor detecta automáticamente si existe un disco montado en `/var/data` o la variable `DATA_DIR` y almacena los datos allí.
- **Descarga de Base de Datos en 1 Clic**: Desde el modal de la nube o vía `/api/database/backup`, puedes descargar el archivo JSON oficial del servidor en cualquier momento.
- **Seguridad Reforzada**: Cabeceras `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy`, y `trust proxy` para la terminación SSL de Render.
- **Apagado Ordenado (`Graceful Shutdown`)**: Ante señales `SIGTERM` o `SIGINT` de Render, el servidor guarda de inmediato el estado actual en disco antes de terminar.

---

## 2. Pasos para Subir y Desplegar en Render

### Paso A: Subir el Código a GitHub o GitLab
1. Crea un repositorio privado o público en GitHub (por ejemplo, `taller-rodriguez-rodriguez`).
2. Sube los archivos del proyecto a tu repositorio de GitHub:
   ```bash
   git init
   git add .
   git commit -m "Sistema Taller Rodríguez Rodríguez listo para Render"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/taller-rodriguez-rodriguez.git
   git push -u origin main
   ```

### Paso B: Crear el Web Service en Render
1. Ve a [Render.com](https://render.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **New +** y selecciona **Web Service**.
3. Conecta tu repositorio de GitHub `taller-rodriguez-rodriguez`.
4. Configura los siguientes campos:
   - **Name**: `taller-rodriguez-rodriguez` (o el nombre que prefieras).
   - **Region**: Oregon (EE. UU.) o la más cercana.
   - **Branch**: `main`.
   - **Runtime**: `Node`.
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free` (o `Starter`).

### Paso C: Variables de Entorno (Environment Variables)
En la sección **Environment Variables** de tu servicio en Render, agrega:
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render asigna el puerto automáticamente, pero puedes definirlo)

*(Opcional si usas un disco persistente de Render)*:
- `DATA_DIR`: `/var/data`

### Paso D: Ruta de Verificación de Salud (Health Check)
En la sección **Advanced**:
- **Health Check Path**: `/api/health`

### Paso E: Desplegar
Haz clic en **Create Web Service**. Render instalará las dependencias, compilará el frontend con Vite y ejecutará el servidor Node/Express con WebSockets en vivo.

---

## 3. Persistencia de Datos en Render

### Opción 1: Plan Gratuito de Render (Free Tier)
En el plan gratuito, el servidor mantiene la base de datos en `workshop_database.json` con respaldos automáticos en la carpeta `backups/`.
- **Recomendación**: Usa el botón **"Descargar BD Servidor"** en el modal de la nube de la aplicación periódicamente para guardar una copia de seguridad en tu computadora o teléfono.

### Opción 2: Plan con Disco Persistente (Render Starter con Disk)
Si contratas un disco persistente en Render ($1/mes por 1 GB):
1. En la pestaña **Disks** de tu Web Service en Render, haz clic en **Add Disk**.
2. **Name**: `taller-db-storage`
3. **Mount Path**: `/var/data`
4. **Size**: `1 GB`
5. El sistema detectará automáticamente `/var/data` y guardará la base de datos y todos los respaldos en ese disco sin que se borren jamás, incluso si despliegas nuevas versiones del código.

---

## 4. Endpoints de Base de Datos Disponibles en Producción

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/health` | `GET` | Estado del servidor, clientes WebSocket y ruta de base de datos |
| `/api/database` | `GET` | Carga el estado completo autoritativo de la base de datos |
| `/api/database/backup` | `GET` | Descarga directa del archivo JSON de respaldo oficial |
| `/api/database/restore` | `POST` | Restaura la base de datos desde un archivo JSON con respaldo previo de seguridad |
| `/api/database/info` | `GET` | Tamaño en KB del archivo de BD, número de respaldos rotativos y estadísticas |
| `/ws` | `WS/WSS` | Canal de sincronización en tiempo real para todos los dispositivos conectados |
