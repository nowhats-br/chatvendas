/*
          # [Feature] Sales Module - Database Schema
          This script creates the necessary tables to support a complete sales system within the application, including products, orders, and order items.

          ## Query Description: This operation is STRUCTURAL and SAFE. It adds new tables and does not modify or delete existing data.
          - Creates the `products` table for product management.
          - Creates the `orders` table to store sales information.
          - Creates the `order_items` table to detail the products within each sale.
          - Enables Row Level Security (RLS) on these tables to ensure data privacy.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (by dropping the tables)
          
          ## Structure Details:
          - New Table: `public.products`
          - New Table: `public.orders`
          - New Table: `public.order_items`
          
          ## Security Implications:
          - RLS Status: Enabled on all new tables.
          - Policy Changes: New policies are created for agents and admins to access sales data appropriately.
          - Auth Requirements: Access is restricted based on user roles ('admin', 'agent').
          
          ## Performance Impact:
          - Indexes: Adds indexes on foreign key columns (`contact_id`, `user_id`, `order_id`, `product_id`) to optimize query performance.
          - Triggers: No new triggers are added in this migration.
          - Estimated Impact: Low performance impact on existing operations.
          */

-- 1. Products Table
CREATE TABLE public.products (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    description text NULL,
    price numeric NOT NULL DEFAULT 0,
    stock_quantity integer NOT NULL DEFAULT 0,
    image_url text NULL,
    is_active boolean NOT NULL DEFAULT true,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT products_pkey PRIMARY KEY (id)
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin users to manage products" ON public.products FOR ALL TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');


-- 2. Orders Table
CREATE TABLE public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    contact_id uuid NOT NULL,
    user_id uuid NOT NULL,
    ticket_id uuid NULL,
    total_amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id),
    CONSTRAINT orders_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE SET NULL,
    CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'shipped'::text, 'completed'::text, 'cancelled'::text])))
);
CREATE INDEX idx_orders_contact_id ON public.orders USING btree (contact_id);
CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow agents to manage their own orders" ON public.orders FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Allow admin to view all orders" ON public.orders FOR SELECT TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');


-- 3. Order Items Table
CREATE TABLE public.order_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT order_items_pkey PRIMARY KEY (id),
    CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT
);
CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage items of their own orders" ON public.order_items FOR ALL TO authenticated 
USING (
  (EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid()))))
)
WITH CHECK (
  (EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid()))))
);
CREATE POLICY "Allow admin to view all order items" ON public.order_items FOR SELECT TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 4. Add sales_history to contacts table (as a placeholder, will be handled by relationships)
-- This is a logical addition, no schema change needed as we can query orders by contact_id.

-- 5. Create a function for 30-day follow-up reminders
-- This function will create a task for the agent who made the sale.
CREATE OR REPLACE FUNCTION public.create_follow_up_tasks()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.tasks (user_id, contact_id, title, due_date)
  SELECT
    o.user_id,
    o.contact_id,
    'Follow-up de 30 dias com ' || c.name,
    (now() + interval '1 day')::date
  FROM
    public.orders o
  JOIN
    public.contacts c ON o.contact_id = c.id
  WHERE
    o.created_at::date = (now() - interval '30 days')::date
    -- Ensure we don't create duplicate tasks
    AND NOT EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.contact_id = o.contact_id
        AND t.title LIKE 'Follow-up de 30 dias%'
        AND t.created_at > (now() - interval '5 days')
    );
END;
$$;

-- Note: To schedule the follow-up function automatically, you would run the following command
-- in the Supabase SQL editor. This requires the pg_cron extension to be enabled.
-- SELECT cron.schedule('thirty-day-followup-check', '0 8 * * *', 'SELECT public.create_follow_up_tasks()');
-- This schedules the check to run every day at 8:00 AM UTC.
