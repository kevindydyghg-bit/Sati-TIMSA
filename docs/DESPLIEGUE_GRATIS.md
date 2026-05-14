# Despliegue gratis SATI-TIMSA

Guia corta para subir la version real sin DigitalOcean.

## Ruta recomendada

```text
Backend + frontend: Render Free
Base de datos: Neon PostgreSQL Free
Imagenes: Supabase Storage Free
Repositorio: GitHub
```

Nota practica: los planes gratis sirven para piloto o uso interno pequeno. Si la empresa depende del sistema 24/7, conviene pasar a un plan pagado con backups, soporte y almacenamiento garantizado.

## 1. Preparar PostgreSQL en Neon

1. Crear proyecto en Neon.
2. Crear una base llamada `sati_timsa`.
3. Copiar el connection string en formato PostgreSQL.
4. Usar SSL en produccion:

```text
PGSSLMODE=require
```

En tu maquina, aplicar la estructura:

```powershell
$env:DATABASE_URL="postgres://usuario:password@host.neon.tech/sati_timsa?sslmode=require"
$env:PGSSLMODE="require"
npm run db:schema
npm run db:seed
npm run admin:create
```

## 2. Preparar imagenes en Supabase

1. Crear proyecto en Supabase.
2. Crear bucket llamado:

```text
equipment-images
```

3. Marcarlo como publico para que el navegador pueda mostrar las imagenes.
4. Copiar:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

No subir la service role key a Git. Solo va en variables de entorno del hosting.

## 3. Variables en Render

Crear un Web Service desde GitHub y configurar:

```text
NODE_ENV=production
APP_URL=https://tu-app.onrender.com
DATABASE_URL=postgres://usuario:password@host.neon.tech/sati_timsa?sslmode=require
PGSSLMODE=require
JWT_SECRET=generar_un_valor_largo_aleatorio_de_32_o_mas_caracteres
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
PG_POOL_MAX=5
PG_IDLE_TIMEOUT_MS=30000
PG_CONNECTION_TIMEOUT_MS=8000
PG_STATEMENT_TIMEOUT_MS=15000
PG_QUERY_TIMEOUT_MS=20000
STORAGE_DRIVER=supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
SUPABASE_BUCKET=equipment-images
```

Para generar un `JWT_SECRET` local:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 4. Comandos del despliegue

Build:

```bash
npm install --omit=dev
```

Start:

```bash
npm start
```

Healthcheck:

```text
/api/health
```

## 5. Validacion antes de subir

```powershell
npm run check:all
npm audit --audit-level=high
```

Luego probar en la URL real:

```text
login admin
dashboard
alta de equipo
subida de imagen
detalle del equipo
exportar PDF
importar CSV en dry_run
mantenimiento
auditoria
usuario PERSONAL solo lectura
```

## 6. Primer push

```powershell
git status
git add .
git commit -m "Prepare free cloud deployment"
git push origin main
```

## 7. Limitaciones gratis

```text
Render Free puede suspender el servicio cuando no hay trafico.
Neon Free tiene limites de almacenamiento, compute y transferencia.
Supabase Free tiene limites de almacenamiento y transferencia.
Las imagenes ya no dependen del disco local cuando STORAGE_DRIVER=supabase.
```
