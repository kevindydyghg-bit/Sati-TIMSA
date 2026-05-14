const state = {
  token: null,
  user: null,
  lookups: null,
  items: [],
  inventoryMeta: { page: 1, limit: 25, total: 0, total_pages: 1 },
  dashboard: null,
  maintenance: [],
  stock: [],
  stockSummary: { total: 0, available: 0 },
  stockAvailability: [],
  audit: [],
  users: [],
  equipmentProfile: null,
  hardwareGroup: null,
  inventoryScope: 'all',
  notes: JSON.parse(localStorage.getItem('sati_notes') || '[]')
};

const $ = (selector) => document.querySelector(selector);
const loginView = $('#loginView');
const dashboardView = $('#dashboardView');
const inventoryBody = $('#inventoryBody');
const equipmentDialog = $('#equipmentDialog');
const equipmentForm = $('#equipmentForm');
const equipmentPreview = $('#equipmentPreview');
const userDialog = $('#userDialog');
const userForm = $('#userForm');
const passwordDialog = $('#passwordDialog');
const passwordForm = $('#passwordForm');
const catalogDialog = $('#catalogDialog');
const catalogForm = $('#catalogForm');
const catalogFields = $('#catalogFields');
const maintenanceDialog = $('#maintenanceDialog');
const maintenanceForm = $('#maintenanceForm');
const stockDialog = $('#stockDialog');
const stockForm = $('#stockForm');
const notificationPanel = $('#notificationPanel');
const noteForm = $('#noteForm');
const menuButton = $('#menuButton');
const sidebarCollapseButton = $('#sidebarCollapseButton');
const liveServerPorts = ['5500', '5501', '5502'];
const isGitHubPages = window.location.hostname.endsWith('github.io');
const isDemoMode = window.location.protocol === 'file:' || liveServerPorts.includes(window.location.port) || isGitHubPages;
let hoverDetailTimer = null;
let hoverHideTimer = null;
let hoverPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let catalogSource = 'equipment';
const accessoryTypes = [
  'monitor',
  'impresora',
  'telefono',
  'radio',
  'teclado',
  'camara',
  'mouse',
  'mouses',
  'mause',
  'mauses',
  'maues',
  'maueses',
  'maus',
  'webcam',
  'handheld',
  'router',
  'switch',
  'audifono',
  'audifonos',
  'auricular',
  'auriculares',
  'diadema',
  'headset',
  'headphones',
  'microfono',
  'bocina',
  'scanner',
  'escaner',
  'lector',
  'cable',
  'cargador',
  'adaptador',
  'dock',
  'docking',
  'hub',
  'ups',
  'nobreak',
  'no-break'
];

document.body.appendChild(equipmentPreview);

localStorage.removeItem('sati_token');
localStorage.removeItem('sati_user');
sessionStorage.removeItem('sati_token');
sessionStorage.removeItem('sati_user');

const timsaLocations = [
  'Administracion de Riesgos',
  'Almacen de Refacciones',
  'Almacen de Previos',
  'CCTV',
  'Centro de Operaciones Previos',
  'Comercializacion',
  'Compras y Servicios',
  'Contabilidad',
  'Container',
  'Control Aduanero',
  'Control Tower',
  'Costs',
  'Facturacion',
  'Ferrocarril y Refrigerados',
  'Gerencia General',
  'Horizon',
  'Ingenieria y Desarrollo',
  'Mantenimiento',
  'Operaciones',
  'Patio de Vacios',
  'Planeacion Financiera',
  'Proteccion',
  'Puerta de Entrada',
  'Puerta de Salida',
  'RRHH',
  'RFE',
  'Salud Ocupacional y Seguridad',
  'Servicios',
  'Sistema Integrado de Gestion',
  'Subgerencia de Sistemas',
  'Terminal CFS'
];

const demoLookups = {
  types: [
    { id: 1, name: 'Laptop' },
    { id: 2, name: 'Desktop' },
    { id: 3, name: 'Monitor' },
    { id: 4, name: 'Impresora' },
    { id: 5, name: 'Telefono' },
    { id: 6, name: 'Radio' },
    { id: 7, name: 'Teclado' },
    { id: 8, name: 'Camara' },
    { id: 9, name: 'Mouse' },
    { id: 10, name: 'Webcam' }
  ],
  brands: [
    { id: 1, name: 'Dell' },
    { id: 2, name: 'HP' },
    { id: 3, name: 'Lenovo' },
    { id: 4, name: 'Microsoft' },
    { id: 5, name: 'Zebra' },
    { id: 6, name: 'Logitech' },
    { id: 7, name: 'Hikvision' }
  ],
  models: [
    { id: 1, brand_id: 1, name: 'Latitude 5440' },
    { id: 2, brand_id: 1, name: 'OptiPlex 7090' },
    { id: 3, brand_id: 2, name: 'EliteBook 840 G8' },
    { id: 4, brand_id: 3, name: 'ThinkPad T14' },
    { id: 5, brand_id: 4, name: 'Surface Laptop 4' },
    { id: 6, brand_id: 5, name: 'TC21' },
    { id: 7, brand_id: 6, name: 'M185' },
    { id: 8, brand_id: 6, name: 'C920' },
    { id: 9, brand_id: 7, name: 'DS-2CD1023G0' }
  ],
  locations: timsaLocations.map((name, index) => ({ id: index + 1, name, address: 'Demo TIMSA' })),
  areas: []
};

demoLookups.areas = demoLookups.locations.map((location) => ({
  id: location.id,
  location_id: location.id,
  name: 'General'
}));

let demoItems = [
  ['5CD1234ABC', 'jlopez', 'Operaciones', 'Dell', 'Latitude 5440', 'Laptop', 'activo'],
  ['8CG2345DEF', 'mruiz', 'Administracion de Riesgos', 'HP', 'EliteBook 840 G8', 'Laptop', 'activo'],
  ['9FT3456GHI', 'cgarcia', 'Terminal CFS', 'Lenovo', 'ThinkPad T14', 'Laptop', 'mantenimiento'],
  ['3HY4567JKL', 'arojas', 'Control Tower', 'Dell', 'OptiPlex 7090', 'Desktop', 'activo'],
  ['1TU8901VWX', 'flopez', 'Gerencia General', 'Microsoft', 'Surface Laptop 4', 'Laptop', 'activo'],
  ['2MN6789PQR', 'lmartinez', 'Almacen de Refacciones', 'Dell', 'Latitude 5440', 'Laptop', 'resguardo'],
  ['7KL5678MNO', 'dhernandez', 'Contabilidad', 'HP', 'EliteBook 840 G8', 'Laptop', 'activo'],
  ['6PR7890STU', 'vsanchez', 'Puerta de Entrada', 'Dell', 'OptiPlex 7090', 'Desktop', 'activo'],
  ['CAM2026051201', 'cctv', 'CCTV', 'Hikvision', 'DS-2CD1023G0', 'Camara', 'activo'],
  ['MOU2026051201', 'agarcia', 'Compras y Servicios', 'Logitech', 'M185', 'Mouse', 'activo'],
  ['WEB2026051201', 'rrhh', 'RRHH', 'Logitech', 'C920', 'Webcam', 'resguardo']
].map(([serial_number, assigned_user, location, brand, model, equipment_type, status], index) => ({
  id: `demo-${index + 1}`,
  serial_number,
  asset_tag: `TIMSA-DEMO-${String(index + 1).padStart(3, '0')}`,
  assigned_user,
  location,
  area: 'General',
  brand,
  model,
  equipment_type,
  status,
  notes: 'Registro demo para Live Server.',
  updated_at: new Date(Date.now() - index * 3600000).toISOString()
}));

let demoMaintenance = [
  {
    id: 'maintenance-demo-1',
    equipment_id: demoItems[2].id,
    phase: 'en_proceso',
    notes: 'Revision preventiva y diagnostico de lentitud. Pendiente cambio de SSD.',
    sent_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    serial_number: demoItems[2].serial_number,
    asset_tag: demoItems[2].asset_tag,
    assigned_user: demoItems[2].assigned_user,
    equipment_type: demoItems[2].equipment_type,
    brand: demoItems[2].brand,
    model: demoItems[2].model,
    location: demoItems[2].location,
    area: demoItems[2].area,
    created_by_name: 'Administrador Demo',
    updated_by_name: 'Administrador Demo'
  }
];

let demoStock = [
  {
    id: 'stock-demo-1',
    item_code: 'STOCK-LAP-001',
    name: 'Laptop',
    model: 'Latitude 5440',
    serial_number: 'STOCK-LAP-001',
    quantity: 2,
    status: 'disponible',
    notes: 'Equipo listo para asignacion.',
    location_id: 1,
    location: demoLookups.locations[0].name,
    area_id: 1,
    area: 'General',
    updated_at: new Date().toISOString()
  }
];

async function api(path, options = {}) {
  if (isDemoMode) {
    return demoApi(path, options);
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Solicitud fallida.');
  }
  return payload;
}

async function demoApi(path, options = {}) {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const method = options.method || 'GET';

  if (path === '/auth/login' && method === 'POST') {
    return {
      token: 'demo-token',
      user: {
        id: 'demo-admin',
        name: 'Administrador Demo',
        username: 'admin',
        email: 'demo@sati-timsa.local',
        role: 'ADMIN'
      }
    };
  }

  if (path === '/auth/password-reset/request') {
    return { message: 'Codigo demo generado.', devCode: '123456' };
  }

  if (path === '/auth/password-reset/confirm') {
    return { message: 'Contrasena demo actualizada.' };
  }

  if (path === '/lookups') {
    return demoLookups;
  }

  if (path === '/dashboard') {
    return {
      totals: { total: demoItems.length, active: demoItems.filter((item) => item.status === 'activo').length, maintenance: demoItems.filter((item) => item.status === 'mantenimiento').length, inactive: demoItems.filter((item) => ['baja', 'resguardo'].includes(item.status)).length, with_images: demoItems.filter((item) => item.image_path).length },
      by_status: [],
      by_location: timsaLocations.slice(0, 5).map((name, index) => ({ location: name, total: index + 1 })),
      by_type: [],
      warranty: { expired: 0, next_30: 1, next_90: 3 },
      recent_changes: [{ event_type: 'DEMO', serial_number: '5CD1234ABC', username: 'admin', created_at: new Date().toISOString() }],
      maintenance: []
    };
  }

  if (path === '/lookups/types' && method === 'POST') {
    const data = JSON.parse(options.body || '{}');
    const nextId = Math.max(0, ...demoLookups.types.map((item) => Number(item.id))) + 1;
    const type = {
      id: nextId,
      name: data.name
    };
    demoLookups.types.push(type);
    return { type };
  }

  if (path === '/lookups/brands' && method === 'POST') {
    const data = JSON.parse(options.body || '{}');
    const nextId = Math.max(0, ...demoLookups.brands.map((item) => Number(item.id))) + 1;
    const brand = {
      id: nextId,
      name: data.name
    };
    demoLookups.brands.push(brand);
    return { brand };
  }

  if (path === '/lookups/models' && method === 'POST') {
    const data = JSON.parse(options.body || '{}');
    const nextId = Math.max(0, ...demoLookups.models.map((item) => Number(item.id))) + 1;
    const model = {
      id: nextId,
      brand_id: Number(data.brand_id),
      name: data.name
    };
    demoLookups.models.push(model);
    return { model };
  }

  if (path === '/lookups/locations' && method === 'POST') {
    const data = JSON.parse(options.body || '{}');
    const locationId = Math.max(0, ...demoLookups.locations.map((item) => Number(item.id))) + 1;
    const areaId = Math.max(0, ...demoLookups.areas.map((item) => Number(item.id))) + 1;
    const location = {
      id: locationId,
      name: data.name,
      address: data.address || 'Demo TIMSA'
    };
    const area = {
      id: areaId,
      location_id: locationId,
      name: data.area_name || 'General'
    };
    demoLookups.locations.push(location);
    demoLookups.areas.push(area);
    return { location, area };
  }

  if (path === '/lookups/areas' && method === 'POST') {
    const data = JSON.parse(options.body || '{}');
    const areaId = Math.max(0, ...demoLookups.areas.map((item) => Number(item.id))) + 1;
    const area = {
      id: areaId,
      location_id: Number(data.location_id),
      name: data.name
    };
    demoLookups.areas.push(area);
    return { area };
  }

  if (path.startsWith('/equipment') && method === 'GET') {
    const detailMatch = path.match(/^\/equipment\/([^/?]+)$/);
    if (detailMatch) {
      const item = demoItems.find((entry) => String(entry.id) === detailMatch[1]);
      return {
        item,
        history: [{ id: 1, event_type: 'DEMO', changed_by: 'Demo', created_at: new Date().toISOString() }],
        maintenance: demoMaintenance.filter((entry) => entry.equipment_id === item?.id),
        audit: [],
        qr_url: window.location.href,
        qr_data_url: ''
      };
    }
    const params = new URLSearchParams(path.split('?')[1] || '');
    const search = decodeURIComponent(params.get('search') || '').toLowerCase();
    const typeId = params.get('type_id');
    const status = params.get('status');
    const scope = params.get('scope');
    const page = Math.max(Number(params.get('page') || 1), 1);
    const limit = Math.min(Math.max(Number(params.get('limit') || 25), 1), 100);
    const selectedType = demoLookups.types.find((item) => String(item.id) === String(typeId))?.name;
    const items = demoItems.filter((item) => {
      const matchesSearch = !search || Object.values(item).join(' ').toLowerCase().includes(search);
      const matchesType = !selectedType || item.equipment_type === selectedType;
      const matchesStatus = !status || item.status === status;
      const matchesScope = !scope || scope === 'all' || (scope === 'accessories' ? isAccessoryItem(item) : !isAccessoryItem(item));
      return matchesSearch && matchesType && matchesStatus && matchesScope;
    });
    const offset = (page - 1) * limit;
    const pagedItems = items.slice(offset, offset + limit);
    return {
      items: pagedItems,
      meta: {
        page,
        limit,
        total: items.length,
        total_pages: Math.max(Math.ceil(items.length / limit), 1)
      }
    };
  }

  if (path === '/equipment' && method === 'POST') {
    const data = JSON.parse(options.body || '{}');
    const type = demoLookups.types.find((item) => String(item.id) === String(data.equipment_type_id));
    const brand = demoLookups.brands.find((item) => String(item.id) === String(data.brand_id));
    const model = demoLookups.models.find((item) => String(item.id) === String(data.model_id));
    const location = demoLookups.locations.find((item) => String(item.id) === String(data.location_id));
    const area = demoLookups.areas.find((item) => String(item.id) === String(data.area_id));
    demoItems.unshift({
      id: `demo-${Date.now()}`,
      serial_number: data.serial_number,
      asset_tag: data.asset_tag,
      assigned_user: data.assigned_user,
      status: data.status,
      notes: data.notes,
      equipment_type: type?.name || 'Equipo',
      brand: brand?.name || 'Marca',
      model: model?.name || 'Modelo',
      location: location?.name || 'Ubicacion',
      area: area?.name || 'General',
      updated_at: new Date().toISOString()
    });
    return { item: demoItems[0] };
  }

  if (path.startsWith('/equipment/') && method === 'PUT') {
    return { item: {} };
  }

  if (path.startsWith('/equipment/') && method === 'DELETE') {
    demoItems = demoItems.filter((item) => item.id !== path.split('/').pop());
    return null;
  }

  if (path === '/maintenance' && method === 'GET') {
    return { items: demoMaintenance };
  }

  if (path === '/maintenance' && method === 'POST') {
    const data = JSON.parse(options.body || '{}');
    const equipment = demoItems.find((item) => item.id === data.equipment_id);
    const item = {
      id: `maintenance-demo-${Date.now()}`,
      equipment_id: data.equipment_id,
      phase: data.phase,
      notes: data.notes,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      serial_number: equipment?.serial_number || 'Sin serie',
      asset_tag: equipment?.asset_tag || '',
      assigned_user: equipment?.assigned_user || '',
      equipment_type: equipment?.equipment_type || 'Equipo',
      brand: equipment?.brand || 'Marca',
      model: equipment?.model || 'Modelo',
      location: equipment?.location || 'Ubicacion',
      area: equipment?.area || 'General',
      created_by_name: state.user?.name || 'Demo',
      updated_by_name: state.user?.name || 'Demo'
    };
    demoMaintenance.unshift(item);
    return { item };
  }

  if (path.startsWith('/maintenance/') && method === 'PUT') {
    const id = path.split('/').pop();
    const data = JSON.parse(options.body || '{}');
    demoMaintenance = demoMaintenance.map((item) => item.id === id
      ? { ...item, phase: data.phase, notes: data.notes, updated_at: new Date().toISOString(), updated_by_name: state.user?.name || 'Demo' }
      : item);
    return { item: demoMaintenance.find((item) => item.id === id) };
  }

  if (path.startsWith('/stock') && method === 'GET') {
    const params = new URLSearchParams(path.split('?')[1] || '');
    const locationId = params.get('location_id');
    const areaId = params.get('area_id');
    const search = decodeURIComponent(params.get('search') || '').toLowerCase();
    const items = demoStock.filter((item) => {
      const matchesLocation = !locationId || String(item.location_id) === String(locationId);
      const matchesArea = !areaId || String(item.area_id) === String(areaId);
      const matchesSearch = !search || Object.values(item).join(' ').toLowerCase().includes(search);
      return matchesLocation && matchesArea && matchesSearch;
    });
    return {
      items,
      summary: {
        total: items.length,
        available: items.reduce((total, item) => total + Number(item.quantity || 0), 0)
      },
      availability: [...items.reduce((map, item) => {
        const key = `${item.location_id}-${item.area_id}`;
        const current = map.get(key) || {
          location_id: item.location_id,
          location: item.location,
          area_id: item.area_id,
          area: item.area,
          total: 0,
        available: 0
      };
        current.total += Number(item.quantity || 0);
        current.available += Number(item.quantity || 0);
        map.set(key, current);
        return map;
      }, new Map()).values()].sort((a, b) => a.available - b.available || a.total - b.total || a.location.localeCompare(b.location, 'es'))
    };
  }

  if (path === '/stock' && method === 'POST') {
    const data = JSON.parse(options.body || '{}');
    const location = demoLookups.locations.find((item) => String(item.id) === String(data.location_id));
    const area = demoLookups.areas.find((item) => String(item.id) === String(data.area_id));
    const item = {
      id: `stock-demo-${Date.now()}`,
      ...data,
      location_id: Number(data.location_id),
      area_id: Number(data.area_id),
      location: location?.name || 'Ubicacion',
      area: area?.name || 'General',
      updated_at: new Date().toISOString()
    };
    demoStock.unshift(item);
    return { item };
  }

  if (path.startsWith('/stock/') && method === 'PUT') {
    const id = path.split('/').pop();
    const data = JSON.parse(options.body || '{}');
    const location = demoLookups.locations.find((item) => String(item.id) === String(data.location_id));
    const area = demoLookups.areas.find((item) => String(item.id) === String(data.area_id));
    demoStock = demoStock.map((item) => item.id === id
      ? {
        ...item,
        ...data,
        location_id: Number(data.location_id),
        area_id: Number(data.area_id),
        location: location?.name || item.location,
        area: area?.name || item.area,
        updated_at: new Date().toISOString()
      }
      : item);
    return { item: demoStock.find((item) => item.id === id) };
  }

  if (path === '/users' && method === 'POST') {
    return { user: JSON.parse(options.body || '{}') };
  }

  if (path === '/users' && method === 'GET') {
    return { users: [{ id: 'demo-admin', name: 'Administrador Demo', username: 'admin', role: 'ADMIN', is_active: true, failed_login_attempts: 0, last_login_at: new Date().toISOString() }] };
  }

  if (path.startsWith('/users/') && ['PATCH', 'POST'].includes(method)) {
    return { message: 'Usuario demo actualizado.' };
  }

  if (path === '/auth/password' && method === 'POST') {
    return { message: 'Contrasena demo actualizada.' };
  }

  if (path.startsWith('/audit') && method === 'GET') {
    return {
      items: [
        { id: 1, action: 'LOGIN', entity: 'auth', entity_id: 'demo', username: state.user?.username || 'demo', created_at: new Date().toISOString(), metadata: { mode: 'demo' } }
      ],
      meta: { page: 1, limit: 50, total: 1, total_pages: 1 }
    };
  }

  return {};
}

function showDashboard() {
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  dashboardView.classList.remove('screen-enter');
  void dashboardView.offsetWidth;
  dashboardView.classList.add('screen-enter');
  $('#userPill').textContent = state.user.name || 'Administrador';
  const canWrite = ['ADMIN', 'TI'].includes(state.user.role);
  $('#newEquipmentButton').style.display = canWrite ? 'inline-flex' : 'none';
  $('#newMaintenanceButton').style.display = canWrite ? 'inline-flex' : 'none';
  $('#newStockButton').style.display = canWrite ? 'inline-flex' : 'none';
  $('#downloadTemplateButton').style.display = canWrite ? 'inline-flex' : 'none';
  $('#importCsvButton').style.display = canWrite ? 'inline-flex' : 'none';
  $('#newUserButton').classList.toggle('hidden', state.user.role !== 'ADMIN');
  applySidebarState();
  renderNotifications();
  setView('inventory');
}

function applySidebarState() {
  const collapsed = localStorage.getItem('sati_sidebar_collapsed') === 'true';
  dashboardView.classList.toggle('sidebar-collapsed', collapsed);
  menuButton.setAttribute('aria-expanded', String(!collapsed));
  menuButton.setAttribute('aria-label', collapsed ? 'Expandir menu' : 'Contraer menu');
  sidebarCollapseButton.setAttribute('aria-label', collapsed ? 'Expandir' : 'Contraer');
}

function toggleSidebar() {
  const collapsed = !dashboardView.classList.contains('sidebar-collapsed');
  dashboardView.classList.toggle('sidebar-collapsed', collapsed);
  localStorage.setItem('sati_sidebar_collapsed', String(collapsed));
  applySidebarState();
}

function setView(view) {
  const views = {
    inventory: ['Consola de inventario', 'Resumen general del inventario de hardware'],
    hardware: ['Inventario de hardware', 'Vista ejecutiva de activos por categoria'],
    equipment: ['Inventario de equipos', 'Clasificacion por tipo de producto'],
    accessories: ['Inventario de accesorios', 'Perifericos y accesorios asignados o en resguardo'],
    maintenance: ['Equipos en mantenimiento', 'Seguimiento por fases de revision, proceso y termino'],
    stock: ['Stock de almacenamiento', 'Disponibilidad por ubicacion y area'],
    audit: ['Auditoria', 'Eventos recientes y controles del sistema'],
    cloud: ['Servicios cloud', 'Servicios conectados al sistema SATI-TIMSA']
  };

  if (view === 'accessories') state.inventoryScope = 'accessories';
  if (view === 'equipment') state.inventoryScope = 'equipment';
  if (view === 'inventory') state.inventoryScope = 'all';

  const selected = views[view] || views.inventory;
  $('#viewTitle').textContent = selected[0];
  $('#viewSubtitle').textContent = selected[1];
  $('#backButton').classList.toggle('hidden', view === 'inventory');
  $('#newEquipmentButton').innerHTML = `<span class="button-icon">+</span>${view === 'accessories' ? 'Nuevo accesorio' : 'Nuevo equipo'}`;
  const totalMetricLabel = $('#metricsView article:first-child small');
  if (totalMetricLabel) {
    totalMetricLabel.textContent = view === 'accessories' ? 'Accesorios registrados' : 'Equipos registrados';
  }

  $('#metricsView').classList.toggle('hidden', view === 'audit' || view === 'cloud' || view === 'stock');
  $('#dashboardInsights').classList.toggle('hidden', view === 'audit' || view === 'cloud' || view === 'stock');
  activatePanel('inventoryView', view === 'inventory' || view === 'accessories');
  activatePanel('hardwareView', view === 'hardware');
  activatePanel('equipmentView', view === 'equipment');
  activatePanel('maintenanceView', view === 'maintenance');
  activatePanel('stockView', view === 'stock');
  activatePanel('auditView', view === 'audit');
  activatePanel('cloudView', view === 'cloud');
  hideHoverDetails();

  document.querySelectorAll('nav a[data-view]').forEach((link) => {
    link.classList.toggle('active', link.dataset.view === view);
  });

  syncTypeFilterOptions();
  if (view === 'equipment') renderEquipmentTypeList();
  if (view === 'maintenance') {
    renderMaintenanceView();
    loadMaintenance();
  }
  if (view === 'stock') {
    prepareStockFilters();
    loadStock();
  }
  if (view === 'audit') {
    renderAuditView();
    loadAudit();
  }
}

function activatePanel(id, active) {
  const panel = $(`#${id}`);
  panel.classList.toggle('hidden', !active);
  if (!active) return;
  panel.classList.remove('view-panel--enter');
  void panel.offsetWidth;
  panel.classList.add('view-panel--enter');
}

function showLogin() {
  loginView.classList.remove('hidden');
  dashboardView.classList.add('hidden');
  closeOpenDialogs();
  loginView.classList.remove('screen-enter');
  void loginView.offsetWidth;
  loginView.classList.add('screen-enter');
  $('#demoBanner').classList.toggle('hidden', !isDemoMode);
  const rememberedUsername = localStorage.getItem('sati_remember_username') || '';
  if (rememberedUsername && !$('#loginForm').elements.username.value) {
    $('#loginForm').elements.username.value = rememberedUsername;
    $('#loginForm').elements.remember_username.checked = true;
  }
}

function closeOpenDialogs() {
  document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
}

function defaultReminderDate() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function saveNotes() {
  localStorage.setItem('sati_notes', JSON.stringify(state.notes));
}

function renderNotifications() {
  const list = $('#notificationList');
  const count = $('#notificationCount');
  if (!list || !count) return;

  const sortedNotes = [...state.notes].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  count.textContent = sortedNotes.length;
  count.classList.toggle('hidden', sortedNotes.length === 0);

  list.innerHTML = sortedNotes.map((note) => `
    <article class="notification-item">
      <div>
        <strong>${note.text}</strong>
        <span>${formatDate(note.dueAt)}</span>
      </div>
      <footer>
        <span>Agregado por ${note.userName}</span>
        <button class="ghost note-delete" type="button" data-note-delete="${note.id}">Eliminar</button>
      </footer>
    </article>
  `).join('') || '<p class="empty-module">Sin notas pendientes.</p>';
}

function openNotifications() {
  noteForm.elements.due_at.value = defaultReminderDate();
  notificationPanel.classList.remove('hidden');
  $('#notificationButton').setAttribute('aria-expanded', 'true');
  renderNotifications();
}

function closeNotifications() {
  notificationPanel.classList.add('hidden');
  $('#notificationButton').setAttribute('aria-expanded', 'false');
}

function renderMetrics() {
  const total = state.items.length;
  const active = state.items.filter((item) => item.status === 'activo').length;
  const maintenance = state.items.filter((item) => item.status === 'mantenimiento').length;
  const inactive = state.items.filter((item) => ['baja', 'resguardo'].includes(item.status)).length;
  const percentage = (value) => `${total ? Math.round((value / total) * 100) : 0}%`;

  $('#metricTotal').textContent = total;
  $('#metricActive').textContent = active;
  $('#metricMaintenance').textContent = maintenance;
  $('#metricInactive').textContent = inactive;
  $('#metricActivePct').textContent = percentage(active);
  $('#metricMaintenancePct').textContent = percentage(maintenance);
  $('#metricInactivePct').textContent = percentage(inactive);
}

function renderDashboardInsights() {
  const dashboard = state.dashboard;
  if (!dashboard) return;
  const warranty = dashboard.warranty || {};
  $('#warrantyInsights').innerHTML = `
    <div><strong>${warranty.expired || 0}</strong><span>Vencidas</span></div>
    <div><strong>${warranty.next_30 || 0}</strong><span>Proximos 30 dias</span></div>
    <div><strong>${warranty.next_90 || 0}</strong><span>Proximos 90 dias</span></div>
  `;

  const maxLocation = Math.max(1, ...(dashboard.by_location || []).map((item) => Number(item.total)));
  $('#locationInsights').innerHTML = (dashboard.by_location || []).map((item) => `
    <div class="insight-bar">
      <span>${item.location}</span>
      <strong>${item.total}</strong>
      <i data-width="${Math.max(6, Math.round((Number(item.total) / maxLocation) * 100))}"></i>
    </div>
  `).join('') || '<p class="empty-module">Sin datos por ubicacion.</p>';
  document.querySelectorAll('#locationInsights i[data-width]').forEach((bar) => {
    bar.style.width = `${bar.dataset.width}%`;
  });

  $('#recentInsights').innerHTML = (dashboard.recent_changes || []).map((item) => `
    <div><strong>${item.serial_number}</strong><span>${item.event_type} &middot; ${item.username || 'sistema'} &middot; ${formatDate(item.created_at)}</span></div>
  `).join('') || '<p class="empty-module">Sin cambios recientes.</p>';
}

function normalizeTypeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

function isAccessoryType(type) {
  return accessoryTypes.includes(normalizeTypeName(type));
}

function isAccessoryItem(item) {
  return isAccessoryType(item?.equipment_type || item?.name);
}

function visibleTypesForScope(types) {
  if (state.inventoryScope === 'accessories') {
    return types.filter((item) => isAccessoryType(item.name));
  }
  if (state.inventoryScope === 'equipment') {
    return types.filter((item) => !isAccessoryType(item.name));
  }
  return types;
}

function displayStatus(value) {
  return String(value || '').replace(/^\w/, (letter) => letter.toUpperCase());
}

function productSymbol(type) {
  const value = normalizeTypeName(type);
  if (value.includes('laptop')) return 'laptop';
  if (value.includes('desktop')) return 'desktop';
  if (value.includes('monitor')) return 'monitor';
  if (value.includes('telefono') || value.includes('phone') || value.includes('handheld')) return 'phone';
  if (value.includes('radio')) return 'radio';
  if (value.includes('camara') || value.includes('camera') || value.includes('webcam')) return 'camera';
  if (value.includes('mouse') || value.includes('mause') || value.includes('maues') || value.includes('maus')) return 'mouse';
  if (value.includes('teclado') || value.includes('keyboard')) return 'keyboard';
  if (value.includes('impresora')) return 'printer';
  if (value.includes('audifono') || value.includes('auricular') || value.includes('diadema') || value.includes('headset') || value.includes('headphone')) return 'headphones';
  if (value.includes('router')) return 'router';
  if (value.includes('switch')) return 'switch';
  if (value.includes('api')) return 'api';
  if (value.includes('db') || value.includes('postgres')) return 'database';
  if (value.includes('web') || value.includes('frontend')) return 'web';
  return 'equipment';
}

function productIcon(type, size = 'sm') {
  const symbol = productSymbol(type);
  const icons = {
    laptop: '<path d="M7 8h18v11H7z"/><path d="M4 22h24l-2 3H6z"/>',
    desktop: '<path d="M6 7h20v14H6z"/><path d="M14 24h4"/><path d="M12 27h8"/>',
    monitor: '<path d="M5 7h22v14H5z"/><path d="M16 21v5"/><path d="M11 26h10"/>',
    phone: '<path d="M11 4h10v24H11z"/><path d="M15 7h2"/><path d="M15 25h2"/>',
    radio: '<path d="M9 12h16v14H9z"/><path d="M13 9l8-5"/><path d="M13 17h8"/><circle cx="15" cy="22" r="2"/>',
    camera: '<path d="M7 10h5l2-3h5l2 3h4v14H7z"/><circle cx="16" cy="17" r="4"/><path d="M22 13h1"/>',
    mouse: '<path d="M11 4h10v24H11z"/><path d="M16 4v7"/><path d="M11 13h10"/>',
    keyboard: '<path d="M4 10h24v14H4z"/><path d="M8 14h2M13 14h2M18 14h2M23 14h2M8 19h12M23 19h2"/>',
    printer: '<path d="M9 4h14v8H9z"/><path d="M7 13h18a3 3 0 0 1 3 3v7h-5v5H9v-5H4v-7a3 3 0 0 1 3-3z"/><path d="M11 22h10"/>',
    headphones: '<path d="M7 18v-2a9 9 0 0 1 18 0v2"/><path d="M7 18h5v8H7z"/><path d="M20 18h5v8h-5z"/>',
    router: '<path d="M7 16h18v8H7z"/><path d="M11 16l-3-7M21 16l3-7"/><path d="M11 20h1M16 20h1M21 20h1"/>',
    switch: '<path d="M5 10h22v14H5z"/><path d="M9 15h3M15 15h3M21 15h3M9 20h3M15 20h3M21 20h3"/>',
    database: '<ellipse cx="16" cy="7" rx="9" ry="3"/><path d="M7 7v14c0 1.7 4 3 9 3s9-1.3 9-3V7"/><path d="M7 14c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    api: '<path d="M9 10l-5 6 5 6"/><path d="M23 10l5 6-5 6"/><path d="M19 7l-6 18"/>',
    web: '<circle cx="16" cy="16" r="11"/><path d="M5 16h22"/><path d="M16 5c3 3 4 7 4 11s-1 8-4 11"/><path d="M16 5c-3 3-4 7-4 11s1 8 4 11"/>',
    equipment: '<path d="M7 8h18v16H7z"/><path d="M12 13h8"/><path d="M12 18h5"/>'
  };

  return `
    <span class="product-icon product-icon--${size} product-icon--${symbol}" aria-hidden="true">
      <svg viewBox="0 0 32 32" focusable="false">
        ${icons[symbol] || icons.equipment}
      </svg>
    </span>
  `;
}

function equipmentMedia(item, size = 'sm') {
  if (item?.image_path) {
    return `
      <span class="equipment-photo equipment-photo--${size}">
        <img src="${item.image_path}" alt="Imagen de ${item.serial_number}">
      </span>
    `;
  }
  return productIcon(item?.equipment_type, size);
}

function uiIcon(name) {
  const icons = {
    more: '<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="3"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    shield: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-5"/>'
  };

  return `
    <span class="ui-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        ${icons[name] || icons.more}
      </svg>
    </span>
  `;
}

function renderPreview(item) {
  if (!item) {
    hideHoverDetails();
    return;
  }

  equipmentPreview.classList.remove('hidden');
  equipmentPreview.innerHTML = `
    <div class="hover-detail-header">
      <div>
        <span class="eyebrow">Detalles completos</span>
        <h3>${item.brand} ${item.model}</h3>
      </div>
      <button class="icon-button detail-close" type="button" data-close-preview aria-label="Cerrar">x</button>
    </div>
    <div class="detail-hero">
      <div class="equipment-art">${equipmentMedia(item, 'lg')}</div>
      <div class="detail-identity">
        <span class="detail-type">${item.equipment_type}</span>
        <strong>${item.serial_number}</strong>
        <span class="status ${item.status}">${displayStatus(item.status)}</span>
      </div>
    </div>
    <div class="detail-grid">
      <article>
        <span>ID del equipo</span>
        <strong>${item.asset_tag || 'Sin ID'}</strong>
      </article>
      <article>
        <span>Usuario</span>
        <strong>${item.assigned_user || 'Sin asignar'}</strong>
      </article>
      <article>
        <span>Ubicacion</span>
        <strong>${item.location}</strong>
      </article>
      <article>
        <span>Area</span>
        <strong>${item.area}</strong>
      </article>
    </div>
    <div class="detail-footer">
      <span>Actualizado ${formatDate(item.updated_at)}</span>
      <button class="ghost icon-label" type="button" data-preview-open="${item.id}">${uiIcon('eye')}Abrir ficha</button>
    </div>
  `;
}

function positionHoverDetails() {
  equipmentPreview.removeAttribute('style');
}

function showHoverDetails(item) {
  clearTimeout(hoverHideTimer);
  renderPreview(item);
  positionHoverDetails();
  equipmentPreview.classList.add('equipment-preview--visible');
}

function scheduleHoverDetails(item, event) {
  clearTimeout(hoverDetailTimer);
  clearTimeout(hoverHideTimer);
  hoverPointer = { x: event.clientX, y: event.clientY };
  hoverDetailTimer = setTimeout(() => showHoverDetails(item), 1000);
}

function hideHoverDetails(delay = 0) {
  clearTimeout(hoverDetailTimer);
  clearTimeout(hoverHideTimer);

  if (delay > 0) {
    hoverHideTimer = setTimeout(() => hideHoverDetails(), delay);
    return;
  }

  equipmentPreview.classList.remove('equipment-preview--visible');
  hoverHideTimer = setTimeout(() => {
    if (!equipmentPreview.classList.contains('equipment-preview--visible')) {
      equipmentPreview.classList.add('hidden');
      equipmentPreview.innerHTML = '';
      equipmentPreview.removeAttribute('style');
    }
  }, 160);
}

function renderInventory() {
  inventoryBody.innerHTML = '';
  $('#emptyState').classList.toggle('hidden', state.items.length > 0);
  const meta = state.inventoryMeta || { page: 1, limit: 25, total: state.items.length, total_pages: 1 };
  const first = meta.total === 0 ? 0 : ((meta.page - 1) * meta.limit) + 1;
  const last = Math.min(meta.page * meta.limit, meta.total);
  $('#resultCount').textContent = `Mostrando ${first}-${last} de ${meta.total} resultados`;
  $('#pageIndicator').textContent = `Pagina ${meta.page} de ${meta.total_pages}`;
  $('#prevPageButton').disabled = meta.page <= 1;
  $('#nextPageButton').disabled = meta.page >= meta.total_pages;

  state.items.forEach((item, index) => {
    const row = document.createElement('tr');
    row.dataset.itemId = item.id;
    row.classList.add('inventory-row');
    row.classList.add(`inventory-row-delay-${Math.min(index, 15)}`);
    row.innerHTML = `
      <td data-label="Serie" data-hover-detail>
        <div class="device-cell">
          ${equipmentMedia(item)}
          <strong>${item.serial_number}</strong>
        </div>
      </td>
      <td data-label="Usuario">${item.assigned_user || 'Sin asignar'}</td>
      <td data-label="Ubicacion">${item.location}</td>
      <td data-label="Modelo">${item.brand} ${item.model}</td>
      <td data-label="Tipo">${item.equipment_type}</td>
      <td data-label="Estado"><span class="status ${item.status}">${displayStatus(item.status)}</span></td>
      <td data-label="Ultimo reporte">${formatDate(item.updated_at)}</td>
      <td data-label="Accion"><button class="ghost row-action" data-edit="${item.id}" aria-label="Ver detalle">${uiIcon('more')}</button></td>
    `;
    inventoryBody.appendChild(row);
  });

  hideHoverDetails();
  renderEquipmentTypeList();
  renderAuditView();
}

function renderEquipmentTypeList() {
  const container = $('#equipmentTypeList');
  if (!container) return;
  const totals = state.items.filter((item) => !isAccessoryItem(item)).reduce((acc, item) => {
    acc[item.equipment_type] = (acc[item.equipment_type] || 0) + 1;
    return acc;
  }, {});

  container.innerHTML = Object.entries(totals)
    .map(([type, total]) => `
      <article>
        ${productIcon(type, 'md')}
        <div>
          <strong>${type}</strong>
          <p>${total} equipos registrados</p>
        </div>
      </article>
    `)
    .join('') || '<p class="empty-module">Sin equipos para clasificar.</p>';
}

function renderAuditView() {
  const body = $('#auditBody');
  if (!body) return;
  body.innerHTML = state.audit.map((event) => `
    <tr>
      <td><span class="audit-event">${uiIcon('shield')}${event.action}</span></td>
      <td>${event.entity} ${event.entity_id || ''}<br><small>${event.username || event.user_name || 'Sistema'} &middot; ${formatDate(event.created_at)}</small></td>
      <td><span class="status activo">OK</span></td>
    </tr>
  `).join('') || '<tr><td colspan="3">Sin eventos de auditoria.</td></tr>';
  $('#auditResultCount').textContent = `Mostrando ${state.audit.length} eventos`;
}

function phasePercent(phase) {
  return { revisado: 33, en_proceso: 66, terminado: 100 }[phase] || 0;
}

function phaseLabel(phase) {
  return {
    revisado: 'Revisado',
    en_proceso: 'En proceso',
    terminado: 'Terminado'
  }[phase] || phase;
}

function renderMaintenanceView() {
  const summary = $('#maintenanceSummary');
  const list = $('#maintenanceList');
  if (!summary || !list) return;

  const counts = {
    revisado: state.maintenance.filter((item) => item.phase === 'revisado').length,
    en_proceso: state.maintenance.filter((item) => item.phase === 'en_proceso').length,
    terminado: state.maintenance.filter((item) => item.phase === 'terminado').length
  };

  summary.innerHTML = `
    <article><span>Revisado</span><strong>${counts.revisado}</strong></article>
    <article><span>En proceso</span><strong>${counts.en_proceso}</strong></article>
    <article><span>Terminado</span><strong>${counts.terminado}</strong></article>
  `;

  list.innerHTML = state.maintenance.map((item) => {
    const percent = phasePercent(item.phase);
    const canWrite = ['ADMIN', 'TI'].includes(state.user?.role);
    return `
      <article class="maintenance-card">
        <header>
          <div>
            <span>${item.equipment_type}</span>
            <h3>${item.serial_number} · ${item.brand} ${item.model}</h3>
          </div>
          ${canWrite ? `<button class="ghost" type="button" data-maintenance-edit="${item.id}">Actualizar</button>` : ''}
        </header>
        <div class="phase-track" aria-label="Avance ${percent}%">
          <div class="phase-bar phase-${percent}"></div>
        </div>
        <div class="phase-steps">
          <span class="${percent >= 33 ? 'active' : ''}">Revisado</span>
          <span class="${percent >= 66 ? 'active' : ''}">En proceso</span>
          <span class="${percent >= 100 ? 'active' : ''}">Terminado</span>
        </div>
        <p>${item.notes || 'Sin notas registradas.'}</p>
        <footer>
          <div class="maintenance-meta">
            <span>${phaseLabel(item.phase)} · ${percent}%</span>
            <span>${item.location} / ${item.area}</span>
            <span>Actualizado ${formatDate(item.updated_at)}</span>
          </div>
        </footer>
      </article>
    `;
  }).join('') || '<p class="empty-module">Sin equipos enviados a mantenimiento.</p>';
}

function renderStockView() {
  const summary = $('#stockSummary');
  const availability = $('#stockAvailability');
  const list = $('#stockList');
  if (!summary || !availability || !list) return;
  const canWrite = ['ADMIN', 'TI'].includes(state.user?.role);
  summary.innerHTML = `
    <article><span>Registros consultados</span><strong>${state.stockSummary.total || state.stock.length}</strong></article>
    <article><span>Cantidad disponible</span><strong>${state.stockSummary.available || 0}</strong></article>
  `;
  availability.innerHTML = `
    <header>
      <div>
        <span class="eyebrow">Disponibilidad</span>
        <strong>Menor a mayor por ubicacion y area</strong>
      </div>
    </header>
    <div class="availability-grid">
      ${(state.stockAvailability || []).map((item) => `
        <article>
          <span>${item.location}</span>
          <strong>${item.available}</strong>
          <small>${item.area} / ${item.total} total</small>
        </article>
      `).join('') || '<p class="empty-module">Sin disponibilidad para esta consulta.</p>'}
    </div>
  `;
  list.innerHTML = state.stock.map((item) => `
    <article class="stock-card">
      <header>
        <div>
          <span>${item.location} / ${item.area}</span>
          <h3>${item.name}</h3>
        </div>
        <div class="stock-actions">
          <strong class="quantity-pill">${Number(item.quantity || 0)} disponibles</strong>
          ${canWrite ? `<button class="ghost" type="button" data-stock-edit="${item.id}">Modificar</button>` : ''}
        </div>
      </header>
      <div class="stock-meta">
        <div><span>ID</span><strong>${item.item_code || 'Sin ID'}</strong></div>
        <div><span>Modelo</span><strong>${item.model}</strong></div>
        <div><span>Serie</span><strong>${item.serial_number || 'Sin serie'}</strong></div>
        <div><span>Actualizado</span><strong>${formatDate(item.updated_at)}</strong></div>
      </div>
      <p>${item.notes || 'Sin notas.'}</p>
    </article>
  `).join('') || '<p class="empty-module">Sin dispositivos en stock para esta consulta.</p>';
}

async function loadLookups() {
  state.lookups = await api('/lookups');
  fillSelect('equipment_type_id', state.lookups.types);
  syncTypeFilterOptions();
  fillSelect('brand_id', state.lookups.brands);
  fillSelect('model_id', state.lookups.models);
  fillSelect('location_id', state.lookups.locations);
  if (stockForm) fillElementSelect(stockForm.elements.location_id, state.lookups.locations, 'Seleccionar');
  syncAreaOptions();
  syncStockAreaOptions();
}

function syncTypeFilterOptions() {
  if (!state.lookups) return;
  const currentValue = $('#typeFilter')?.value || '';
  const types = visibleTypesForScope(state.lookups.types);
  fillSelect('typeFilter', types, 'Todas');
  if (types.some((item) => String(item.id) === String(currentValue))) {
    $('#typeFilter').value = currentValue;
  }
}

function fillSelect(name, items, emptyLabel = 'Seleccionar') {
  const select = equipmentForm.elements[name] || stockForm?.elements[name] || $(`#${name}`);
  select.innerHTML = `<option value="">${emptyLabel}</option>`;
  for (const item of items) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  }
}

function fillElementSelect(select, items, emptyLabel = 'Todos') {
  if (!select) return;
  select.innerHTML = `<option value="">${emptyLabel}</option>`;
  for (const item of items) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  }
}

function renderAssignedUserOptions() {
  const datalist = $('#assignedUsersList');
  if (!datalist) return;
  const users = [...new Set(state.items.map((item) => item.assigned_user).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es'));
  datalist.innerHTML = users.map((user) => `<option value="${user}"></option>`).join('');
}

function syncAreaOptions() {
  if (!state.lookups) return;
  const locationId = Number(equipmentForm.elements.location_id.value);
  const areas = state.lookups.areas.filter((area) => !locationId || Number(area.location_id) === locationId);
  fillSelect('area_id', areas);
}

function syncStockAreaOptions() {
  if (!state.lookups || !stockForm) return;
  const locationId = Number(stockForm.elements.location_id.value);
  const areas = state.lookups.areas.filter((area) => !locationId || Number(area.location_id) === locationId);
  const current = stockForm.elements.area_id.value;
  fillElementSelect(stockForm.elements.area_id, areas, 'Seleccionar');
  stockForm.elements.area_id.value = current;
}

function syncStockFilterAreas() {
  if (!state.lookups) return;
  const locationId = Number($('#stockLocationFilter').value);
  const areas = state.lookups.areas.filter((area) => !locationId || Number(area.location_id) === locationId);
  fillElementSelect($('#stockAreaFilter'), areas, 'Todas');
}

function prepareStockFilters() {
  if (!state.lookups) return;
  fillElementSelect($('#stockLocationFilter'), state.lookups.locations, 'Todas');
  syncStockFilterAreas();
}

async function loadInventory() {
  const search = encodeURIComponent($('#searchInput').value.trim());
  const typeId = encodeURIComponent($('#typeFilter').value);
  const status = encodeURIComponent($('#statusFilter').value);
  const page = state.inventoryMeta.page || 1;
  const limit = Number($('#pageSizeSelect').value || state.inventoryMeta.limit || 25);
  const scope = state.inventoryScope === 'all' ? '' : `&scope=${encodeURIComponent(state.inventoryScope)}`;
  const payload = await api(`/equipment?search=${search}&type_id=${typeId}&status=${status}&page=${page}&limit=${limit}${scope}`);
  state.items = payload.items;
  state.inventoryMeta = payload.meta || { page: 1, limit, total: state.items.length, total_pages: 1 };
  renderMetrics();
  renderInventory();
  renderAssignedUserOptions();
}

async function loadDashboard() {
  state.dashboard = await api('/dashboard');
  renderDashboardInsights();
}

async function loadAudit() {
  if (!['ADMIN', 'TI'].includes(state.user?.role)) {
    state.audit = [];
    renderAuditView();
    return;
  }
  const params = new URLSearchParams({
    limit: '50',
    page: '1',
    username: $('#auditUsernameFilter')?.value.trim() || '',
    action: $('#auditActionFilter')?.value.trim() || '',
    entity: $('#auditEntityFilter')?.value.trim() || '',
    date_from: $('#auditFromFilter')?.value || '',
    date_to: $('#auditToFilter')?.value || ''
  });
  const payload = await api(`/audit?${params.toString()}`);
  state.audit = payload.items || [];
  renderAuditView();
}

async function loadMaintenance() {
  const payload = await api('/maintenance');
  state.maintenance = payload.items;
  renderMaintenanceView();
}

async function loadStock() {
  const params = new URLSearchParams({
    search: $('#stockSearchInput')?.value.trim() || '',
    location_id: $('#stockLocationFilter')?.value || '',
    area_id: $('#stockAreaFilter')?.value || ''
  });
  const payload = await api(`/stock?${params.toString()}`);
  state.stock = payload.items || [];
  state.stockSummary = payload.summary || { total: state.stock.length, available: 0 };
  state.stockAvailability = payload.availability || [];
  renderStockView();
}

async function loadEquipmentProfile(id) {
  if (!id) {
    state.equipmentProfile = null;
    $('#equipmentProfilePanel').classList.add('hidden');
    return;
  }
  const payload = await api(`/equipment/${id}`);
  state.equipmentProfile = payload;
  renderEquipmentProfile(payload);
}

function renderEquipmentProfile(profile) {
  const item = profile.item;
  $('#equipmentProfilePanel').classList.remove('hidden');
  $('#equipmentProfileBody').innerHTML = `
    <div><span>Proveedor</span><strong>${item.supplier || 'Sin proveedor'}</strong></div>
    <div><span>Compra</span><strong>${item.purchase_date ? String(item.purchase_date).slice(0, 10) : 'Sin fecha'}</strong></div>
    <div><span>Garantia</span><strong>${item.warranty_until ? String(item.warranty_until).slice(0, 10) : 'Sin garantia'}</strong></div>
    <div><span>Actualizado por</span><strong>${item.updated_by_name || 'Sistema'}</strong></div>
  `;
  $('#equipmentQrBox').innerHTML = profile.qr_data_url
    ? `<img src="${profile.qr_data_url}" alt="QR del equipo"><a href="${profile.qr_url}" target="_blank" rel="noreferrer">Abrir enlace</a>`
    : '<p class="empty-module">QR no disponible en modo demo.</p>';
  $('#equipmentHistoryList').innerHTML = (profile.history || []).map((entry) => `
    <div><strong>${entry.event_type}</strong><span>${entry.changed_by || 'Sistema'} &middot; ${formatDate(entry.created_at)}</span></div>
  `).join('') || '<p class="empty-module">Sin historial.</p>';
  $('#equipmentMaintenanceList').innerHTML = (profile.maintenance || []).map((entry) => `
    <div><strong>${phaseLabel(entry.phase)}</strong><span>${formatDate(entry.updated_at)} &middot; ${entry.notes || 'Sin notas'}</span></div>
  `).join('') || '<p class="empty-module">Sin mantenimiento.</p>';
}

async function openHardwareGroup(group) {
  state.hardwareGroup = group;
  state.inventoryMeta.page = 1;
  $('#searchInput').value = '';
  $('#statusFilter').value = '';

  const typeByGroup = {
    laptop: 'Laptop',
    desktop: 'Desktop'
  };
  const typeName = typeByGroup[group];
  const type = typeName ? state.lookups.types.find((item) => item.name.toLowerCase() === typeName.toLowerCase()) : null;
  $('#typeFilter').value = type?.id || '';

  setView('inventory');
  await loadInventory();
}

async function returnToInventory() {
  state.hardwareGroup = null;
  state.inventoryMeta.page = 1;
  $('#searchInput').value = '';
  $('#typeFilter').value = '';
  $('#statusFilter').value = '';
  setView('inventory');
  await loadInventory();
}

function openEquipment(item = null) {
  hideHoverDetails();
  equipmentForm.reset();
  $('#equipmentMessage').textContent = '';
  renderEquipmentImagePreview(item?.image_path || '');
  const canWrite = ['ADMIN', 'TI'].includes(state.user.role);
  $('#deleteButton').classList.toggle('hidden', !item || !canWrite);
  $('#saveEquipmentButton').classList.toggle('hidden', !canWrite);
  $('#dialogTitle').textContent = item
    ? `Detalle de ${isAccessoryItem(item) ? 'accesorio' : 'equipo'}`
    : `Nuevo ${state.inventoryScope === 'accessories' ? 'accesorio' : 'equipo'}`;

  equipmentForm.elements.id.value = item?.id || '';
  if (item) {
    const type = state.lookups.types.find((x) => x.name === item.equipment_type);
    const brand = state.lookups.brands.find((x) => x.name === item.brand);
    const model = state.lookups.models.find((x) => x.name === item.model);
    const location = state.lookups.locations.find((x) => x.name === item.location);
    const area = state.lookups.areas.find((x) => x.name === item.area);
    equipmentForm.elements.equipment_type_id.value = type?.id || '';
    equipmentForm.elements.brand_id.value = brand?.id || '';
    equipmentForm.elements.model_id.value = model?.id || '';
    equipmentForm.elements.location_id.value = location?.id || '';
    syncAreaOptions();
    equipmentForm.elements.area_id.value = area?.id || '';
    equipmentForm.elements.serial_number.value = item.serial_number || '';
    equipmentForm.elements.asset_tag.value = item.asset_tag || '';
    equipmentForm.elements.assigned_user.value = item.assigned_user || '';
    equipmentForm.elements.status.value = item.status || 'activo';
    equipmentForm.elements.supplier.value = item.supplier || '';
    equipmentForm.elements.purchase_date.value = item.purchase_date ? String(item.purchase_date).slice(0, 10) : '';
    equipmentForm.elements.warranty_until.value = item.warranty_until ? String(item.warranty_until).slice(0, 10) : '';
    equipmentForm.elements.notes.value = item.notes || '';
    loadEquipmentProfile(item.id).catch((error) => {
      $('#equipmentMessage').textContent = error.message;
    });
  } else {
    loadEquipmentProfile(null);
  }

  equipmentDialog.showModal();
}

async function loadUsers() {
  if (state.user?.role !== 'ADMIN') return;
  const payload = await api('/users');
  state.users = payload.users || [];
  renderUsers();
}

function renderUsers() {
  const container = $('#userAdminList');
  if (!container) return;
  container.innerHTML = state.users.map((user) => `
    <article class="user-admin-item">
      <div>
        <strong>${user.name}</strong>
        <span>${user.username} &middot; ${user.role} &middot; ${user.is_active ? 'Activo' : 'Inactivo'}</span>
      </div>
      <div>
        <button class="ghost" type="button" data-user-toggle="${user.id}" data-active="${user.is_active ? 'false' : 'true'}">${user.is_active ? 'Desactivar' : 'Activar'}</button>
        <button class="ghost" type="button" data-user-reset="${user.id}">Reset</button>
      </div>
    </article>
  `).join('') || '<p class="empty-module">Sin usuarios.</p>';
}

async function importCsvFile(file) {
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  const previewResponse = await fetch('/api/equipment/import/csv?dry_run=true', {
    method: 'POST',
    headers: state.token ? { Authorization: `Bearer ${state.token}` } : {},
    body: formData
  });
  const preview = await previewResponse.json().catch(() => ({}));
  if (!previewResponse.ok) throw new Error(preview.message || 'No se pudo validar el CSV.');
  if (!preview.ready) {
    const firstError = preview.rows?.find((row) => row.errors?.length)?.errors?.[0] || 'Revise el CSV.';
    throw new Error(`CSV con errores: ${firstError}`);
  }
  if (!confirm(`Importar ${preview.valid} equipos desde CSV?`)) return;

  const commitData = new FormData();
  commitData.append('file', file);
  const commitResponse = await fetch('/api/equipment/import/csv?dry_run=false', {
    method: 'POST',
    headers: state.token ? { Authorization: `Bearer ${state.token}` } : {},
    body: commitData
  });
  const result = await commitResponse.json().catch(() => ({}));
  if (!commitResponse.ok) throw new Error(result.message || 'No se pudo importar el CSV.');
  alert(`Importacion completa: ${result.imported} equipos.`);
  await loadLookups();
  await loadInventory();
  await loadDashboard();
}

function csvCell(value, delimiter = ';') {
  const text = String(value ?? '');
  const mustQuote = text.includes(delimiter) || /[",\r\n]/.test(text);
  return mustQuote ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadImportTemplate() {
  const headers = [
    'Serie',
    'ID Equipo',
    'Usuario Asignado',
    'Tipo',
    'Marca',
    'Modelo',
    'Ubicacion',
    'Area',
    'Estado',
    'Notas',
    'Proveedor',
    'Fecha De Compra',
    'Garantia Hasta'
  ];
  const rows = [
    ['TIMSA-EJEMPLO-001', 'ID-001', 'jlopez', 'Laptop', 'Dell', 'Latitude 5440', 'Operaciones', 'Centro de Operaciones', 'activo', 'Equipo asignado para operacion diaria', 'Dell Mexico', '2026-05-14', '2027-05-14'],
    ['TIMSA-EJEMPLO-002', 'ID-002', 'mruiz', 'Desktop', 'HP', 'EliteDesk 800', 'Administracion', 'Oficinas', 'resguardo', 'Cambiar los datos de ejemplo antes de importar', 'HP Mexico', '2026-05-14', '2027-05-14']
  ];
  const csv = [
    headers.map((value) => csvCell(value)).join(';'),
    ...rows.map((row) => row.map((value) => csvCell(value)).join(';'))
  ].join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla-importacion-sati-timsa.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderEquipmentImagePreview(src) {
  const preview = $('#equipmentImagePreview');
  if (!preview) return;
  preview.classList.toggle('hidden', !src);
  preview.innerHTML = src ? `<img src="${src}" alt="Vista previa de imagen del equipo">` : '';
}

function fillMaintenanceEquipmentOptions(selectedId = '') {
  const select = maintenanceForm.elements.equipment_id;
  select.innerHTML = '<option value="">Seleccionar equipo</option>';
  state.items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.serial_number} · ${item.brand} ${item.model} · ${item.location}`;
    option.selected = item.id === selectedId;
    select.appendChild(option);
  });
}

function openMaintenance(item = null) {
  maintenanceForm.reset();
  $('#maintenanceMessage').textContent = '';
  $('#maintenanceDialogTitle').textContent = item ? 'Actualizar mantenimiento' : 'Agregar mantenimiento';
  fillMaintenanceEquipmentOptions(item?.equipment_id || '');
  maintenanceForm.elements.id.value = item?.id || '';
  maintenanceForm.elements.equipment_id.disabled = Boolean(item);
  maintenanceForm.elements.phase.value = item?.phase || 'revisado';
  maintenanceForm.elements.notes.value = item?.notes || '';
  maintenanceDialog.showModal();
}

function openStockDialog(item = null) {
  stockForm.reset();
  $('#stockMessage').textContent = '';
  $('#stockDialogTitle').textContent = item ? 'Modificar dispositivo en stock' : 'Agregar dispositivo en stock';
  fillElementSelect(stockForm.elements.location_id, state.lookups?.locations || [], 'Seleccionar');
  stockForm.elements.id.value = item?.id || '';
  stockForm.elements.item_code.value = item?.item_code || '';
  stockForm.elements.name.value = item?.name || '';
  stockForm.elements.model.value = item?.model || '';
  stockForm.elements.serial_number.value = item?.serial_number || '';
  stockForm.elements.quantity.value = item?.quantity ?? 1;
  stockForm.elements.location_id.value = item?.location_id || '';
  syncStockAreaOptions();
  stockForm.elements.area_id.value = item?.area_id || '';
  stockForm.elements.notes.value = item?.notes || '';
  stockDialog.showModal();
}

function maintenancePayload() {
  const data = Object.fromEntries(new FormData(maintenanceForm));
  if (maintenanceForm.elements.equipment_id.disabled) {
    data.equipment_id = maintenanceForm.elements.equipment_id.value;
  }
  delete data.id;
  return data;
}

function stockPayload() {
  const data = Object.fromEntries(new FormData(stockForm));
  delete data.id;
  return data;
}

function formPayload() {
  const data = Object.fromEntries(new FormData(equipmentForm));
  delete data.id;
  delete data.image;
  return data;
}

async function uploadEquipmentImage(equipmentId) {
  const file = equipmentForm.elements.image.files[0];
  if (!file) return null;

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('La imagen no debe superar 2 MB.');
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Use una imagen JPG, PNG o WEBP.');
  }

  if (isDemoMode) {
    const item = demoItems.find((entry) => String(entry.id) === String(equipmentId));
    if (item) {
      item.image_path = URL.createObjectURL(file);
    }
    return item;
  }

  const formData = new FormData();
  formData.append('image', file);
  const response = await fetch(`/api/equipment/${equipmentId}/image`, {
    method: 'POST',
    headers: state.token ? { Authorization: `Bearer ${state.token}` } : {},
    body: formData
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'No se pudo subir la imagen.');
  }
  return payload.item;
}

function selectedBrandName() {
  const brandId = Number(equipmentForm.elements.brand_id.value);
  return state.lookups?.brands.find((brand) => Number(brand.id) === brandId)?.name || '';
}

function openCatalogDialog(type) {
  $('#catalogMessage').textContent = '';
  catalogForm.reset();
  catalogForm.elements.catalog_type.value = type;
  catalogSource = stockDialog.open ? 'stock' : 'equipment';
  const activeLocationId = catalogSource === 'stock'
    ? stockForm.elements.location_id.value
    : equipmentForm.elements.location_id.value;

  const templates = {
    type: {
      title: 'Agregar tipo',
      html: '<label class="wide">Tipo nuevo<input name="name" required minlength="2" maxlength="80" placeholder="Ej. Scanner"></label>'
    },
    brand: {
      title: 'Agregar marca',
      html: '<label class="wide">Marca nueva<input name="name" required minlength="2" maxlength="80" placeholder="Ej. Samsung"></label>'
    },
    model: {
      title: 'Agregar modelo',
      html: `
        <label>Marca
          <select name="brand_id" required>
            ${state.lookups.brands.map((brand) => `
              <option value="${brand.id}" ${String(brand.id) === String(equipmentForm.elements.brand_id.value) ? 'selected' : ''}>${brand.name}</option>
            `).join('')}
          </select>
        </label>
        <label class="wide">Modelo nuevo<input name="name" required minlength="2" maxlength="120" placeholder="Ej. Latitude 5450"></label>
      `
    },
    location: {
      title: 'Agregar ubicacion',
      html: `
        <label>Ubicacion<input name="name" required minlength="2" maxlength="120" placeholder="Ej. Patio de Maniobras"></label>
        <label>Area inicial<input name="area_name" required minlength="2" maxlength="120" value="General"></label>
        <label class="wide">Direccion o referencia<input name="address" maxlength="500" placeholder="Referencia fisica opcional"></label>
      `
    },
    area: {
      title: 'Agregar area',
      html: `
        <label>Ubicacion
          <select name="location_id" required>
            ${state.lookups.locations.map((location) => `
              <option value="${location.id}" ${String(location.id) === String(activeLocationId) ? 'selected' : ''}>${location.name}</option>
            `).join('')}
          </select>
        </label>
        <label class="wide">Area nueva<input name="name" required minlength="2" maxlength="120" placeholder="Ej. Soporte TI"></label>
      `
    },
    assigned_user: {
      title: 'Agregar usuario asignado',
      html: '<label class="wide">Usuario<input name="assigned_user" required minlength="2" maxlength="140" placeholder="Ej. jlopez"></label>'
    },
    serial: {
      title: 'Agregar serie',
      html: '<label class="wide">Numero de serie<input name="serial_number" required minlength="2" maxlength="140" placeholder="Ej. 5CD1234ABC"></label>'
    }
  };

  const config = templates[type];
  $('#catalogTitle').textContent = config.title;
  catalogFields.innerHTML = config.html;
  catalogDialog.showModal();
}

async function saveCatalogEntry() {
  $('#catalogMessage').textContent = '';
  if (!catalogForm.reportValidity()) return;

  const data = Object.fromEntries(new FormData(catalogForm));
  const type = data.catalog_type;

  try {
    if (type === 'type') {
      const payload = await api('/lookups/types', {
        method: 'POST',
        body: JSON.stringify({ name: data.name })
      });
      await loadLookups();
      equipmentForm.elements.equipment_type_id.value = String(payload.type.id);
    }

    if (type === 'brand') {
      const payload = await api('/lookups/brands', {
        method: 'POST',
        body: JSON.stringify({ name: data.name })
      });
      await loadLookups();
      equipmentForm.elements.brand_id.value = String(payload.brand.id);
    }

    if (type === 'model') {
      const payload = await api('/lookups/models', {
        method: 'POST',
        body: JSON.stringify({ brand_id: data.brand_id, name: data.name })
      });
      await loadLookups();
      equipmentForm.elements.brand_id.value = String(payload.model.brand_id);
      equipmentForm.elements.model_id.value = String(payload.model.id);
    }

    if (type === 'location') {
      const payload = await api('/lookups/locations', {
        method: 'POST',
        body: JSON.stringify({ name: data.name, address: data.address, area_name: data.area_name })
      });
      await loadLookups();
      if (catalogSource === 'stock') {
        stockForm.elements.location_id.value = String(payload.location.id);
        syncStockAreaOptions();
        stockForm.elements.area_id.value = String(payload.area.id);
      } else {
        equipmentForm.elements.location_id.value = String(payload.location.id);
        syncAreaOptions();
        equipmentForm.elements.area_id.value = String(payload.area.id);
      }
    }

    if (type === 'area') {
      const payload = await api('/lookups/areas', {
        method: 'POST',
        body: JSON.stringify({ location_id: data.location_id, name: data.name })
      });
      await loadLookups();
      if (catalogSource === 'stock') {
        stockForm.elements.location_id.value = String(payload.area.location_id);
        syncStockAreaOptions();
        stockForm.elements.area_id.value = String(payload.area.id);
      } else {
        equipmentForm.elements.location_id.value = String(payload.area.location_id);
        syncAreaOptions();
        equipmentForm.elements.area_id.value = String(payload.area.id);
      }
    }

    if (type === 'assigned_user') {
      equipmentForm.elements.assigned_user.value = data.assigned_user;
    }

    if (type === 'serial') {
      equipmentForm.elements.serial_number.value = data.serial_number;
    }

    catalogDialog.close();
    const label = data.name || data.assigned_user || data.serial_number;
    $('#equipmentMessage').textContent = `${label} listo para guardarse en la base de datos.`;
  } catch (error) {
    $('#catalogMessage').textContent = error.message;
  }
}

async function exportInventoryPdf() {
  if (isDemoMode) {
    const clean = (value) => String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[()\\]/g, '')
      .slice(0, 110);
    const lines = [
      state.inventoryScope === 'accessories' ? 'SATI-TIMSA - Inventario de accesorios' : 'SATI-TIMSA - Inventario de hardware',
      `Generado: ${new Date().toLocaleString('es-MX')} | Registros: ${state.items.length}`,
      ' ',
      'Serie | Usuario | Ubicacion | Modelo | Estado',
      ...state.items.slice(0, 32).map((item) => [
        item.serial_number,
        item.assigned_user || 'Sin asignar',
        item.location,
        `${item.brand} ${item.model}`,
        displayStatus(item.status)
      ].map(clean).join(' | '))
    ];
    const textCommands = lines.map((line, index) => {
      const fontSize = index === 0 ? 16 : 8;
      const y = 560 - index * 15;
      return `BT /F1 ${fontSize} Tf 38 ${y} Td (${clean(line)}) Tj ET`;
    }).join('\n');
    const content = `${textCommands}\n`;
    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
      `5 0 obj << /Length ${content.length} >> stream\n${content}endstream endobj\n`
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object) => {
      offsets.push(pdf.length);
      pdf += object;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `sati-timsa-inventario-demo-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const params = new URLSearchParams({
    search: $('#searchInput').value.trim(),
    type_id: $('#typeFilter').value,
    status: $('#statusFilter').value
  });
  if (state.inventoryScope !== 'all') {
    params.set('scope', state.inventoryScope);
  }
  const response = await fetch(`/api/equipment/export/pdf?${params.toString()}`, {
    headers: state.token ? { Authorization: `Bearer ${state.token}` } : {}
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'No se pudo exportar el PDF.');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sati-timsa-inventario-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function boot() {
  state.token = null;
  state.user = null;
  showLogin();
}

$('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#loginMessage').textContent = '';
  try {
    const credentials = Object.fromEntries(new FormData(event.currentTarget));
    const rememberUsername = Boolean(credentials.remember_username);
    delete credentials.remember_username;
    const payload = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    state.token = payload.token;
    state.user = payload.user;
    if (rememberUsername) {
      localStorage.setItem('sati_remember_username', credentials.username);
    } else {
      localStorage.removeItem('sati_remember_username');
    }
    showDashboard();
    await loadLookups();
    await loadInventory();
    await loadDashboard();
    await loadMaintenance();
  } catch (error) {
    $('#loginMessage').textContent = error.message;
    if (error.message.includes('codigo') || error.message.includes('contrasena')) {
      $('#resetPanel').classList.remove('hidden');
    }
  }
});

$('#forgotPasswordLink').addEventListener('click', (event) => {
  event.preventDefault();
  $('#resetPanel').classList.remove('hidden');
  $('#loginMessage').textContent = '';
});

$('#passwordToggle').addEventListener('click', () => {
  const passwordInput = $('#loginForm').elements.password;
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  $('#passwordToggle').setAttribute('aria-label', isPassword ? 'Ocultar contrasena' : 'Mostrar contrasena');
});

$('#requestResetButton').addEventListener('click', async () => {
  $('#loginMessage').textContent = '';
  try {
    const username = $('#loginForm').elements.username.value;
    const payload = await api('/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
    $('#loginMessage').textContent = payload.devCode
      ? `${payload.message} Codigo dev: ${payload.devCode}`
      : payload.message;
  } catch (error) {
    $('#loginMessage').textContent = error.message;
  }
});

$('#confirmResetButton').addEventListener('click', async () => {
  $('#loginMessage').textContent = '';
  try {
    const form = $('#loginForm');
    const payload = await api('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({
        username: form.elements.username.value,
        code: form.elements.reset_code.value,
        password: form.elements.reset_password.value
      })
    });
    $('#loginMessage').textContent = payload.message;
    $('#resetPanel').classList.add('hidden');
  } catch (error) {
    $('#loginMessage').textContent = error.message;
  }
});

$('#logoutButton').addEventListener('click', () => {
  state.token = null;
  state.user = null;
  state.items = [];
  state.lookups = null;
  state.maintenance = [];
  state.stock = [];
  showLogin();
});

$('#notificationButton').addEventListener('click', () => {
  if (notificationPanel.classList.contains('hidden')) {
    openNotifications();
  } else {
    closeNotifications();
  }
});

$('#closeNotificationsButton').addEventListener('click', closeNotifications);

menuButton.addEventListener('click', toggleSidebar);
sidebarCollapseButton.addEventListener('click', toggleSidebar);

noteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(noteForm));
  state.notes.unshift({
    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
    text: data.text.trim(),
    dueAt: data.due_at,
    userId: state.user?.id || 'demo',
    userName: state.user?.name || 'Usuario',
    createdAt: new Date().toISOString()
  });
  saveNotes();
  noteForm.reset();
  noteForm.elements.due_at.value = defaultReminderDate();
  renderNotifications();
});

$('#notificationList').addEventListener('click', (event) => {
  const button = event.target.closest('[data-note-delete]');
  if (!button) return;
  state.notes = state.notes.filter((note) => note.id !== button.dataset.noteDelete);
  saveNotes();
  renderNotifications();
});

$('#backButton').addEventListener('click', returnToInventory);

document.querySelectorAll('[data-back-inventory]').forEach((button) => {
  button.addEventListener('click', returnToInventory);
});

$('#newEquipmentButton').addEventListener('click', () => openEquipment());
$('#newMaintenanceButton').addEventListener('click', () => openMaintenance());
$('#newStockButton').addEventListener('click', openStockDialog);
$('#newUserButton').addEventListener('click', () => {
  userForm.reset();
  $('#userMessage').textContent = '';
  userDialog.showModal();
  loadUsers();
});

$('#changePasswordButton').addEventListener('click', () => {
  passwordForm.reset();
  $('#passwordMessage').textContent = '';
  passwordDialog.showModal();
});

equipmentForm.elements.location_id.addEventListener('change', syncAreaOptions);
stockForm.elements.location_id.addEventListener('change', syncStockAreaOptions);

equipmentForm.elements.image.addEventListener('change', () => {
  const file = equipmentForm.elements.image.files[0];
  if (!file) {
    const item = state.items.find((entry) => entry.id === equipmentForm.elements.id.value);
    renderEquipmentImagePreview(item?.image_path || '');
    return;
  }
  renderEquipmentImagePreview(URL.createObjectURL(file));
});

equipmentForm.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add-catalog]');
  if (!button) return;
  openCatalogDialog(button.dataset.addCatalog);
});

stockForm.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add-catalog]');
  if (!button) return;
  openCatalogDialog(button.dataset.addCatalog);
});

$('#saveCatalogButton').addEventListener('click', saveCatalogEntry);

document.querySelectorAll('nav a[data-view]').forEach((link) => {
  link.addEventListener('click', async (event) => {
    event.preventDefault();
    setView(link.dataset.view);
    if (['inventory', 'equipment', 'accessories'].includes(link.dataset.view)) {
      state.hardwareGroup = null;
      state.inventoryMeta.page = 1;
      $('#searchInput').value = '';
      $('#typeFilter').value = '';
      $('#statusFilter').value = '';
      await loadInventory();
    }
  });
});

$('#searchInput').addEventListener('input', () => {
  state.hardwareGroup = null;
  state.inventoryMeta.page = 1;
  clearTimeout(window.searchTimer);
  window.searchTimer = setTimeout(loadInventory, 250);
});

$('#typeFilter').addEventListener('change', () => {
  state.hardwareGroup = null;
  state.inventoryMeta.page = 1;
  loadInventory();
});

$('#statusFilter').addEventListener('change', () => {
  state.hardwareGroup = null;
  state.inventoryMeta.page = 1;
  loadInventory();
});

$('#prevPageButton').addEventListener('click', () => {
  if (state.inventoryMeta.page <= 1) return;
  state.inventoryMeta.page -= 1;
  loadInventory();
});

$('#nextPageButton').addEventListener('click', () => {
  if (state.inventoryMeta.page >= state.inventoryMeta.total_pages) return;
  state.inventoryMeta.page += 1;
  loadInventory();
});

$('#pageSizeSelect').addEventListener('change', () => {
  state.inventoryMeta.limit = Number($('#pageSizeSelect').value || 25);
  state.inventoryMeta.page = 1;
  loadInventory();
});

$('#exportPdfButton').addEventListener('click', async () => {
  try {
    await exportInventoryPdf();
  } catch (error) {
    alert(error.message);
  }
});

$('#downloadTemplateButton').addEventListener('click', downloadImportTemplate);

$('#importCsvButton').addEventListener('click', () => $('#csvImportInput').click());

$('#csvImportInput').addEventListener('change', async () => {
  try {
    await importCsvFile($('#csvImportInput').files[0]);
  } catch (error) {
    alert(error.message);
  } finally {
    $('#csvImportInput').value = '';
  }
});

$('#applyAuditFiltersButton').addEventListener('click', loadAudit);

$('#applyStockFiltersButton').addEventListener('click', loadStock);
$('#stockLocationFilter').addEventListener('change', () => {
  syncStockFilterAreas();
  loadStock();
});
$('#stockAreaFilter').addEventListener('change', loadStock);
$('#stockSearchInput').addEventListener('input', () => {
  clearTimeout(window.stockSearchTimer);
  window.stockSearchTimer = setTimeout(loadStock, 250);
});

$('#stockList').addEventListener('click', (event) => {
  const button = event.target.closest('[data-stock-edit]');
  if (!button) return;
  const item = state.stock.find((entry) => entry.id === button.dataset.stockEdit);
  if (item) openStockDialog(item);
});

$('#exportAuditButton').addEventListener('click', async () => {
  const params = new URLSearchParams({
    username: $('#auditUsernameFilter').value.trim(),
    action: $('#auditActionFilter').value.trim(),
    entity: $('#auditEntityFilter').value.trim(),
    date_from: $('#auditFromFilter').value,
    date_to: $('#auditToFilter').value
  });
  const response = await fetch(`/api/audit/export.csv?${params.toString()}`, {
    headers: state.token ? { Authorization: `Bearer ${state.token}` } : {}
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    alert(payload.message || 'No se pudo exportar auditoria.');
    return;
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sati-timsa-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

$('#maintenanceList').addEventListener('click', (event) => {
  const button = event.target.closest('[data-maintenance-edit]');
  if (!button) return;
  const item = state.maintenance.find((entry) => entry.id === button.dataset.maintenanceEdit);
  openMaintenance(item);
});

$('#hardwareView').addEventListener('click', async (event) => {
  const option = event.target.closest('[data-hardware-group]');
  if (!option) return;
  await openHardwareGroup(option.dataset.hardwareGroup);
});

$('#hardwareView').addEventListener('keydown', async (event) => {
  if (!['Enter', ' '].includes(event.key)) return;
  const option = event.target.closest('[data-hardware-group]');
  if (!option) return;
  event.preventDefault();
  await openHardwareGroup(option.dataset.hardwareGroup);
});

inventoryBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-edit]');
  const row = event.target.closest('tr');
  const id = button?.dataset.edit || row?.querySelector('[data-edit]')?.dataset.edit;
  if (!id) return;
  const item = state.items.find((entry) => entry.id === id);
  openEquipment(item);
});

inventoryBody.addEventListener('mouseover', (event) => {
  const cell = event.target.closest('td[data-hover-detail]');
  if (!cell || cell.contains(event.relatedTarget)) return;
  const row = cell.closest('tr[data-item-id]');
  const item = state.items.find((entry) => entry.id === row.dataset.itemId);
  if (item) scheduleHoverDetails(item, event);
});

inventoryBody.addEventListener('mousemove', (event) => {
  if (equipmentPreview.matches(':hover')) return;
  hoverPointer = { x: event.clientX, y: event.clientY };
});

inventoryBody.addEventListener('mouseout', (event) => {
  const cell = event.target.closest('td[data-hover-detail]');
  if (!cell || cell.contains(event.relatedTarget)) return;
  if (equipmentPreview.contains(event.relatedTarget)) return;
  hideHoverDetails(650);
});

equipmentPreview.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-preview]')) {
    hideHoverDetails();
    return;
  }
  const button = event.target.closest('[data-preview-open]');
  if (!button) return;
  const item = state.items.find((entry) => entry.id === button.dataset.previewOpen);
  openEquipment(item);
});

equipmentPreview.addEventListener('mouseenter', () => {
  clearTimeout(hoverDetailTimer);
  clearTimeout(hoverHideTimer);
  if (!equipmentPreview.classList.contains('hidden')) {
    equipmentPreview.classList.add('equipment-preview--visible');
  }
});

equipmentPreview.addEventListener('mouseleave', (event) => {
  const row = event.relatedTarget?.closest?.('tr[data-item-id]');
  if (row && inventoryBody.contains(row)) return;
  hideHoverDetails(250);
});

window.addEventListener('resize', () => {
  if (equipmentPreview.classList.contains('equipment-preview--visible')) {
    positionHoverDetails();
  }
});

$('#saveEquipmentButton').addEventListener('click', async () => {
  $('#equipmentMessage').textContent = '';
  if (!equipmentForm.reportValidity()) return;

  try {
    const id = equipmentForm.elements.id.value;
    const payload = await api(id ? `/equipment/${id}` : '/equipment', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(formPayload())
    });
    await uploadEquipmentImage(id || payload.item.id);
    equipmentDialog.close();
    await loadInventory();
    await loadDashboard();
  } catch (error) {
    $('#equipmentMessage').textContent = error.message;
  }
});

$('#deleteButton').addEventListener('click', async () => {
  const id = equipmentForm.elements.id.value;
  if (!id || !confirm('Eliminar este equipo del inventario?')) return;

  try {
    await api(`/equipment/${id}`, { method: 'DELETE' });
    equipmentDialog.close();
    await loadInventory();
    await loadDashboard();
  } catch (error) {
    $('#equipmentMessage').textContent = error.message;
  }
});

$('#saveMaintenanceButton').addEventListener('click', async () => {
  $('#maintenanceMessage').textContent = '';
  if (!maintenanceForm.reportValidity()) return;

  try {
    const id = maintenanceForm.elements.id.value;
    await api(id ? `/maintenance/${id}` : '/maintenance', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(maintenancePayload())
    });
    maintenanceForm.elements.equipment_id.disabled = false;
    maintenanceDialog.close();
    await loadMaintenance();
    await loadInventory();
  } catch (error) {
    $('#maintenanceMessage').textContent = error.message;
  }
});

$('#saveStockButton').addEventListener('click', async () => {
  $('#stockMessage').textContent = '';
  if (!stockForm.reportValidity()) return;
  try {
    const id = stockForm.elements.id.value;
    await api(id ? `/stock/${id}` : '/stock', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(stockPayload())
    });
    stockDialog.close();
    await loadStock();
  } catch (error) {
    $('#stockMessage').textContent = error.message;
  }
});

maintenanceDialog.addEventListener('close', () => {
  maintenanceForm.elements.equipment_id.disabled = false;
});

$('#saveUserButton').addEventListener('click', async () => {
  $('#userMessage').textContent = '';
  if (!userForm.reportValidity()) return;

  try {
    await api('/users', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(new FormData(userForm)))
    });
    userForm.reset();
    await loadUsers();
  } catch (error) {
    $('#userMessage').textContent = error.message;
  }
});

$('#userAdminList').addEventListener('click', async (event) => {
  const toggle = event.target.closest('[data-user-toggle]');
  const reset = event.target.closest('[data-user-reset]');
  try {
    if (toggle) {
      await api(`/users/${toggle.dataset.userToggle}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: toggle.dataset.active === 'true' })
      });
      await loadUsers();
    }
    if (reset) {
      const password = prompt('Nueva contrasena maxima de 12 caracteres:');
      if (!password) return;
      await api(`/users/${reset.dataset.userReset}/password`, {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      alert('Contrasena reiniciada.');
    }
  } catch (error) {
    $('#userMessage').textContent = error.message;
  }
});

$('#savePasswordButton').addEventListener('click', async () => {
  $('#passwordMessage').textContent = '';
  if (!passwordForm.reportValidity()) return;
  try {
    const payload = await api('/auth/password', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(new FormData(passwordForm)))
    });
    $('#passwordMessage').textContent = payload.message;
    passwordForm.reset();
  } catch (error) {
    $('#passwordMessage').textContent = error.message;
  }
});

boot();
