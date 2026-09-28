-- Create tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    phone TEXT,
    email TEXT,
    subscription_status TEXT DEFAULT 'trial',
    subscription_plan TEXT DEFAULT 'basico',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id),
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'garcom', 'cozinha')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tables
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    number INTEGER NOT NULL,
    status TEXT DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada', 'aguardando_fechamento')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    category_id UUID REFERENCES categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    table_id UUID REFERENCES tables(id),
    origin TEXT NOT NULL CHECK (origin IN ('garcom', 'cliente')),
    status TEXT NOT NULL DEFAULT 'criado' CHECK (status IN ('criado', 'enviado_para_cozinha', 'em_preparo', 'pronto', 'finalizado')),
    total_amount NUMERIC(10, 2) DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enviado_cozinha_at TIMESTAMP WITH TIME ZONE,
    pronto_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    observacao TEXT
);

-- Bills (fechamento de conta)
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    table_id UUID NOT NULL REFERENCES tables(id),
    total NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'paga')),
    forma_pagamento TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pago_at TIMESTAMP WITH TIME ZONE
);

-- RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Helper to get current tenant_id from JWT
CREATE OR REPLACE FUNCTION auth.tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

-- RLS Policies
CREATE POLICY "Tenant isolation for profiles" ON profiles FOR ALL USING (tenant_id = auth.tenant_id());
CREATE POLICY "Tenant isolation for tables" ON tables FOR ALL USING (tenant_id = auth.tenant_id());
CREATE POLICY "Tenant isolation for categories" ON categories FOR ALL USING (tenant_id = auth.tenant_id());
CREATE POLICY "Tenant isolation for products" ON products FOR ALL USING (tenant_id = auth.tenant_id());
CREATE POLICY "Tenant isolation for orders" ON orders FOR ALL USING (tenant_id = auth.tenant_id());
CREATE POLICY "Tenant isolation for order_items" ON order_items FOR ALL USING (tenant_id = auth.tenant_id());
CREATE POLICY "Tenant isolation for bills" ON bills FOR ALL USING (tenant_id = auth.tenant_id());

-- Allow public read on products and categories for the QR Code menu (client side)
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (origin = 'cliente');
CREATE POLICY "Public insert order_items" ON order_items FOR INSERT WITH CHECK (true);

-- Triggers for stock
CREATE OR REPLACE FUNCTION decrease_stock() RETURNS trigger AS $$
BEGIN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrease_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION decrease_stock();

-- Analytics Views
CREATE OR REPLACE VIEW top_products AS
SELECT
    product_id,
    SUM(quantity) as total_sold
FROM order_items
GROUP BY product_id
ORDER BY total_sold DESC;

CREATE OR REPLACE VIEW daily_revenue AS
SELECT
    DATE(created_at) as day,
    SUM(total_amount) as revenue
FROM orders
WHERE status = 'finalizado'
GROUP BY DATE(created_at);
