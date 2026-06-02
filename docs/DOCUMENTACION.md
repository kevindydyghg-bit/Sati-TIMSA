# SATI-TIMSA

Sistema interno para controlar activos de TI, accesorios y stock. Reemplaza el control en Excel por un registro único, consultable y trazable desde la web.

Arquitectura: frontend vanilla HTML/CSS/JS, backend Node.js/Express, base de datos PostgreSQL. Desplegado en Vercel con Supabase.

## Estructura del proyecto

```
api/                  Entrada serverless para Vercel
backend/src/
  config/             Conexion a BD y variables de entorno
  middleware/         Auth JWT, CSRF, error handler
  routes/             Rutas de la API
  services/           Servicios (mail, blacklist, no-op stubs)
  scripts/            Crear admin, ejecutar SQL
db/                   Schema, seed, migraciones y limpieza
frontend/
  assets/js/app.js    Logica del frontend (vanilla JS)
  assets/css/         Estilos
  pages/index.html    Pagina principal SPA
  assets/img/         Imagenes estaticas
docs/                 Documentacion
```

## Modulos actuales (despues de la limpieza)

| Modulo | Descripcion |
|--------|-------------|
| **Dashboard** | KPIs, graficas, alertas y resumen general del inventario |
| **Inventario** | CRUD de activos TI (laptops, monitores, desktops, servidores, etc.) con filtros por tipo, marca, modelo |
| **Accesorios** | Perifericos con cantidad, ubicacion, area, proveedor |
| **Stock** | Equipos disponibles por ubicacion con cantidades y vista en cuadricula |
| **Usuarios** | Gestion de usuarios, roles, bloqueo, reactivacion y reseteo de contrasena |
| **Ajustes** | Tema claro/oscuro, idioma, densidad visual, animaciones |

### Modulos eliminados

| Modulo | Motivo |
|--------|--------|
| Mantenimiento | Se removio el modulo de ordenes de mantenimiento por fases |
| Auditoria / Historial | Se removio el registro de eventos y cambios recientes |
| Servicios Cloud | Se removio la seccion de servicios en la nube |
| Subida de fotos | Se removio la carga de imagenes para equipos y stock |
| Codigo QR | Reemplazado por etiqueta TIMSA con datos del equipo |

## Seguridad

- **JWT en cookie HttpOnly** (no localStorage) con blacklist al hacer logout
- **CSRF**: toda mutacion requiere header `X-Requested-With: XMLHttpRequest`
- **Headers**: HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **Passwords**: bcrypt (12 rounds), minimo 8 caracteres, maximo 128
- **Rate limit**: 300 requests/15min global, 12 intentos de login/15min
- **SQL injection**: 100% sentencias parametrizadas
- **Errores**: mensajes genericos al cliente, logs detallados en servidor
- **Roles**: ADMIN (control total), TI (CRUD inventario), PERSONAL (solo lectura)

## Base de datos

Tablas principales:
- `users` - usuarios del sistema
- `equipment` - activos TI
- `equipment_types`, `brands`, `equipment_models` - catalogos
- `locations`, `areas` - ubicaciones
- `stock_items` - equipos en stock

Comandos:
```powershell
npm run db:schema    # Crear esquema
npm run db:seed      # Poblar datos iniciales
npm run admin:create # Crear usuario admin
```

## Para empezar a trabajar

```powershell
npm install
npm run db:schema
npm run db:seed
npm run admin:create
npm run dev
```

El sistema arranca en `http://localhost:3000`. Por defecto el frontend se sirve desde la misma URL.

## Variables de entorno (produccion)

```
NODE_ENV=production
APP_URL=https://tu-dominio.vercel.app
DATABASE_URL=postgresql://...
PGSSLMODE=require
JWT_SECRET=<minimo 32 caracteres>
BCRYPT_ROUNDS=12
```

## Preguntas frecuentes para la revision (jueves)

**¿Que hace el sistema?**  
Controlar todos los activos de TI de la empresa: laptops, monitores, servidores, accesorios y stock. Cada equipo tiene un perfil con numero de serie, ubicacion, area, usuario asignado y estado.

**¿Que cambios se hicieron?**  
Se limpio el sistema eliminando modulos que no se usaban (mantenimiento, auditoria, cloud, fotos, QR). Se migro a etiqueta TIMSA para identificacion de equipos. Se endurecio la seguridad (CSRF, headers, rate limiting, manejo de errores).

**¿Por que se eliminaron esos modulos?**  
Porque no estaban en uso operativo y agregaban complejidad innecesaria al codigo. Si se necesitan en el futuro, los endpoints devuelven 410 Gone (modulo deshabilitado) en lugar de 404.

**¿Como se accede?**  
Via web con usuario y contrasena. Hay 3 roles: ADMIN (todo), TI (editar inventario), PERSONAL (solo consultar).

**¿Donde esta la base de datos?**  
En PostgreSQL (Supabase en produccion, local con el schema SQL incluido).

**¿Hay respaldo de la informacion?**  
La BD tiene seed SQL con los datos actuales. El esquema completo esta versionado en `db/schema.sql`.

**¿Que pasa si alguien intenta hackear el sistema?**  
Hay proteccion multiple: JWT con expiracion corta, CSRF obligatorio, rate limiting por IP, headers de seguridad, y todas las queries usan parametros (no concatenacion de strings).
