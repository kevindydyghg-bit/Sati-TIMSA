# SATI-TIMSA - Documentacion

**Sistema de Administracion de Tecnologias de la Informacion**
Control de activos TI, accesorios, stock, mantenimiento y auditoria.

> **Presentacion**: Esta documentacion explica como funciona el sistema, sus modulos, la arquitectura, las caracteristicas de seguridad y como desplegarlo. Disenada para entender el sistema completo en una sola lectura.

---

## 1. Que es SATI-TIMSA?

Es un sistema web interno para el departamento de TI de **Hutchison Ports TIMSA**. Su proposito es reemplazar el control de inventario en hojas de Excel por un sistema centralizado, accesible desde el navegador, con trazabilidad completa de todos los cambios.

### Que problemas resuelve?
- **Inventario desactualizado**: los datos siempre estan en vivo, no en archivos que pueden perderse
- **Perdida de equipos**: cada activo tiene un codigo de barras imprimible para etiquetado fisico
- **Falta de trazabilidad**: todas las acciones quedan registradas en auditoria (quien, cuando, que cambio)
- **Mantenimiento sin control**: seguimiento por fases con historial completo

---

## 2. Como funciona? (Arquitectura)

```
Tu navegador (Chrome, Edge, Firefox)
       │
       ▼  (fetch + JSON)
   ┌─────────────────────┐
   │  API REST (Express) │  ← Node.js
   │  - Rutas            │
   │  - Middlewares       │
   │  - Validacion Zod   │
   └─────────┬───────────┘
             │  (SQL parametrizado)
             ▼
   ┌─────────────────────┐
   │  PostgreSQL         │  ← Supabase
   │  - Tablas           │
   │  - Auditoria        │
   │  - Indices          │
   └─────────────────────┘
```

### Flujo de una peticion tipica:

1. Abres el navegador en `https://sati-timsa-zeta.vercel.app`
2. El servidor Node.js en Vercel recibe la peticion
3. Sirve el HTML, CSS y JS (frontend)
4. Tu navegador ejecuta el JS, que hace fetch a la API
5. La API valida tu sesion (JWT en cookie), aplica CSRF, rate limiting
6. Ejecuta la consulta SQL parametrizada contra PostgreSQL
7. Devuelve JSON, el frontend lo renderiza

### Tecnologias usadas:

| Componente | Tecnologia | Por que? |
|------------|-----------|----------|
| Frontend | HTML, CSS, JS vanilla | Sin frameworks pesados, carga rapida |
| Backend | Node.js + Express | Ligero, ampliamente usado |
| Base de datos | PostgreSQL | Confiable, SQL avanzado, gratis en Supabase |
| Codigo de barras | JsBarcode | Libreria JS que genera barcode en el navegador |
| Seguridad | Helmet, JWT, bcrypt, Zod | Estandares OWASP |
| Infraestructura | Vercel (serverless) | Despliegue automatico desde GitHub |

---

## 3. Modulos del Sistema

### 3.1 Consola / Dashboard
**Que hace**: Muestra indicadores clave del inventario en graficas y tarjetas.
**Para que sirve**: Dar una vista rapida del estado general sin entrar a cada modulo.

Datos que muestra:
- Total de activos, accesorios y stock registrados
- Equipos en mantenimiento
- Stock disponible por ubicacion
- Alertas: garantias por vencer, stock bajo, equipos sin asignar
- Grafica de distribucion por tipo de equipo
- Cambios recientes (ultimos 50 eventos)

### 3.2 Inventario de Activos
**Que hace**: Lista, busca, crea, edita y elimina equipos.
**Para que sirve**: Llevar el control de todos los activos de TI.

Campos de un activo:
- Tipo (Laptop, Desktop, Monitor, Router, Server, etc.)
- Marca y modelo
- Numero de serie (unico)
- ID de inventario (asset_tag, ej. 400001)
- Usuario asignado
- Proveedor
- Fecha de compra, garantia
- Estado (Activo, Mantenimiento, Baja, Resguardo)
- Ubicacion y area
- Notas

**Perfil del equipo**: Al seleccionar un equipo, se abre un panel con:
- Ficha tecnica (cantidad, proveedor, compra, garantia, quien actualizo)
- **Etiqueta del activo**: codigo de barras generado automaticamente
- Historial de comentarios
- Ordenes de mantenimiento

**Etiqueta para imprimir**: La etiqueta mide 51x25mm (formato rollo termico, esquinas redondeadas). Incluye:
- Logo de TIMSA (arriba izquierda, imagen monocromo)
- HUTCHISON PORTS TIMSA (arriba izquierda)
- ID del activo (arriba derecha, sin cortarse)
- Tipo de equipo (centro, mayusculas)
- Codigo de barras CODE128 del numero de serie (centro, sin linea de interpretacion)
- Numero de serie en texto (centro, debajo del codigo)
- Propiedad de TIMSA (abajo)

**Impresion en Zebra ZD421**: Ademas de la impresion por navegador, el sistema genera ZPL para impresoras termicas Zebra:
1. En el perfil del equipo, usar **"Descargar ZPL"** para obtener el archivo `.zpl`
2. O usar **"Imprimir en Zebra"** para enviarlo directamente a la impresora via red (puerto 9100)
3. La IP de la impresora se configura en **Ajustes → IP Impresora Zebra** (por defecto: `10.132.4.51`)
4. El logo TIMSA se incrusta en el ZPL como grafico `^GFA` (monocromo 80x25 dots, convertido automaticamente en el navegador)

### 3.3 Inventario de Accesorios
**Que funciona igual que activos pero con diferencias**:
- Los accesorios se identifican por su tipo (teclado, raton, camara, impresora, radio, etc.)
- Se almacenan en la misma tabla `equipment` que los activos
- No requieren asset_tag, fecha de compra ni garantia
- Tienen campo de cantidad visible
- El sistema detecta automaticamente si estas creando un activo o un accesorio segun el tipo seleccionado

**Por que usan la misma tabla**: Simplifica el codigo y permite busquedas unificadas. El filtro por tipo separa automaticamente activos de accesorios.

### 3.4 Control de Stock
**Que hace**: Gestiona dispositivos almacenados que no estan asignados a nadie.
**Para que sirve**: Control de inventario de consumibles y repuestos.

Diferencia con activos: el stock no se asigna a usuarios, solo se registra por ubicacion con cantidad. Ej: "10 mouse genericos en almacen central".

### 3.5 Mantenimiento
**Que hace**: Registra equipos enviados a reparacion con seguimiento por fases.
**Para que sirve**: Saber en todo momento que equipos estan en taller y en que estado.

Fases:
1. **Revisado** → el equipo llego al taller
2. **En proceso** → se esta reparando
3. **Terminado** → se devolvio, el equipo vuelve a estar "Activo" en inventario

### 3.6 Auditoria
**Que hace**: Registra cada accion importante del sistema.
**Para que sirve**: Saber quien hizo que y cuando (no repudio).

La tabla `audit_logs` es **append-only** (solo se agregan registros, nunca se borran). Cada entrada guarda:
- Usuario que realizo la accion
- Tipo de accion (CREATE, UPDATE, DELETE, LOGIN, etc.)
- Entidad afectada (equipment, user, stock, etc.)
- ID de la entidad
- Metadata adicional (JSON)
- Direccion IP y user agent

---

## 4. Base de Datos

### Tablas principales

| Tabla | Que guarda |
|-------|-----------|
| `users` | Usuarios del sistema (nombre, email, password_hash, rol) |
| `roles` | Roles disponibles (ADMIN, TI, PERSONAL, LECTURA) |
| `equipment` | Activos y accesorios (tipo, serie, marca, modelo, ubicacion, estado) |
| `equipment_history` | Historial de cambios en cada equipo |
| `maintenance_orders` | Ordenes de mantenimiento (fase, notas, fechas) |
| `stock_items` | Dispositivos en almacen (nombre, modelo, cantidad) |
| `equipment_types` | Catalogo de tipos de equipo |
| `brands` | Catalogo de marcas |
| `equipment_models` | Catalogo de modelos (vinculados a marca) |
| `locations` | Catalogo de ubicaciones |
| `areas` | Catalogo de areas (vinculadas a ubicacion) |
| `audit_logs` | Registro de auditoria (append-only) |

### Seguridad en base de datos
- **Consultas parametrizadas**: ningun valor concatenado directamente en SQL
- **Check constraints**: evitan valores invalidos (status solo permite valores definidos)
- **Unique constraints**: evitan duplicados (serial_number, asset_tag)
- **Foreign keys**: garantizan integridad referencial
- **Indices**: en campos de busqueda frecuente (serial, status, fechas)

---

## 5. Seguridad en Detalle

### 5.1 Autenticacion (como inicia sesion)

```
Usuario → formulario login → POST /api/auth/login
                               ↓
                        Servidor valida con bcrypt
                               ↓
                        Genera JWT (JSON Web Token)
                        Contiene: id de usuario, rol, iat, exp
                               ↓
                        Guarda en cookie: sati_session
                        HttpOnly (no accesible desde JS)
                        Secure (solo HTTPS)
                        SameSite=Strict (no enviada desde otros sitios)
```

### 5.2 Cada peticion

```
Navegador envia automaticamente la cookie sati_session
       ↓
Middleware verifyToken:
  1. Extrae token de cookie o header Authorization
  2. Verifica firma con JWT_SECRET
  3. Verifica que no este en blacklist (logout)
  4. Verifica tiempo absoluto (max 12h desde creacion)
  5. Carga usuario desde BD (verifica que siga activo)
       ↓
Middleware requireWriteAccess (para crear/editar):
   - Solo ADMIN y TI pueden escribir
   - PERSONAL solo lectura
       ↓
Middleware CSRF:
   - Toda mutacion (POST, PUT, DELETE) requiere header X-Requested-With
   - Navegadores no permiten enviar este header desde otro origen
       ↓
Zod validation:
   - Los datos de entrada se validan contra un esquema definido
   - Tipos, longitudes, formatos, rangos
       ↓
SQL parametrizado:
   - INSERT, UPDATE, SELECT con $1, $2, ...
   - Nunca se concatenan valores en SQL
```

### 5.3 Headers de seguridad (Helmet)
Todas las respuestas HTTP incluyen:
- **CSP**: solo scripts de self y JsBarcode CDN, no objetos externos, no frames
- **HSTS**: obliga HTTPS por 1 ano
- **X-Frame-Options: DENY**: no se puede embeker en iframes
- **Permissions-Policy**: camara, microfono, GPS deshabilitados

### 5.4 Rate Limiting
| Limite | Valor |
|--------|-------|
| Peticiones globales | 300 por 15 minutos |
| Intentos de login | 12 por 15 minutos |
| Escritura (crear/editar) | 100 por 15 minutos |

### 5.5 UUID validation
Todos los endpoints que reciben un `:id` en la URL validan que sea un UUID valido antes de consultar la base de datos. Esto previene inyeccion de caracteres especiales en la URL.

---

## 6. Como usar el sistema

### Acceso
1. Abrir `https://sati-timsa-zeta.vercel.app`
2. Ingresar credenciales (usuario y contrasena)
3. El sistema recuerda la sesion con la cookie

### Navegacion
El menu lateral contiene los modulos. Al hacer clic en cada uno se carga la vista correspondiente.

### Crear un activo
1. Ir a Inventario
2. Clic en "+ Nuevo activo"
3. Seleccionar tipo, marca, modelo, ubicacion, area
4. Ingresar numero de serie, ID inventario, usuario, etc.
5. Clic en "Guardar"

### Crear un accesorio
1. Ir a Inventario de accesorios (desde el menu)
2. Clic en "+ Nuevo accesorio"
3. Seleccionar tipo (ej. Teclado), marca, modelo
4. La cantidad se muestra automaticamente, los campos de activo se ocultan
5. Clic en "Guardar"

### Imprimir etiqueta
1. Abrir un equipo en el inventario
2. En el perfil, ir a la seccion "Etiqueta del activo"
3. Opciones disponibles:
   - **Imprimir etiqueta** — abre ventana de impresion del navegador (formato HTML+CSS)
   - **Descargar ZPL** — descarga archivo `.zpl` para impresoras Zebra
   - **Imprimir en Zebra** — envia el ZPL directamente a la impresora via TCP (puerto 9100)
4. Para impresion Zebra, asegurar que la IP este configurada en Ajustes

### Exportar inventario
1. En la vista de inventario, usar los filtros deseados
2. Clic en "Exportar PDF" o "Exportar CSV"
3. El archivo se descarga automaticamente

---

## 7. Despliegue

### En Vercel (produccion)
Cada vez que se hace push a `main`, Vercel despliega automaticamente.

Para forzar despliegue manual:
```bash
vercel --prod --yes
```

### Variables de entorno necesarias
```
DATABASE_URL=postgresql://...
JWT_SECRET=clave_segura_de_32_caracteres
APP_URL=https://sitioweb.com
PGSSLMODE=require
```

---

## 8. Resumen de cambios recientes

| Fecha | Cambio |
|-------|--------|
| Junio 2026 | Reemplazo QR por codigo de barras CODE128 con JsBarcode |
| Junio 2026 | Eliminacion completa de carga de imagenes (storageService, multer, etc.) |
| Junio 2026 | Mejora de seguridad: validacion UUID en endpoints |
| Junio 2026 | Correccion: accesorios ahora guardan correctamente |

---

## 9. Preguntas frecuentes

**Por que no usar React o Vue?**
El sistema es intencionalmente simple: HTML + CSS + JS vanilla. Esto significa:
- Sin dependencias pesadas
- Carga inicial mas rapida
- Mas facil de mantener a largo plazo
- Sin necesidad de compilar para desarrollo

**Donde se almacenan los datos?**
En PostgreSQL de Supabase (plan gratuito). Los datos viajan cifrados con SSL/TLS.

**Que pasa si el servidor se cae?**
Vercel maneja la alta disponibilidad. Si la base de datos se desconecta, el sistema muestra un mensaje de error claro y no permite operaciones.

**Cuantos usuarios pueden usar el sistema al mismo tiempo?**
PostgreSQL maneja multiples conexiones concurrentes. El pool esta configurado segun el plan de Supabase.
