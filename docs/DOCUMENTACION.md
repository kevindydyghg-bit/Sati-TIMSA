# SATI-TIMSA - Documentacion tecnica

Sistema web para inventario y control de activos de TI en TIMSA.

## Stack

```text
Frontend: HTML, CSS y JavaScript vanilla
Backend: Node.js + Express
Base de datos: PostgreSQL
Auth: JWT + bcrypt
Archivos: multer, Supabase Storage opcional
Reportes: PDFKit y QRCode
Graficas: Chart.js via CDN
```

## Modulos

```text
Login:
  Usuario y contrasena. Sin correo como acceso.

Roles:
  ADMIN y TI escriben. PERSONAL solo consulta.

Inventario de activos:
  Laptops, monitores, desktops, proyectores, routers, servers, switches, tablets, telefonos, UPS y workstations.
  Campos principales: ID, tipo, marca, modelo, numero de serie, ID de inventario, ubicacion, area y usuario.
  La ficha muestra historial con usuario asignado actual y cambios de asignacion.

Dashboard:
  Graficas de estado, tipos principales, ubicaciones, mantenimiento, garantias, stock y cambios recientes.
  El endpoint protegido `/api/dashboard/stats` alimenta KPIs y graficas Chart.js.

Accesorios:
  Separacion de perifericos y accesorios del inventario principal.

Mantenimiento:
  Seguimiento por fases: revisado, en proceso y terminado.

Stock de almacenamiento:
  ID de stock, nombre, modelo, serie opcional, cantidad, ubicacion, area y foto.
  La disponibilidad se calcula por cantidad y se ordena de menor a mayor. La vista usa cuadricula, imagen y detalle al pasar el cursor.

Auditoria:
  Eventos de usuario, acciones y cambios relevantes.

Usuarios:
  Alta, bloqueo, roles y reseteo de contrasena.
```

## Base de datos

Tablas principales:

```text
roles
users
equipment_types
brands
equipment_models
locations
areas
equipment
equipment_history
maintenance_orders
stock_items
audit_logs
```

Migraciones recientes:

```text
005_stock_items.sql
006_stock_quantity.sql
007_stock_item_code.sql
008_timsa_assets_import.sql
009_stock_item_images.sql
```

## Variables

Minimas:

```text
DATABASE_URL
JWT_SECRET
APP_URL
PGSSLMODE=require
```

Imagenes en produccion:

```text
STORAGE_DRIVER=supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=equipment-images
```

No subir `.env` ni llaves reales.

## Arranque local

```powershell
cd C:\SATI-TIMSA
Copy-Item .env.example .env
npm install
npm run db:schema
npm run db:seed
npm run admin:create
npm run dev
```

URL local:

```text
http://localhost:3000
```

## CSV

La plantilla se descarga desde inventario con `Plantilla Excel`.

Encabezados:

```text
Serie, ID Equipo, Usuario Asignado, Tipo, Marca, Modelo, Ubicacion, Area, Estado, Notas, Proveedor, Fecha De Compra, Garantia Hasta
```

El importador acepta coma, punto y coma o tabulador.

## Validacion

Antes de subir cambios:

```powershell
npm run db:schema
npm run check:all
npm audit --audit-level=high
```

Pruebas manuales minimas:

```text
login admin
crear/editar equipo
crear stock con ID y cantidad
mover stock de area
exportar PDF
importar CSV en dry_run
validar usuario PERSONAL solo lectura
```

## Despliegue

La guia de despliegue gratis esta en:

```text
docs/DESPLIEGUE_GRATIS.md
```
