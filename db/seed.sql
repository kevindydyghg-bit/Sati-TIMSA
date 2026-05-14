INSERT INTO brands (name)
VALUES ('Dell'), ('HP'), ('Lenovo'), ('Zebra'), ('Cisco'), ('Ubiquiti'), ('Microsoft'), ('Logitech'), ('Hikvision'), ('Generic')
ON CONFLICT (name) DO NOTHING;

INSERT INTO equipment_models (brand_id, name)
SELECT b.id, m.name
FROM brands b
JOIN (VALUES
  ('Dell', 'Latitude 5440'),
  ('Dell', 'Latitude 5530'),
  ('Dell', 'OptiPlex 7010'),
  ('Dell', 'OptiPlex 7090'),
  ('HP', 'EliteBook 840 G8'),
  ('HP', 'LaserJet Pro M404'),
  ('HP', 'ProBook 450 G9'),
  ('Lenovo', 'ThinkPad E14'),
  ('Lenovo', 'ThinkPad T14'),
  ('Lenovo', 'ThinkCentre M720'),
  ('Microsoft', 'Surface Laptop 4'),
  ('Zebra', 'TC21'),
  ('Cisco', 'Catalyst 2960'),
  ('Ubiquiti', 'UniFi Dream Machine'),
  ('Logitech', 'M185'),
  ('Logitech', 'C920'),
  ('Hikvision', 'DS-2CD1023G0'),
  ('Generic', 'USB Keyboard')
) AS m(brand, name) ON m.brand = b.name
ON CONFLICT (brand_id, name) DO NOTHING;

INSERT INTO locations (name, address)
VALUES
  ('Administracion de Riesgos', 'Ubicacion operativa TIMSA'),
  ('Almacen de Refacciones', 'Ubicacion operativa TIMSA'),
  ('Almacen de Previos', 'Ubicacion operativa TIMSA'),
  ('CCTV', 'Ubicacion operativa TIMSA'),
  ('Centro de Operaciones Previos', 'Ubicacion operativa TIMSA'),
  ('Comercializacion', 'Ubicacion operativa TIMSA'),
  ('Compras y Servicios', 'Ubicacion operativa TIMSA'),
  ('Contabilidad', 'Ubicacion operativa TIMSA'),
  ('Container', 'Ubicacion operativa TIMSA'),
  ('Control Aduanero', 'Ubicacion operativa TIMSA'),
  ('Control Tower', 'Ubicacion operativa TIMSA'),
  ('Costs', 'Ubicacion operativa TIMSA'),
  ('Facturacion', 'Ubicacion operativa TIMSA'),
  ('Ferrocarril y Refrigerados', 'Ubicacion operativa TIMSA'),
  ('Gerencia General', 'Ubicacion operativa TIMSA'),
  ('Horizon', 'Ubicacion operativa TIMSA'),
  ('Ingenieria y Desarrollo', 'Ubicacion operativa TIMSA'),
  ('Mantenimiento', 'Ubicacion operativa TIMSA'),
  ('Operaciones', 'Ubicacion operativa TIMSA'),
  ('Patio de Vacios', 'Ubicacion operativa TIMSA'),
  ('Planeacion Financiera', 'Ubicacion operativa TIMSA'),
  ('Proteccion', 'Ubicacion operativa TIMSA'),
  ('Puerta de Entrada', 'Ubicacion operativa TIMSA'),
  ('Puerta de Salida', 'Ubicacion operativa TIMSA'),
  ('RRHH', 'Ubicacion operativa TIMSA'),
  ('RFE', 'Ubicacion operativa TIMSA'),
  ('Salud Ocupacional y Seguridad', 'Ubicacion operativa TIMSA'),
  ('Servicios', 'Ubicacion operativa TIMSA'),
  ('Sistema Integrado de Gestion', 'Ubicacion operativa TIMSA'),
  ('Subgerencia de Sistemas', 'Ubicacion operativa TIMSA'),
  ('Terminal CFS', 'Ubicacion operativa TIMSA')
ON CONFLICT (name) DO NOTHING;

INSERT INTO areas (location_id, name)
SELECT l.id, a.name
FROM locations l
JOIN (VALUES
  ('Administracion de Riesgos', 'General'),
  ('Almacen de Refacciones', 'General'),
  ('Almacen de Previos', 'General'),
  ('CCTV', 'General'),
  ('Centro de Operaciones Previos', 'General'),
  ('Comercializacion', 'General'),
  ('Compras y Servicios', 'General'),
  ('Contabilidad', 'General'),
  ('Container', 'General'),
  ('Control Aduanero', 'General'),
  ('Control Tower', 'General'),
  ('Costs', 'General'),
  ('Facturacion', 'General'),
  ('Ferrocarril y Refrigerados', 'General'),
  ('Gerencia General', 'General'),
  ('Horizon', 'General'),
  ('Ingenieria y Desarrollo', 'General'),
  ('Mantenimiento', 'General'),
  ('Operaciones', 'General'),
  ('Patio de Vacios', 'General'),
  ('Planeacion Financiera', 'General'),
  ('Proteccion', 'General'),
  ('Puerta de Entrada', 'General'),
  ('Puerta de Salida', 'General'),
  ('RRHH', 'General'),
  ('RFE', 'General'),
  ('Salud Ocupacional y Seguridad', 'General'),
  ('Servicios', 'General'),
  ('Sistema Integrado de Gestion', 'General'),
  ('Subgerencia de Sistemas', 'General'),
  ('Terminal CFS', 'General')
) AS a(location, name) ON a.location = l.name
ON CONFLICT (location_id, name) DO NOTHING;

INSERT INTO equipment
  (equipment_type_id, brand_id, model_id, location_id, area_id, serial_number, asset_tag, assigned_user, status, notes)
SELECT
  et.id,
  b.id,
  em.id,
  l.id,
  a.id,
  sample.serial_number,
  sample.asset_tag,
  sample.assigned_user,
  sample.status,
  sample.notes
FROM (VALUES
  ('Laptop', 'Dell', 'Latitude 5440', 'Operaciones', 'General', '5CD1234ABC', 'TIMSA-LAP-001', 'jlopez', 'activo', 'Equipo operativo.'),
  ('Laptop', 'HP', 'EliteBook 840 G8', 'Administracion de Riesgos', 'General', '8CG2345DEF', 'TIMSA-LAP-002', 'mruiz', 'activo', 'Equipo administrativo.'),
  ('Laptop', 'Lenovo', 'ThinkPad T14', 'Terminal CFS', 'General', '9FT3456GHI', 'TIMSA-LAP-003', 'cgarcia', 'mantenimiento', 'Revision preventiva programada.'),
  ('Desktop', 'Dell', 'OptiPlex 7090', 'Control Tower', 'General', '3HY4567JKL', 'TIMSA-DES-001', 'arojas', 'activo', 'Estacion fija en modulo operativo.'),
  ('Laptop', 'HP', 'ProBook 450 G9', 'Contabilidad', 'General', '7KL5678MNO', 'TIMSA-LAP-004', 'dhernandez', 'activo', 'Equipo de oficina.'),
  ('Laptop', 'Dell', 'Latitude 5530', 'Almacen de Refacciones', 'General', '2MN6789PQR', 'TIMSA-LAP-005', 'lmartinez', 'resguardo', 'Equipo en resguardo.'),
  ('Desktop', 'Lenovo', 'ThinkCentre M720', 'Puerta de Entrada', 'General', '6PR7890STU', 'TIMSA-DES-002', 'vsanchez', 'activo', 'Estacion de acceso.'),
  ('Laptop', 'Microsoft', 'Surface Laptop 4', 'Gerencia General', 'General', '1TU8901VWX', 'TIMSA-LAP-006', 'flopez', 'activo', 'Equipo ejecutivo.'),
  ('Camara', 'Hikvision', 'DS-2CD1023G0', 'CCTV', 'General', 'CAM2026051201', 'TIMSA-CAM-001', 'cctv', 'activo', 'Camara de vigilancia inventariada como accesorio critico.'),
  ('Mouse', 'Logitech', 'M185', 'Compras y Servicios', 'General', 'MOU2026051201', 'TIMSA-MOU-001', 'agarcia', 'activo', 'Mouse inalambrico asignado.'),
  ('Webcam', 'Logitech', 'C920', 'RRHH', 'General', 'WEB2026051201', 'TIMSA-WEB-001', 'rrhh', 'resguardo', 'Webcam para reuniones y capacitacion.'),
  ('Teclado', 'Generic', 'USB Keyboard', 'Facturacion', 'General', 'KEY2026051201', 'TIMSA-KEY-001', 'facturacion', 'activo', 'Teclado USB de reemplazo.')
) AS sample(equipment_type, brand, model, location, area, serial_number, asset_tag, assigned_user, status, notes)
JOIN equipment_types et ON et.name = sample.equipment_type
JOIN brands b ON b.name = sample.brand
JOIN equipment_models em ON em.brand_id = b.id AND em.name = sample.model
JOIN locations l ON l.name = sample.location
JOIN areas a ON a.location_id = l.id AND a.name = sample.area
ON CONFLICT (serial_number) DO UPDATE SET
  asset_tag = EXCLUDED.asset_tag,
  assigned_user = EXCLUDED.assigned_user,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes,
  equipment_type_id = EXCLUDED.equipment_type_id,
  brand_id = EXCLUDED.brand_id,
  model_id = EXCLUDED.model_id,
  location_id = EXCLUDED.location_id,
  area_id = EXCLUDED.area_id;

DELETE FROM areas
WHERE location_id IN (
  SELECT id
  FROM locations
  WHERE name IN ('CEDIS Norte', 'CEDIS Sur', 'Oficinas Centrales', 'Patio de Contenedores', 'Oficinas TIMSA', 'Terminal 1', 'Terminal 2', 'Almacen General', 'TIMSA')
)
AND id NOT IN (SELECT area_id FROM equipment);

DELETE FROM locations
WHERE name IN ('CEDIS Norte', 'CEDIS Sur', 'Oficinas Centrales', 'Patio de Contenedores', 'Oficinas TIMSA', 'Terminal 1', 'Terminal 2', 'Almacen General', 'TIMSA')
AND id NOT IN (SELECT location_id FROM equipment);
