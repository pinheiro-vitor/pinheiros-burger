-- Add user_id to orders table to link orders to registered customers
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable RLS on orders (already enabled in previous migration, but ensuring)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Verify/Ensure "Any authenticated user can create orders" (guest or logged in)
-- Previous migration had: CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
-- That is sufficient for creation.

-- Index for faster lookup of user orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
