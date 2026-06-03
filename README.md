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

- **Frontend**: HTML, CSS, JavaScript nativo (Vanilla JS). Sin frameworks. Se minimiza y ofusca para produccion.
- **Backend**: Node.js con Express. API REST con middlewares de seguridad.
- **Base de Datos**: PostgreSQL (Supabase).
- **Infraestructura**: Desplegado en Vercel (serverless).

## Modulos

### 1. Consola / Dashboard
KPIs, graficas interactivas, alertas de stock bajo y garantias proximas a vencer.

### 2. Inventario de Activos
Gestion de equipos: laptops, servidores, monitores, proyectores, routers, switches, tablets, telefonos, UPS, workstations. Permite:
- Filtrar por tipo, marca y modelo
- Ver perfil detallado del equipo con ficha tecnica
- **Etiqueta con codigo de barras** generado por JsBarcode (formato CODE128)
- Imprimir etiqueta para rollo termico 50x25mm
- Historial de comentarios y cambios
- Exportar a PDF y Excel
- Importar por CSV

### 3. Inventario de Accesorios
Control de perifericos (teclados, ratones, camaras, impresoras, radios, telefono, etc.) con cantidad. Los accesorios se almacenan en la misma tabla `equipment` pero se filtran por tipo.

### 4. Control de Stock
Dispositivos almacenados organizados por ubicacion y area. Vista en tabla y en cuadricula.

### 5. Mantenimiento
Tablero de seguimiento con fases: *Revisado* → *En proceso* → *Terminado*. Cuando se marca como terminado, el equipo vuelve al inventario activo.

### 6. Auditoria
Registro inmutable de todas las acciones del sistema en tabla `audit_logs` (append-only, no se puede borrar).

### 7. Cambios Recientes
Vista de auditoria con busqueda, filtros, paginacion y exportacion CSV.

### 8. Usuarios
Gestion de usuarios con roles, bloqueo, reactivacion y reinicio de contrasena (solo ADMIN).

### 9. Ajustes
Tema claro/oscuro, idioma (Espanol/Ingles), densidad visual, animaciones y filas por pagina.

## Seguridad

### Autenticacion
- Cookie `sati_session` (HttpOnly, Secure, SameSite=Strict)
- JWT firmado con secreto de 32+ caracteres
- Expiracion relativa: 2h (configurable)
- Expiracion absoluta: maximo 12h desde la creacion
- Blacklist de tokens al cerrar sesion o cambiar contrasena
- Recordar sesion: hasta 7 dias
- Limite de intentos de login: 12 por 15 minutos

### Contrasenas
- Almacenadas con **bcrypt** (minimo 10 rounds, configurable hasta 12+)
- Largo minimo: 8 caracteres, maximo: 128
- Politica de complejidad validada con Zod

### API
- **CSRF protection**: toda mutacion requiere header `X-Requested-With: XMLHttpRequest`
- **CORS**: restringido a origenes configurados
- **Rate limiting**: 300 requests / 15 min global, 12 / 15 min login
- **Cache-Control**: `no-store, private` en rutas API
- **UUID validation**: todos los parametros `:id` en rutas se validan como UUID
- Logs sanitizados: headers sensibles filtrados

### Headers HTTP (Helmet)
| Header | Valor |
|--------|-------|
| Content-Security-Policy | Restrictivo: scripts solo desde self y JsBarcode CDN |
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

### Roles de Usuario
| Rol | Acceso |
|-----|--------|
| ADMIN | Control total del sistema |
| TI | CRUD operativo de inventario, stock, mantenimiento |
| PERSONAL | Solo lectura y consulta |

## Caracteristicas Destacadas

- **Codigo de barras**: etiqueta termica 50x25mm con JsBarcode CODE128, lista para impresion
- **Idioma**: soporte completo Espanol/Ingles con cambio en vivo
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
│   ├── routes/           8 modulos de rutas (inventory, stock, maintenance, etc.)
│   ├── services/          Audit, mail, token blacklist
│   └── scripts/          Creacion de admin, ejecutor SQL
├── db/                   Schema, seed y migraciones SQL
├── frontend/             Archivos publicos (HTML, CSS, JS, imagenes)
├── private/frontend/     JS fuente antes de minificar/ofuscar
└── scripts/              Build, backup, test SMTP
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
npm run deploy           # Desplegar en Vercel
```
