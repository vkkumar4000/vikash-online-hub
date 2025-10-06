-- Add missing fields to existing tables
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS gst_number TEXT;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS product_code TEXT,
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs',
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- Create bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  bill_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bill_items table
CREATE TABLE IF NOT EXISTS public.bill_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_credentials table for customer login
CREATE TABLE IF NOT EXISTS public.customer_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bills
CREATE POLICY "Users can view their own bills"
  ON public.bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bills"
  ON public.bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills"
  ON public.bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills"
  ON public.bills FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for bill_items
CREATE POLICY "Users can view bill items of their bills"
  ON public.bill_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bills
    WHERE bills.id = bill_items.bill_id
    AND bills.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert bill items for their bills"
  ON public.bill_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bills
    WHERE bills.id = bill_items.bill_id
    AND bills.user_id = auth.uid()
  ));

CREATE POLICY "Users can update bill items of their bills"
  ON public.bill_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.bills
    WHERE bills.id = bill_items.bill_id
    AND bills.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete bill items of their bills"
  ON public.bill_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.bills
    WHERE bills.id = bill_items.bill_id
    AND bills.user_id = auth.uid()
  ));

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments"
  ON public.payments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for customer_credentials (admin only)
CREATE POLICY "Users can manage customer credentials"
  ON public.customer_credentials FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = customer_credentials.customer_id
    AND customers.user_id = auth.uid()
  ));

-- Function to generate bill number
CREATE OR REPLACE FUNCTION public.generate_bill_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(bill_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.bills
  WHERE user_id = auth.uid();
  
  RETURN 'BILL-' || LPAD(next_num::TEXT, 4, '0');
END;
$$;

-- Trigger for updating updated_at on bills
CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at on customer_credentials
CREATE TRIGGER update_customer_credentials_updated_at
  BEFORE UPDATE ON public.customer_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON public.bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON public.bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON public.bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON public.payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_credentials_username ON public.customer_credentials(username);