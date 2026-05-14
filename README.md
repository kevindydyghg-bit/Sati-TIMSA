# SATI-TIMSA

Sistema interno para administrar inventario de TI, accesorios, mantenimiento y stock de almacenamiento.

## Stack

```text
Frontend: HTML/CSS/JS vanilla
Backend: Node.js + Express
DB: PostgreSQL
Auth: JWT + bcrypt
Storage: local en desarrollo, Supabase en produccion
```

## Funcionalidad

```text
Login por usuario.
Roles ADMIN, TI y PERSONAL.
Inventario con ID de equipo, serie, ubicacion, area, imagen, PDF y QR.
Inventario separado de accesorios.
Mantenimiento por fases.
Stock con ID, cantidad disponible, ubicacion y area.
Importacion CSV desde plantilla Excel.
Auditoria en PostgreSQL.
Administracion de usuarios.
```

## Correr local

```powershell
cd C:\SATI-TIMSA
Copy-Item .env.example .env
npm install
npm run db:schema
npm run db:seed
npm run admin:create
npm run dev
```

Abrir:

```text
http://localhost:3000
```

Credencial inicial segun `.env.example`:

```text
admin
Admin123!
```

## Produccion

Variables principales:

```text
NODE_ENV=production
APP_URL=https://tu-dominio.com
DATABASE_URL=postgres://usuario:password@host:5432/sati_timsa
PGSSLMODE=require
JWT_SECRET=secreto_largo
STORAGE_DRIVER=supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=equipment-images
```

Arranque:

```bash
npm install --omit=dev
npm start
```

## Validar antes de subir

```powershell
npm run db:schema
npm run check:all
npm audit --audit-level=high
```

## Docs

```text
docs/DOCUMENTACION.md
docs/DESPLIEGUE_GRATIS.md
```
