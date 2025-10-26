-- ===============================================================
-- PulseConnect Complete Database Schema
-- Single migration file - rebuilds all tables from scratch
-- ===============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===============================================================
-- 1. HOSPITALS TABLE
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  city text,
  state text,
  pincode text,
  registration_number text UNIQUE,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===============================================================
-- 2. DONORS TABLE
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  blood_group text NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  age integer CHECK (age >= 18 AND age <= 65),
  gender text CHECK (gender IN ('Male', 'Female', 'Other')),
  location text,
  last_donation_date timestamptz,
  next_eligible_date timestamptz,
  is_available boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===============================================================
-- 3. REQUESTS TABLE
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  donor_id uuid,
  request_type text NOT NULL CHECK (request_type IN ('blood', 'plasma')),
  blood_group text NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_required integer NOT NULL CHECK (units_required > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'fulfilled', 'cancelled', 'expired')),
  emergency_level text NOT NULL DEFAULT 'Medium' CHECK (emergency_level IN ('Low', 'Medium', 'High', 'Critical')),
  patient_name text,
  patient_age integer,
  medical_condition text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===============================================================
-- 4. APPOINTMENTS TABLE
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  donor_id uuid NOT NULL,
  request_id uuid,
  appointment_date timestamptz NOT NULL,
 I want you to regenerate the full  appointment_time text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===============================================================
-- 5. BLOOD INVENTORY TABLE
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.blood_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  blood_group text NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_available integer NOT NULL DEFAULT 0 CHECK (units_available >= 0),
  expiry_date timestamptz,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'used', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===============================================================
-- 6. PLASMA INVENTORY TABLE
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.plasma_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  blood_group text NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_available integer NOT NULL DEFAULT 0 CHECK (units_available >= 0),
  plasma_type text,
  expiry_date timestamptz,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'used', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===============================================================
-- 7. DONATIONS TABLE
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  donor_id uuid NOT NULL,
  donation_type text NOT NULL CHECK (donation_type IN ('blood', 'plasma')),
  donation_date timestamptz NOT NULL DEFAULT now(),
  units_donated integer NOT NULL CHECK (units_donated > 0),
  blood_group text NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  verified boolean DEFAULT false,
  verified_by uuid,
  verification_date timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===============================================================
-- 8. BLOCKCHAIN LEDGER TABLE
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.blockchain_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  donor_id uuid NOT NULL,
  transaction_hash text NOT NULL UNIQUE,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  network text NOT NULL DEFAULT 'polygon',
  block_number bigint,
  gas_used bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===============================================================
-- 9. FOREIGN KEY CONSTRAINTS
-- ===============================================================

-- Requests foreign keys
ALTER TABLE public.requests 
ADD CONSTRAINT fk_requests_hospital_id 
FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE;

ALTER TABLE public.requests 
ADD CONSTRAINT fk_requests_donor_id 
FOREIGN KEY (donor_id) REFERENCES public.donors(id) ON DELETE SET NULL;

-- Appointments foreign keys
ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_hospital_id 
FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE;

ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_donor_id 
FOREIGN KEY (donor_id) REFERENCES public.donors(id) ON DELETE CASCADE;

ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_request_id 
FOREIGN KEY (request_id) REFERENCES public.requests(id) ON DELETE SET NULL;

-- Blood inventory foreign keys
ALTER TABLE public.blood_inventory 
ADD CONSTRAINT fk_blood_inventory_hospital_id 
FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE;

-- Plasma inventory foreign keys
ALTER TABLE public.plasma_inventory 
ADD CONSTRAINT fk_plasma_inventory_hospital_id 
FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE;

-- Donations foreign keys
ALTER TABLE public.donations 
ADD CONSTRAINT fk_donations_hospital_id 
FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE;

ALTER TABLE public.donations 
ADD CONSTRAINT fk_donations_donor_id 
FOREIGN KEY (donor_id) REFERENCES public.donors(id) ON DELETE CASCADE;

ALTER TABLE public.donations 
ADD CONSTRAINT fk_donations_verified_by 
FOREIGN KEY (verified_by) REFERENCES public.hospitals(id) ON DELETE SET NULL;

-- Blockchain ledger foreign keys
ALTER TABLE public.blockchain_ledger 
ADD CONSTRAINT fk_blockchain_ledger_donation_id 
FOREIGN KEY (donation_id) REFERENCES public.donations(id) ON DELETE CASCADE;

ALTER TABLE public.blockchain_ledger 
ADD CONSTRAINT fk_blockchain_ledger_hospital_id 
FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE;

ALTER TABLE public.blockchain_ledger 
ADD CONSTRAINT fk_blockchain_ledger_donor_id 
FOREIGN KEY (donor_id) REFERENCES public.donors(id) ON DELETE CASCADE;

-- ===============================================================
-- 10. INDEXES FOR PERFORMANCE
-- ===============================================================
CREATE INDEX IF NOT EXISTS idx_hospitals_email ON public.hospitals (email);
CREATE INDEX IF NOT EXISTS idx_hospitals_city ON public.hospitals (city);
CREATE INDEX IF NOT EXISTS idx_hospitals_state ON public.hospitals (state);

CREATE INDEX IF NOT EXISTS idx_donors_email ON public.donors (email);
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON public.donors (blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_location ON public.donors (location);
CREATE INDEX IF NOT EXISTS idx_donors_available ON public.donors (is_available);

CREATE INDEX IF NOT EXISTS idx_requests_hospital_id ON public.requests (hospital_id);
CREATE INDEX IF NOT EXISTS idx_requests_donor_id ON public.requests (donor_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_blood_group ON public.requests (blood_group);
CREATE INDEX IF NOT EXISTS idx_requests_emergency_level ON public.requests (emergency_level);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests (created_at);

CREATE INDEX IF NOT EXISTS idx_appointments_hospital_id ON public.appointments (hospital_id);
CREATE INDEX IF NOT EXISTS idx_appointments_donor_id ON public.appointments (donor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);

CREATE INDEX IF NOT EXISTS idx_blood_inventory_hospital_id ON public.blood_inventory (hospital_id);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_blood_group ON public.blood_inventory (blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_status ON public.blood_inventory (status);

CREATE INDEX IF NOT EXISTS idx_plasma_inventory_hospital_id ON public.plasma_inventory (hospital_id);
CREATE INDEX IF NOT EXISTS idx_plasma_inventory_blood_group ON public.plasma_inventory (blood_group);
CREATE INDEX IF NOT EXISTS idx_plasma_inventory_status ON public.plasma_inventory (status);

CREATE INDEX IF NOT EXISTS idx_donations_hospital_id ON public.donations (hospital_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON public.donations (donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_date ON public.donations (donation_date);
CREATE INDEX IF NOT EXISTS idx_donations_verified ON public.donations (verified);

CREATE INDEX IF NOT EXISTS idx_blockchain_ledger_donation_id ON public.blockchain_ledger (donation_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_ledger_transaction_hash ON public.blockchain_ledger (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_ledger_status ON public.blockchain_ledger (verification_status);

-- ===============================================================
-- 11. UPDATE TRIGGER FUNCTION
-- ===============================================================
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===============================================================
-- 12. APPLY TRIGGERS TO ALL TABLES
-- ===============================================================

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_hospitals_updated_at ON public.hospitals;
DROP TRIGGER IF EXISTS update_donors_updated_at ON public.donors;
DROP TRIGGER IF EXISTS update_requests_updated_at ON public.requests;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS update_blood_inventory_updated_at ON public.blood_inventory;
DROP TRIGGER IF EXISTS update_plasma_inventory_updated_at ON public.plasma_inventory;
DROP TRIGGER IF EXISTS update_donations_updated_at ON public.donations;
DROP TRIGGER IF EXISTS update_blockchain_ledger_updated_at ON public.blockchain_ledger;

-- Create triggers for all tables
CREATE TRIGGER update_hospitals_updated_at 
    BEFORE UPDATE ON public.hospitals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donors_updated_at 
    BEFORE UPDATE ON public.donors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at 
    BEFORE UPDATE ON public.requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON public.appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blood_inventory_updated_at 
    BEFORE UPDATE ON public.blood_inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plasma_inventory_updated_at 
    BEFORE UPDATE ON public.plasma_inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at 
    BEFORE UPDATE ON public.donations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blockchain_ledger_updated_at 
    BEFORE UPDATE ON public.blockchain_ledger 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================================
-- 13. ROW LEVEL SECURITY (RLS)
-- ===============================================================

-- Enable RLS for all tables
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plasma_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_ledger ENABLE ROW LEVEL SECURITY;

-- ===============================================================
-- 14. RLS POLICIES
-- ===============================================================

-- Hospitals policies
CREATE POLICY "hospitals_select_all" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "hospitals_insert_authenticated" ON public.hospitals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "hospitals_update_own" ON public.hospitals FOR UPDATE USING (auth.uid() = id);

-- Donors policies
CREATE POLICY "donors_select_own" ON public.donors FOR SELECT USING (auth.uid() = id);
CREATE POLICY "donors_update_own" ON public.donors FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "donors_insert_own" ON public.donors FOR INSERT WITH CHECK (auth.uid() = id);

-- Requests policies
CREATE POLICY "requests_select_all" ON public.requests FOR SELECT USING (true);
CREATE POLICY "requests_insert_authenticated" ON public.requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "requests_update_own" ON public.requests FOR UPDATE USING (auth.uid() = hospital_id OR auth.uid() = donor_id);

-- Appointments policies
CREATE POLICY "appointments_select_own" ON public.appointments FOR SELECT USING (auth.uid() = hospital_id OR auth.uid() = donor_id);
CREATE POLICY "appointments_insert_authenticated" ON public.appointments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "appointments_update_own" ON public.appointments FOR UPDATE USING (auth.uid() = hospital_id OR auth.uid() = donor_id);

-- Blood inventory policies
CREATE POLICY "blood_inventory_select_hospital" ON public.blood_inventory FOR SELECT USING (auth.uid() = hospital_id);
CREATE POLICY "blood_inventory_insert_hospital" ON public.blood_inventory FOR INSERT WITH CHECK (auth.uid() = hospital_id);
CREATE POLICY "blood_inventory_update_hospital" ON public.blood_inventory FOR UPDATE USING (auth.uid() = hospital_id);

-- Plasma inventory policies
CREATE POLICY "plasma_inventory_select_hospital" ON public.plasma_inventory FOR SELECT USING (auth.uid() = hospital_id);
CREATE POLICY "plasma_inventory_insert_hospital" ON public.plasma_inventory FOR INSERT WITH CHECK (auth.uid() = hospital_id);
CREATE POLICY "plasma_inventory_update_hospital" ON public.plasma_inventory FOR UPDATE USING (auth.uid() = hospital_id);

-- Donations policies
CREATE POLICY "donations_select_own" ON public.donations FOR SELECT USING (auth.uid() = donor_id OR auth.uid() = hospital_id);
CREATE POLICY "donations_insert_authenticated" ON public.donations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "donations_update_own" ON public.donations FOR UPDATE USING (auth.uid() = donor_id OR auth.uid() = hospital_id);

-- Blockchain ledger policies
CREATE POLICY "blockchain_ledger_select_own" ON public.blockchain_ledger FOR SELECT USING (auth.uid() = donor_id OR auth.uid() = hospital_id);
CREATE POLICY "blockchain_ledger_insert_authenticated" ON public.blockchain_ledger FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===============================================================
-- 15. SAMPLE DATA (OPTIONAL)
-- ===============================================================

-- Insert sample hospitals
INSERT INTO public.hospitals (name, email, phone, address, city, state, pincode, registration_number, is_verified) VALUES
('City General Hospital', 'contact@citygeneral.com', '+1-555-0123', '123 Medical Center Dr', 'New York', 'NY', '10001', 'HOSP001', true),
('Memorial Medical Center', 'info@memorialmed.com', '+1-555-0456', '456 Health Plaza', 'Los Angeles', 'CA', '90210', 'HOSP002', true),
('St. Mary''s Hospital', 'admin@stmarys.com', '+1-555-0789', '789 Care Avenue', 'Chicago', 'IL', '60601', 'HOSP003', true);

-- Insert sample donors
INSERT INTO public.donors (name, email, phone, blood_group, age, gender, location, is_available, is_verified) VALUES
('John Smith', 'john.smith@email.com', '+1-555-1001', 'O+', 28, 'Male', 'New York, NY', true, true),
('Sarah Johnson', 'sarah.johnson@email.com', '+1-555-1002', 'A+', 32, 'Female', 'Los Angeles, CA', true, true),
('Mike Davis', 'mike.davis@email.com', '+1-555-1003', 'B+', 25, 'Male', 'Chicago, IL', true, true),
('Emily Wilson', 'emily.wilson@email.com', '+1-555-1004', 'AB+', 29, 'Female', 'New York, NY', true, true);

-- ===============================================================
-- ✅ MIGRATION COMPLETE
-- ===============================================================
-- This schema includes:
-- 1. All required tables with proper data types
-- 2. UUID primary keys with gen_random_uuid()
-- 3. Foreign key relationships with CASCADE/SET NULL
-- 4. Update triggers for all tables
-- 5. Performance indexes
-- 6. Row Level Security policies
-- 7. Sample data for testing
-- ===============================================================