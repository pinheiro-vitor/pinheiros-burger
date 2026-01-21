-- Inventory Items (Raw Materials)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL, -- e.g. 'kg', 'g', 'l', 'un'
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_stock_alert NUMERIC DEFAULT 5,
  last_cost NUMERIC DEFAULT 0, -- Store the last paid unit price for valuation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Transactions (Stock In/Out History)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'purchase' (in), 'adjustment' (fix), 'usage' (out), 'loss' (out)
  quantity NUMERIC NOT NULL, -- Positive for IN, Negative for OUT usually handled by app logic, but let's store absolute and imply sign by type if needed, or just allow signed. Let's use signed logic in app, here just quantity.
  cost NUMERIC DEFAULT 0, -- Total cost involved in this transaction (e.g. Purchase Invoice Total for this item)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- General Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT, -- 'bills', 'maintenance', 'marketing', 'salary'
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policies (Admin Only for all)
CREATE POLICY "Admins can manage inventory items" ON public.inventory_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage inventory transactions" ON public.inventory_transactions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage expenses" ON public.expenses
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
