-- Add delivery column to shop_data table
-- This column stores delivery partner information and weight-based pricing slabs

-- Add the delivery column if it doesn't exist
ALTER TABLE public.shop_data 
ADD COLUMN IF NOT EXISTS delivery JSONB DEFAULT NULL;

-- Add a comment to describe the column
COMMENT ON COLUMN public.shop_data.delivery IS 'Stores delivery partner name and pricing slabs as JSONB: {"partnerName": "string", "slabs": [{"weight": "1kg", "price": 50}]}';

-- Optional: Add an index for better query performance if needed
-- CREATE INDEX IF NOT EXISTS idx_shop_data_delivery ON public.shop_data USING GIN (delivery);

-- Example data structure:
-- {
--   "partnerName": "Blue Dart",
--   "slabs": [
--     {"weight": "0.5kg", "price": 40},
--     {"weight": "1kg", "price": 50},
--     {"weight": "2kg", "price": 80},
--     {"weight": "5kg", "price": 150}
--   ]
-- }
