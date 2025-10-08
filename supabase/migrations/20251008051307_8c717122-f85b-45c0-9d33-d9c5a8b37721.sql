-- Add paid_amount column to bills table
ALTER TABLE public.bills ADD COLUMN paid_amount numeric NOT NULL DEFAULT 0;

-- Add reorder_level (minimum stock threshold) to products table
ALTER TABLE public.products ADD COLUMN reorder_level integer NOT NULL DEFAULT 10;

-- Function to update product stock when bill items are created
CREATE OR REPLACE FUNCTION public.update_product_stock_on_bill()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Decrease stock when bill item is added
    UPDATE public.products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Adjust stock based on quantity change
    UPDATE public.products
    SET stock = stock + OLD.quantity - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Restore stock when bill item is deleted
    UPDATE public.products
    SET stock = stock + OLD.quantity
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
END;
$$;

-- Create trigger to automatically update stock
CREATE TRIGGER bill_items_stock_update
AFTER INSERT OR UPDATE OR DELETE ON public.bill_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock_on_bill();

-- Function to update customer due when bill is created/updated
CREATE OR REPLACE FUNCTION public.update_customer_due_on_bill()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increase customer due by (total_amount - paid_amount)
    UPDATE public.customers
    SET total_due = total_due + (NEW.total_amount - NEW.paid_amount)
    WHERE id = NEW.customer_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Adjust customer due based on changes
    UPDATE public.customers
    SET total_due = total_due - (OLD.total_amount - OLD.paid_amount) + (NEW.total_amount - NEW.paid_amount)
    WHERE id = NEW.customer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease customer due when bill is deleted
    UPDATE public.customers
    SET total_due = total_due - (OLD.total_amount - OLD.paid_amount)
    WHERE id = OLD.customer_id;
    RETURN OLD;
  END IF;
END;
$$;

-- Create trigger to automatically update customer due
CREATE TRIGGER bills_customer_due_update
AFTER INSERT OR UPDATE OR DELETE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_due_on_bill();