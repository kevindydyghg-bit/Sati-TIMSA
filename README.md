# SATI-TIMSA

Sistema para controlar los activos de TI, accesorios, stock, mantenimiento y auditoria. Reemplaza el Excel por algo que siempre esta actualizado y accesible desde el navegador.

## Como funciona

```
Navegador (HTML + CSS + JS)
       ↕
Node.js + Express (API)
       ↕
PostgreSQL (base de datos en la nube)
```

- **Frontend**: HTML, CSS y JavaScript natural, sin frameworks. Cambia de idioma al instante sin recargar.
- **Backend**: API con Express. Seguridad normalita pero seria: JWT, doble cookie CSRF, limite de peticiones.
- **Base de datos**: PostgreSQL en Supabase.
- **Infraestructura**: Vercel (serverless). Cada push a main despliega automaticamente.

## Lo que hace

### Inventario de equipos y accesorios
Lista, crea, edita y busca equipos (laptops, monitores, servidores, etc.) y accesorios (teclados, ratones, camaras...). Cada activo tiene su perfil, codigo de barras, historial y etiqueta para imprimir en Zebra.

### Stock
Dispositivos en almacen organizados por ubicacion y area.

### Mantenimiento
Seguimiento por fases: Revisado → En proceso → Terminado. Cuando termina, el equipo vuelve automaticamente a activo.

### Auditoria y cambios recientes
Todo lo que pasa en el sistema queda registrado. No se puede borrar. Ideal para saber quien hizo que y cuando.

### Usuarios
Roles: ADMIN (todo), TI (opera inventario), PERSONAL (solo lectura).

### Notas y recordatorios
Se guardan en la base de datos, asi que no se pierden al cambiar de navegador o dispositivo.

## Seguridad (lo basico)

- Sesion por cookie segura (JWT). Sesion recordada hasta 7 dias.
- Doble cookie CSRF: las operaciones de escribir necesitan un token especial.
- Contrasenas con bcrypt.
- Limite de intentos de login y de peticiones.
- Headers HTTP restrictivos (CSP, HSTS, etc.).
- SQL parametrizado, nada de inyeccion.
- Lo que se borra (logout, cambio de contrasena) se invalida al instante.

## Para correrlo local

```
npm install
npm run build:frontend
npm start
```

### Variables necesarias
- `DATABASE_URL` — conexion a PostgreSQL
- `JWT_SECRET` — clave de 32+ caracteres
- `APP_URL` — dominio donde corre

### Despliegue
```
vercel --prod
```

## Directorios rapidos

- `backend/src/routes/` — los endpoints de la API
- `frontend/` — HTML, CSS, JS que ve el navegador
- `private/frontend/` — JS fuente antes de minificar
- `db/` — schema y migraciones SQL
- `scripts/` — build, backup, relay de impresion Zebra
