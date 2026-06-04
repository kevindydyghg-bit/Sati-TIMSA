# SATI-TIMSA — Documentación

**Sistema de Administración de Tecnologías de la Información**

Control de activos TI, accesorios, stock, mantenimiento y auditoría para Hutchison Ports TIMSA. Reemplaza el control en Excel por un registro único, consultable y trazable desde cualquier navegador.

---

## Arquitectura

```
Navegador (HTML + CSS + JS vanilla)
       ↕ API REST (fetch + JSON)
   Node.js + Express (backend)
       ↕ SQL parametrizado
    PostgreSQL (base de datos)
```

- **Frontend**: HTML, CSS, JavaScript nativo. Sin frameworks. Soporte Español/Inglés con traducción en vivo.
- **Backend**: Node.js con Express. API REST con JWT, CSRF doble cookie y rate limiting.
- **Base de datos**: PostgreSQL en Supabase. Migraciones automáticas al iniciar.
- **Infraestructura**: Vercel (serverless). Cada push a main despliega automáticamente.

---

## Estructura del proyecto

```
sati-timsa/
├── api/                      Entrada serverless para Vercel
├── backend/src/
│   ├── config/               Env, pool de PostgreSQL
│   ├── middleware/            Auth JWT, CSRF, error handler
│   ├── routes/               10 módulos (auth, inventory, stock,
│   │                         maintenance, print, users, audit,
│   │                         dashboard, lookups, notes)
│   ├── services/              Auditoría, mail, blacklist de tokens
│   └── scripts/              Creación de admin, ejecutor SQL
├── db/                       Schema, seed y migraciones SQL
├── frontend/                 Archivos públicos (HTML, CSS, JS)
├── private/frontend/         JS fuente antes de minificar/ofuscar
└── scripts/                  Build, backup, test SMTP, print relay
```

---

## Módulos

### Dashboard
KPIs, gráficas interactivas (Chart.js), alertas de stock bajo, garantías próximas a vencer y equipos sin asignar.

### Inventario de activos
Gestión de equipos (laptops, servidores, monitores, proyectores, routers, switches, tablets, teléfonos, UPS, workstations). Cada activo tiene perfil con ficha técnica, código de barras CODE128, historial y etiqueta para impresión térmica 50×25mm. Exportación a PDF/CSV, importación CSV.

### Inventario de accesorios
Periféricos y consumibles (teclados, ratones, cámaras, impresoras, radios, etc.) con cantidad. Se almacenan en la misma tabla que los activos pero el sistema los distingue por tipo.

### Control de stock
Dispositivos en almacén organizados por ubicación y área. Vista en tabla y en cuadrícula.

### Mantenimiento
Seguimiento por fases: Revisado → En proceso → Terminado. Al marcar como terminado, el equipo vuelve a activo automáticamente.

### Auditoría
Registro inmutable de todas las acciones del sistema (append-only). No se puede borrar.

### Cambios recientes
Auditoría con búsqueda, filtros por fecha/usuario/acción, paginación y exportación CSV.

### Usuarios

| Rol | Acceso |
|-----|--------|
| ADMIN | Control total |
| TI | CRUD operativo (inventario, stock, mantenimiento) |
| PERSONAL | Solo lectura |

### Notas y recordatorios
Se crean desde el panel de notificaciones. Persisten en base de datos (tabla `notes`), no se pierden al cambiar de navegador o dispositivo. Si el servidor no responde, se crean localmente como respaldo.

---

## Seguridad

### Autenticación
- Cookie `sati_session` (HttpOnly, Secure, SameSite=Strict)
- JWT firmado con expiración relativa de 2h, máxima absoluta de 12h
- Blacklist de tokens en DB al cerrar sesión o cambiar contraseña
- Recordar sesión hasta 7 días
- Límite de 12 intentos de login por 15 minutos, bloqueo tras 3 fallos

### CSRF (doble cookie)
- Cookie `sati_xsrf` + header `x-xsrf-token` obligatorios en POST/PUT/DELETE
- Si no coinciden, la petición se rechaza con 403
- Rutas de autenticación exentas

### Rate limiting
| Límite | Valor | Rutas |
|--------|-------|-------|
| Global | 300 / 15 min | Todas las rutas API |
| Login | 12 / 15 min | `/api/auth/login` |
| Escritura | 100 / 15 min | Equipo, stock, mantenimiento, usuarios, notas |

### Headers HTTP
CSP restrictivo, HSTS (1 año, preload), X-Frame-Options DENY, sin permisos de cámara/micrófono/GPS.

### Base de datos
- SQL parametrizado (sin inyección)
- SSL/TLS obligatorio en producción
- Check constraints en campos críticos
- Migraciones automáticas al iniciar el servidor

---

## Despliegue

### Requisitos
- Node.js 20+
- PostgreSQL (Supabase)
- Cuenta en Vercel

### Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | Clave de 32+ caracteres |
| `APP_URL` | URL pública de la aplicación |
| `PGSSLMODE` | `require` en producción |

### Comandos

```bash
npm install                # Instalar dependencias
npm run build:frontend     # Minificar y ofuscar JS
npm start                  # Iniciar servidor local (puerto 3000)
vercel --prod              # Desplegar en Vercel
npm run print:relay        # Relay local para impresión Zebra
```

---

## Impresión Zebra

La aplicación está en la nube (Vercel) pero la impresora está en la red local. El botón **Imprimir en Zebra** prueba tres métodos en orden:

1. **Vercel backend** — si el backend alcanza la impresora
2. **Relay local** — servidor Node.js en `localhost:3001` que reenvía a la impresora vía TCP puerto 9100
3. **Descargar ZPL** — como último recurso

Para el relay local:
```bash
npm run print:relay
```

---

## Cambios recientes

| Fecha | Cambio |
|-------|--------|
| Junio 2026 | Notas y recordatorios persistentes en DB (tabla `notes`, API CRUD) |
| Junio 2026 | Fix: migraciones automáticas ahora se ejecutan en Vercel |
| Junio 2026 | Enter confirma formularios (equipo, accesorio, stock, mantenimiento) |
| Junio 2026 | Enter ejecuta búsqueda en inventario, stock y cambios recientes |
| Junio 2026 | Traducción en vivo Español/Inglés con `translateStaticText()` |
| Junio 2026 | CSRF doble cookie + blacklist de tokens en DB |
| Junio 2026 | Relay local de impresión Zebra |
| Junio 2026 | Código de barras CODE128 con JsBarcode |
