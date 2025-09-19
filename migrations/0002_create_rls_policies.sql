-- Enable Row Level Security on all sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE curated_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user company
CREATE OR REPLACE FUNCTION get_user_company(user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view all users" ON users
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Companies table policies
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (id = get_user_company(auth.uid()));

CREATE POLICY "Users can update their own company" ON companies
  FOR UPDATE USING (id = get_user_company(auth.uid()));

CREATE POLICY "Admins can view all companies" ON companies
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can create companies" ON companies
  FOR INSERT WITH CHECK (true);

-- Supplier profiles table policies
CREATE POLICY "Suppliers can view their own profile" ON supplier_profiles
  FOR SELECT USING (company_id = get_user_company(auth.uid()) AND get_user_role(auth.uid()) = 'supplier');

CREATE POLICY "Suppliers can update their own profile" ON supplier_profiles
  FOR UPDATE USING (company_id = get_user_company(auth.uid()) AND get_user_role(auth.uid()) = 'supplier');

CREATE POLICY "Suppliers can create their profile" ON supplier_profiles
  FOR INSERT WITH CHECK (company_id = get_user_company(auth.uid()) AND get_user_role(auth.uid()) = 'supplier');

CREATE POLICY "Admins can view all supplier profiles" ON supplier_profiles
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- RFQs table policies
CREATE POLICY "Buyers can view their own RFQs" ON rfqs
  FOR SELECT USING (buyer_id = auth.uid() AND get_user_role(auth.uid()) = 'buyer');

CREATE POLICY "Buyers can create RFQs" ON rfqs
  FOR INSERT WITH CHECK (buyer_id = auth.uid() AND get_user_role(auth.uid()) = 'buyer');

CREATE POLICY "Buyers can update their own RFQs" ON rfqs
  FOR UPDATE USING (buyer_id = auth.uid() AND get_user_role(auth.uid()) = 'buyer');

CREATE POLICY "Suppliers can view invited RFQs" ON rfqs
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'supplier' AND
    id IN (
      SELECT rfq_id FROM supplier_invites 
      WHERE supplier_id = auth.uid() AND status = 'invited'
    )
  );

CREATE POLICY "Admins can view all RFQs" ON rfqs
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- RFQ items table policies
CREATE POLICY "Buyers can view their own RFQ items" ON rfq_items
  FOR SELECT USING (
    rfq_id IN (SELECT id FROM rfqs WHERE buyer_id = auth.uid()) AND
    get_user_role(auth.uid()) = 'buyer'
  );

CREATE POLICY "Suppliers can view invited RFQ items" ON rfq_items
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'supplier' AND
    rfq_id IN (
      SELECT rfq_id FROM supplier_invites 
      WHERE supplier_id = auth.uid() AND status = 'invited'
    )
  );

CREATE POLICY "Admins can view all RFQ items" ON rfq_items
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Supplier invites table policies
CREATE POLICY "Suppliers can view their invites" ON supplier_invites
  FOR SELECT USING (supplier_id = auth.uid() AND get_user_role(auth.uid()) = 'supplier');

CREATE POLICY "Suppliers can update their invite status" ON supplier_invites
  FOR UPDATE USING (supplier_id = auth.uid() AND get_user_role(auth.uid()) = 'supplier');

CREATE POLICY "Admins can manage all invites" ON supplier_invites
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Quotes table policies
CREATE POLICY "Suppliers can view their own quotes" ON quotes
  FOR SELECT USING (supplier_id = auth.uid() AND get_user_role(auth.uid()) = 'supplier');

CREATE POLICY "Suppliers can create quotes for invited RFQs" ON quotes
  FOR INSERT WITH CHECK (
    supplier_id = auth.uid() AND 
    get_user_role(auth.uid()) = 'supplier' AND
    rfq_id IN (
      SELECT rfq_id FROM supplier_invites 
      WHERE supplier_id = auth.uid() AND status = 'invited'
    )
  );

CREATE POLICY "Suppliers can update their own quotes" ON quotes
  FOR UPDATE USING (supplier_id = auth.uid() AND get_user_role(auth.uid()) = 'supplier');

CREATE POLICY "Admins can view all quotes" ON quotes
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Curated offers table policies
CREATE POLICY "Buyers can view offers for their RFQs" ON curated_offers
  FOR SELECT USING (
    rfq_id IN (SELECT id FROM rfqs WHERE buyer_id = auth.uid()) AND
    get_user_role(auth.uid()) = 'buyer'
  );

CREATE POLICY "Admins can manage all offers" ON curated_offers
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Orders table policies
CREATE POLICY "Buyers can view their own orders" ON orders
  FOR SELECT USING (buyer_id = auth.uid() AND get_user_role(auth.uid()) = 'buyer');

CREATE POLICY "Suppliers can view their assigned orders" ON orders
  FOR SELECT USING (supplier_id = auth.uid() AND get_user_role(auth.uid()) = 'supplier');

CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Documents table policies
CREATE POLICY "Users can view their own company documents" ON documents
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Users can upload documents for their company" ON documents
  FOR INSERT WITH CHECK (company_id = get_user_company(auth.uid()));

CREATE POLICY "Suppliers can view documents for invited RFQs" ON documents
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'supplier' AND
    company_id IN (
      SELECT buyer_company.id FROM companies buyer_company
      JOIN users buyer_user ON buyer_company.id = buyer_user.company_id
      JOIN rfqs ON buyer_user.id = rfqs.buyer_id
      JOIN supplier_invites ON rfqs.id = supplier_invites.rfq_id
      WHERE supplier_invites.supplier_id = auth.uid() AND supplier_invites.status = 'invited'
    )
  );

CREATE POLICY "Admins can view all documents" ON documents
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Payouts table policies
CREATE POLICY "Suppliers can view their own payouts" ON payouts
  FOR SELECT USING (supplier_id = auth.uid() AND get_user_role(auth.uid()) = 'supplier');

CREATE POLICY "Admins can manage all payouts" ON payouts
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- SKUs table - public read access (no RLS needed)
-- Tickets, audit_logs, production_updates, inspections - admin only for now

-- Grant necessary permissions
GRANT SELECT ON skus TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON companies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON supplier_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON rfqs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON rfq_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON supplier_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE ON quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON curated_offers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payouts TO authenticated;
