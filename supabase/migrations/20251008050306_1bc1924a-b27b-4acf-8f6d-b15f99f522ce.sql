-- Add balance tracking columns
ALTER TABLE public.customers 
ADD COLUMN total_due numeric DEFAULT 0 NOT NULL;

ALTER TABLE public.suppliers 
ADD COLUMN total_due numeric DEFAULT 0 NOT NULL;

-- Add purchase tracking table for supplier transactions
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  purchase_date timestamp with time zone DEFAULT now() NOT NULL,
  total_amount numeric NOT NULL,
  paid_amount numeric DEFAULT 0 NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for purchases
CREATE POLICY "Users can view their own purchases"
ON public.purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
ON public.purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases"
ON public.purchases FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchases"
ON public.purchases FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for purchases updated_at
CREATE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();