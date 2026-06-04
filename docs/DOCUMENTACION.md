# SATI-TIMSA — Documentacion

Sistema para que el departamento de TI de Hutchison Ports TIMSA deje de usar Excel y tenga todo el inventario centralizado, siempre actualizado y con trazabilidad.

## De un vistazo

| Que problema resuelve | Como |
|---|---|
| Inventario desactualizado | Los datos estan en vivo, no en archivos |
| Equipos perdidos | Cada activo tiene codigo de barras para etiquetar |
| Sin trazabilidad | Cada accion queda registrada (quien, cuando, que) |
| Mantenimiento sin control | Seguimiento por fases con historial |

## Modulos

### Dashboard
KPIs, graficas, alertas de stock bajo, garantias por vencer y equipos sin asignar.

### Inventario de activos
Gestion completa: alta, edicion, busqueda por tipo/marca/modelo, perfil con ficha tecnica, codigo de barras, historial, exportacion PDF/CSV, importacion CSV.

### Inventario de accesorios
Perifericos y consumibles (teclados, ratones, camaras, etc.). Se almacenan en la misma tabla que los activos pero el sistema los distingue por tipo. No piden datos de activo (asset_tag, garantia, etc.).

### Stock
Dispositivos en almacen por ubicacion y area.

### Mantenimiento
Fases: Revisado → En proceso → Terminado. Al terminar, el equipo vuelve a activo.

### Auditoria
Registro de todo: quien creo, edito, elimino, ingreso al sistema. No se puede borrar.

### Cambios recientes
La auditoria con busqueda, filtros por fecha/usuario/accion y exportacion CSV.

### Usuarios
| Rol | Puede |
|---|---|
| ADMIN | Todo |
| TI | Crear, editar, eliminar inventario, stock, mantenimiento |
| PERSONAL | Solo ver |

### Notas y recordatorios
Se crean desde el panel de notificaciones (campana). Ahora se guardan en la base de datos, asi que sobreviven a cambios de navegador, dispositivo o sesion. Si el servidor falla, se crean localmente como respaldo.

## Como se conecta todo

```
Te logueas → cookie de sesion
   ↓
Cada peticion → se valida la cookie, el token CSRF (si vas a escribir), el limite de peticiones
   ↓
La API hace SQL parametrizado (nada de inyeccion)
   ↓
El frontend recibe JSON y pinta la pantalla
```

## Seguridad en simple

- **Sesion**: cookie HttpOnly + Secure + SameSite. JWT firmado. Al cerrar sesion el token se invalida en DB.
- **CSRF**: cookie especial + header en cada POST/PUT/DELETE. Si no coinciden, 403.
- **Rate limit**: 300 peticiones cada 15 min en general, 12 por 15 min para login, 100 cada 15 min para escribir.
- **Contrasenas**: bcrypt, minimo 8 caracteres.
- **Headers**: CSP restrictivo, HSTS, X-Frame-Options DENY, etc.
- **SQL**: siempre parametrizado.

## Para desplegar

Necesitas:
- Node.js 20+
- PostgreSQL (Supabase gratis)
- Cuenta en Vercel

Variables de entorno:
```
DATABASE_URL=postgresql://...
JWT_SECRET=clave_de_32_caracteres
APP_URL=https://tusitio.com
PGSSLMODE=require
```

Comandos:
```
npm install
npm run build:frontend
npm start                    # local
vercel --prod                # produccion
npm run print:relay          # relay para impresion Zebra local
```

## Impresion Zebra

Como la app esta en la nube y la impresora en la red local, al hacer clic en "Imprimir en Zebra" el sistema prueba:
1. El backend en Vercel (si esta en la misma red)
2. Un relay local en `localhost:3001` (tienes que tenerlo corriendo)
3. Descargar el archivo ZPL

Para el relay local:
```
npm run print:relay
```

## Lo que cambió (ultimo)

- Notas y recordatorios ahora persistentes en DB
- Las migraciones se ejecutan correctamente en Vercel (antes no corrian)
- Enter funciona en formularios: al presionarlo guarda el equipo, accesorio, etc.
- Enter tambien busca en los campos de busqueda (inventario, stock, cambios recientes)
