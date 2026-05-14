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
```

## Modulos

```text
Login:
  Usuario y contrasena. Sin correo como acceso.

Roles:
  ADMIN y TI escriben. PERSONAL solo consulta.

Inventario:
  Alta, edicion, busqueda, filtros, imagen, PDF, QR e historial.

Accesorios:
  Separacion de perifericos y accesorios del inventario principal.

Mantenimiento:
  Seguimiento por fases: revisado, en proceso y terminado.

Stock de almacenamiento:
  ID de stock, nombre, modelo, serie opcional, cantidad, ubicacion y area.
  La disponibilidad se calcula por cantidad y se ordena de menor a mayor.

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
