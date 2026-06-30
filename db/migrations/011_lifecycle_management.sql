-- ═══════════════════════════════════════════════════════════════════════
-- 011_lifecycle_management.sql
-- Asset 360° View: hardware, software, assignments, depreciation,
-- warranty claims. Re-activates maintenance_orders.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. HARDWARE COMPONENTS — CPU, RAM, disk, GPU, NIC, battery, motherboard
CREATE TABLE IF NOT EXISTS hardware_components (
  id BIGSERIAL PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  component_type VARCHAR(40) NOT NULL CHECK (component_type IN (
    'cpu', 'ram', 'disk', 'gpu', 'network', 'battery', 'motherboard', 'optical', 'other'
  )),
  manufacturer VARCHAR(140),
  model VARCHAR(140),
  serial_number VARCHAR(140),
  capacity VARCHAR(80),
  form_factor VARCHAR(40),
  slot_designation VARCHAR(40),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hardware_components_equipment ON hardware_components(equipment_id);
CREATE INDEX IF NOT EXISTS idx_hardware_components_type ON hardware_components(equipment_id, component_type);

DROP TRIGGER IF EXISTS trg_hardware_components_touch_updated_at ON hardware_components;
CREATE TRIGGER trg_hardware_components_touch_updated_at
BEFORE UPDATE ON hardware_components
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- 2. INSTALLED SOFTWARE — Software inventory per asset
CREATE TABLE IF NOT EXISTS installed_software (
  id BIGSERIAL PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  version VARCHAR(80),
  publisher VARCHAR(200),
  install_date DATE,
  license_key TEXT,
  is_authorized BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installed_software_equipment ON installed_software(equipment_id);
CREATE INDEX IF NOT EXISTS idx_installed_software_name ON installed_software(name);
CREATE INDEX IF NOT EXISTS idx_installed_software_unauthorized
  ON installed_software(equipment_id, is_authorized) WHERE is_authorized = FALSE;

DROP TRIGGER IF EXISTS trg_installed_software_touch_updated_at ON installed_software;
CREATE TRIGGER trg_installed_software_touch_updated_at
BEFORE UPDATE ON installed_software
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- 3. EQUIPMENT ASSIGNMENTS — Formal assignment history with dates
CREATE TABLE IF NOT EXISTS equipment_assignments (
  id BIGSERIAL PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  assigned_to TEXT NOT NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  returned_at TIMESTAMPTZ,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_assignments_equipment ON equipment_assignments(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_active
  ON equipment_assignments(equipment_id, returned_at) WHERE returned_at IS NULL;

-- 4. DEPRECIATION SCHEDULE — Book value and automatic depreciation
CREATE TABLE IF NOT EXISTS depreciation_schedule (
  id BIGSERIAL PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  acquisition_cost DECIMAL(12,2) NOT NULL CHECK (acquisition_cost >= 0),
  salvage_value DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (salvage_value >= 0),
  useful_life_months INTEGER NOT NULL CHECK (useful_life_months BETWEEN 1 AND 240),
  method VARCHAR(30) NOT NULL DEFAULT 'straight_line' CHECK (method IN ('straight_line', 'declining_balance')),
  start_date DATE NOT NULL,
  current_book_value DECIMAL(12,2),
  last_depreciation_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_depreciation_schedule_equipment ON depreciation_schedule(equipment_id);

DROP TRIGGER IF EXISTS trg_depreciation_schedule_touch_updated_at ON depreciation_schedule;
CREATE TRIGGER trg_depreciation_schedule_touch_updated_at
BEFORE UPDATE ON depreciation_schedule
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- 5. WARRANTY CLAIMS — RMA, on-site, parts replacement tracking
CREATE TABLE IF NOT EXISTS warranty_claims (
  id BIGSERIAL PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  claim_type VARCHAR(30) NOT NULL CHECK (claim_type IN ('rma', 'onsite', 'parts', 'labor')),
  status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'approved', 'rejected', 'closed')),
  description TEXT NOT NULL,
  filed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  filed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warranty_claims_equipment ON warranty_claims(equipment_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON warranty_claims(status);

DROP TRIGGER IF EXISTS trg_warranty_claims_touch_updated_at ON warranty_claims;
CREATE TRIGGER trg_warranty_claims_touch_updated_at
BEFORE UPDATE ON warranty_claims
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- 6. EXTEND MAINTENANCE ORDERS — Add status_id for lifecycle integration
ALTER TABLE maintenance_orders ADD COLUMN IF NOT EXISTS status_id SMALLINT;
ALTER TABLE maintenance_orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
