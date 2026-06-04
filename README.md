# SATI-TIMSA

**Sistema de Administracion de Tecnologias de la Informacion**

Sistema web interno para controlar activos de TI, accesorios, stock, mantenimiento y auditoria. Reemplaza el control en Excel por un registro unico, consultable y trazable desde cualquier navegador.

## Arquitectura

```
Navegador (HTML + CSS + JS vanilla)
       ↕ API REST (fetch + JSON)
   Node.js + Express (backend)
       ↕ SQL parametrizado
    PostgreSQL (base de datos)
```

- **Frontend**: HTML, CSS, JavaScript nativo (Vanilla JS). Sin frameworks. Soporte completo de idioma Espanol/Ingles con traduccion en vivo.
- **Backend**: Node.js con Express. API REST con middlewares de seguridad (JWT, CSRF doble cookie, rate limiting).
- **Base de Datos**: PostgreSQL (Supabase). Migraciones automaticas al iniciar.
- **Infraestructura**: Desplegado en Vercel (serverless).

## Modulos

### 1. Consola / Dashboard
KPIs, graficas interactivas (Chart.js), alertas de stock bajo y garantias proximas a vencer.

### 2. Inventario de Activos
Gestion de equipos: laptops, servidores, monitores, proyectores, routers, switches, tablets, telefonos, UPS, workstations. Permite:
- Filtrar por tipo, marca y modelo
- Ver perfil detallado del equipo con ficha tecnica
- **Etiqueta con codigo de barras** generado por JsBarcode (formato CODE128)
- Imprimir etiqueta para rollo termico 50x25mm
- Descargar ZPL e imprimir directamente a impresora Zebra (TCP puerto 9100)
- Historial de comentarios y cambios
- Exportar a PDF y Excel
- Importar por CSV

### 3. Inventario de Accesorios
Control de perifericos (teclados, ratones, camaras, impresoras, radios, etc.) con cantidad. Los accesorios se almacenan en la misma tabla `equipment` pero se filtran por tipo.

### 4. Control de Stock
Dispositivos almacenados organizados por ubicacion y area. Vista en tabla y en cuadricula.

### 5. Mantenimiento
Tablero de seguimiento con fases: *Revisado* → *En Proceso* → *Terminado*. Cuando se marca como terminado, el equipo vuelve al inventario activo.

### 6. Auditoria
Registro inmutable de todas las acciones del sistema en tabla `audit_logs` (append-only, no se puede borrar).

### 7. Cambios Recientes
Vista de auditoria con busqueda, filtros, paginacion y exportacion CSV.

### 8. Usuarios
Gestion de usuarios con roles, bloqueo, reactivacion y reinicio de contrasena (solo ADMIN).

### 9. Ajustes
Tema claro/oscuro, idioma (Espanol/Ingles con traduccion en vivo sin recargar pagina), densidad visual, animaciones, filas por pagina e IP de impresora Zebra.

## Seguridad

### Autenticacion
- Cookie `sati_session` (HttpOnly, Secure, SameSite=Strict)
- JWT firmado con secreto de 32+ caracteres
- Expiracion relativa: 2h (configurable)
- Expiracion absoluta: maximo 12h desde la creacion
- **Blacklist de tokens persistida en DB** (`token_blacklist` tabla, con hash SHA-256) al cerrar sesion o cambiar contrasena
- Recordar sesion: hasta 7 dias
- Limite de intentos de login: 12 por 15 minutos
- Bloqueo temporal tras 3 intentos fallidos consecutivos

### Proteccion CSRF (doble cookie)
- Cookie `sati_xsrf` (SameSite=Strict, accesible desde JS)
- Header `x-xsrf-token` requerido en toda mutacion (POST, PUT, PATCH, DELETE)
- El servidor compara ambos valores; si no coinciden, rechaza la peticion con 403
- Las rutas de autenticacion (`/api/auth/*`) estan exentas de CSRF
- Endpoint `GET /api/csrf-token` para obtener/renovar el token al iniciar sesion

### Contrasenas
- Almacenadas con **bcrypt** (minimo 10 rounds, configurable hasta 12+)
- Largo minimo: 8 caracteres, maximo: 128
- Politica de complejidad validada con Zod

### API
- **CSRF doble cookie**: toda mutacion requiere cookie `sati_xsrf` + header `x-xsrf-token`
- **CORS**: restringido a origenes configurados
- **Rate limiting**: 300 requests / 15 min global, 12 / 15 min login, **100 / 15 min escritura** (writeRateLimit en rutas de equipo, stock, mantenimiento, usuarios, notas)
- **Cache-Control**: `no-store, private` en rutas API
- **UUID validation**: todos los parametros `:id` en rutas se validan como UUID
- Logs sanitizados: headers sensibles filtrados (authorization, cookie, etc.)

### Headers HTTP (Helmet)
| Header | Valor |
|--------|-------|
| Content-Security-Policy | Restrictivo: scripts solo desde self y Chart.js CDN |
| Strict-Transport-Security | 1 ano, includeSubDomains, preload |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | Todo deshabilitado (camara, microfono, GPS, etc.) |

### Base de Datos
- SSL/TLS obligatorio en produccion (PGSSLMODE=require)
- **Consultas parametrizadas**: todas las queries SQL usan `$1, $2, ...` (SQL injection prevenido)
- Check constraints en campos criticos (status, quantity, phase)
- Clasificacion de datos por sensibilidad en schema
- **Auto-migration**: las tablas `token_blacklist` y `notes` se crean automaticamente al iniciar el servidor (incluso en Vercel serverless)

### Roles de Usuario
| Rol | Acceso |
|-----|--------|
| ADMIN | Control total del sistema |
| TI | CRUD operativo de inventario, stock, mantenimiento |
| PERSONAL | Solo lectura y consulta |

## Caracteristicas Destacadas

- **Codigo de barras**: etiqueta termica 50x25mm con JsBarcode CODE128, lista para impresion
- **Idioma**: soporte completo Espanol/Ingles con cambio **en vivo** sin recargar pagina (traduccion de textos estaticos, atributos, placeholders, mensajes del sistema, dialogos, notificaciones y patrones numericos)
- **Impresion Zebra desde la nube**: 3 niveles de fallback — Vercel backend → relay local (`localhost:3001`) → descarga de archivo ZPL
- **Tema oscuro**: respeta preferencia del sistema, conmutable en ajustes
- **Exportacion**: PDF, Excel, CSV
- **Importacion**: carga masiva por CSV con validacion
- **Notificaciones**: alertas visuales de stock bajo, garantias proximas a vencer, equipos sin asignar
- **Sin dependencias pesadas**: frontend vanilla JS, backend Express con middlewares minimos

## Estructura del Proyecto

```
sati-timsa/
├── api/                  Entrada serverless para Vercel
├── backend/src/
│   ├── config/           Env, pool de PostgreSQL
│   ├── middleware/        Auth JWT, CSRF, error handler
│   ├── routes/           10 modulos de rutas (auth, inventory, stock, maintenance, print, users, audit, dashboard, lookups, notes)
│   ├── services/          Audit, mail, token blacklist (DB)
│   └── scripts/          Creacion de admin, ejecutor SQL
├── db/                   Schema, seed y migraciones SQL
├── frontend/             Archivos publicos (HTML, CSS, JS, imagenes)
├── private/frontend/     JS fuente antes de minificar/ofuscar
└── scripts/              Build, backup, test SMTP, print relay
```

## Despliegue

### Requisitos
- Node.js 20+
- PostgreSQL (supabase.com gratis)
- Cuenta en Vercel (vercel.com)

### Variables de Entorno
| Variable | Descripcion |
|----------|-------------|
| DATABASE_URL | Cadena de conexion PostgreSQL |
| JWT_SECRET | Secreto para firmar tokens (min 32 caracteres) |
| APP_URL | URL publica de la aplicacion |
| PGSSLMODE | `require` en produccion |

### Comandos
```bash
npm install              # Instalar dependencias
npm run build:frontend   # Minificar y ofuscar JS
npm start                # Iniciar servidor en puerto 3000
npm run print:relay      # Iniciar relay local para impresion Zebra (localhost:3001)
vercel --prod            # Desplegar en Vercel
```
