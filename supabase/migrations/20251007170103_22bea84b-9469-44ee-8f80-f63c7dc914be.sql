-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update bills RLS to allow customers to view their own bills
CREATE POLICY "Customers can view their own bills"
ON public.bills
FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
  OR auth.uid() = user_id
);

-- Update bill_items RLS for customer access
CREATE POLICY "Customers can view their bill items"
ON public.bill_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bills 
    WHERE bills.id = bill_items.bill_id 
    AND (
      bills.customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
      )
      OR bills.user_id = auth.uid()
    )
  )
);

-- Update payments RLS for customer access
CREATE POLICY "Customers can view their payments"
ON public.payments
FOR SELECT
USING (
  bill_id IN (
    SELECT id FROM bills 
    WHERE customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  )
  OR auth.uid() = user_id
);