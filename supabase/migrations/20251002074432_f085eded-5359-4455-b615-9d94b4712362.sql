-- Fix security warnings by setting search_path on all functions

-- Update generate_customer_id function
CREATE OR REPLACE FUNCTION public.generate_customer_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.customers
  WHERE user_id = auth.uid();
  
  RETURN 'CUST' || LPAD(next_num::TEXT, 3, '0');
END;
$$;

-- Update generate_product_id function
CREATE OR REPLACE FUNCTION public.generate_product_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(product_id FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.products
  WHERE user_id = auth.uid();
  
  RETURN 'PROD' || LPAD(next_num::TEXT, 3, '0');
END;
$$;

-- Update generate_supplier_id function
CREATE OR REPLACE FUNCTION public.generate_supplier_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(supplier_id FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.suppliers
  WHERE user_id = auth.uid();
  
  RETURN 'SUPP' || LPAD(next_num::TEXT, 3, '0');
END;
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;