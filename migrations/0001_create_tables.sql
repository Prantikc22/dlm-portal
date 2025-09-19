-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_role AS ENUM ('buyer', 'supplier', 'admin');
CREATE TYPE rfq_status AS ENUM (
  'draft', 'submitted', 'under_review', 'invited', 'offers_published',
  'accepted', 'in_production', 'inspection', 'shipped', 'delivered', 'closed', 'cancelled'
);
CREATE TYPE supplier_verification AS ENUM ('unverified', 'bronze', 'silver', 'gold');
CREATE TYPE invite_status AS ENUM ('invited', 'responded', 'declined');
CREATE TYPE quote_status AS ENUM ('draft', 'submitted', 'accepted', 'rejected');
CREATE TYPE order_status AS ENUM (
  'created', 'deposit_paid', 'production', 'inspection', 'shipped', 'delivered', 'closed', 'cancelled'
);
CREATE TYPE payout_status AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE inspection_status AS ENUM ('pass', 'fail');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved');

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'buyer',
  name TEXT,
  company_id UUID REFERENCES companies(id),
  phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  gstin TEXT,
  pan TEXT,
  address JSONB,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  documents JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supplier_profiles table
CREATE TABLE supplier_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  capabilities JSONB,
  machines JSONB,
  moq_default INTEGER,
  capacity_calendar JSONB,
  certifications JSONB,
  verified_status supplier_verification DEFAULT 'unverified',
  bank_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skus table
CREATE TABLE skus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  industry TEXT NOT NULL,
  process_name TEXT NOT NULL,
  description TEXT,
  default_moq INTEGER,
  default_lead_time_days INTEGER,
  parameters_schema JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rfqs table
CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_number TEXT UNIQUE NOT NULL,
  buyer_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  status rfq_status DEFAULT 'draft',
  details JSONB NOT NULL,
  files JSONB,
  nda_required BOOLEAN DEFAULT false,
  confidential BOOLEAN DEFAULT false,
  budget_range JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rfq_items table
CREATE TABLE rfq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID REFERENCES rfqs(id) NOT NULL,
  item_ref TEXT NOT NULL,
  sku_code TEXT REFERENCES skus(code) NOT NULL,
  item_details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supplier_invites table
CREATE TABLE supplier_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID REFERENCES rfqs(id) NOT NULL,
  supplier_id UUID REFERENCES users(id) NOT NULL,
  invited_by UUID REFERENCES users(id) NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status invite_status DEFAULT 'invited',
  response_deadline TIMESTAMP WITH TIME ZONE
);

-- Create quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID REFERENCES rfqs(id) NOT NULL,
  supplier_id UUID REFERENCES users(id) NOT NULL,
  quote_json JSONB NOT NULL,
  status quote_status DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create curated_offers table
CREATE TABLE curated_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID REFERENCES rfqs(id) NOT NULL,
  admin_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  details JSONB NOT NULL,
  total_price NUMERIC(12, 2),
  supplier_indicators JSONB,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  rfq_id UUID REFERENCES rfqs(id) NOT NULL,
  curated_offer_id UUID REFERENCES curated_offers(id),
  buyer_id UUID REFERENCES users(id) NOT NULL,
  admin_id UUID REFERENCES users(id),
  supplier_id UUID REFERENCES users(id),
  status order_status DEFAULT 'created',
  deposit_percent INTEGER DEFAULT 30,
  deposit_paid BOOLEAN DEFAULT false,
  total_amount NUMERIC(12, 2),
  escrow_tx_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create production_updates table
CREATE TABLE production_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  stage TEXT NOT NULL,
  detail TEXT,
  updated_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inspections table
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  inspector_id UUID REFERENCES users(id),
  report_ref TEXT,
  status inspection_status,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payouts table
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  supplier_id UUID REFERENCES users(id) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  fees NUMERIC(12, 2),
  status payout_status DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  doc_type TEXT NOT NULL,
  file_ref TEXT NOT NULL,
  metadata JSONB,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  subject TEXT NOT NULL,
  status ticket_status DEFAULT 'open',
  messages JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_rfqs_buyer_id ON rfqs(buyer_id);
CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_rfq_number ON rfqs(rfq_number);
CREATE INDEX idx_quotes_rfq_id ON quotes(rfq_id);
CREATE INDEX idx_quotes_supplier_id ON quotes(supplier_id);
CREATE INDEX idx_supplier_invites_rfq_id ON supplier_invites(rfq_id);
CREATE INDEX idx_supplier_invites_supplier_id ON supplier_invites(supplier_id);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_supplier_id ON orders(supplier_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- GIN indexes for JSONB fields
CREATE INDEX idx_supplier_profiles_capabilities ON supplier_profiles USING GIN (capabilities);
CREATE INDEX idx_skus_parameters_schema ON skus USING GIN (parameters_schema);
CREATE INDEX idx_rfqs_details ON rfqs USING GIN (details);

-- Add foreign key constraint for users.company_id (deferred because companies table needed to exist first)
ALTER TABLE users ADD CONSTRAINT fk_users_company_id FOREIGN KEY (company_id) REFERENCES companies(id);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_profiles_updated_at BEFORE UPDATE ON supplier_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skus_updated_at BEFORE UPDATE ON skus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfqs_updated_at BEFORE UPDATE ON rfqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
