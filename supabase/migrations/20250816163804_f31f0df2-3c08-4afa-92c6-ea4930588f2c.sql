-- Insert seed data for Prima Finance Assistant with conflict handling

-- Insert company
INSERT INTO public.companies (id, name) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Prima Finance Demo')
ON CONFLICT (id) DO NOTHING;

-- Insert business units
INSERT INTO public.business_units (id, name, company_id) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Italy Operations', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440002', 'UK Operations', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440003', 'Spain Operations', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (id) DO NOTHING;

-- Insert dimension accounts
INSERT INTO public.dim_accounts (id, code, name, type) VALUES 
('550e8400-e29b-41d4-a716-446655440004', 'REV001', 'Revenue', 'Revenue'),
('550e8400-e29b-41d4-a716-446655440005', 'COGS001', 'Cost of Goods Sold', 'COGS'),
('550e8400-e29b-41d4-a716-446655440006', 'OPEX001', 'Operating Expenses', 'Opex'),
('550e8400-e29b-41d4-a716-446655440007', 'EBITDA001', 'EBITDA', 'EBITDA'),
('550e8400-e29b-41d4-a716-446655440008', 'GWP001', 'Gross Written Premium', 'GWP'),
('550e8400-e29b-41d4-a716-446655440009', 'LR001', 'Loss Ratio', 'LR'),
('550e8400-e29b-41d4-a716-446655440010', 'CONT001', 'Contracts', 'Contracts'),
('550e8400-e29b-41d4-a716-446655440011', 'CONV001', 'Conversion Rate', 'Conversion'),
('550e8400-e29b-41d4-a716-446655440012', 'RET001', 'Retention Rate', 'Retention')
ON CONFLICT (code) DO NOTHING;

-- Insert dimension products, channels, and markets
INSERT INTO public.dim_products (id, name) VALUES 
('550e8400-e29b-41d4-a716-446655440013', 'Product A'),
('550e8400-e29b-41d4-a716-446655440014', 'Product B'),
('550e8400-e29b-41d4-a716-446655440015', 'Product C')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.dim_channels (id, name) VALUES 
('550e8400-e29b-41d4-a716-446655440016', 'Direct'),
('550e8400-e29b-41d4-a716-446655440017', 'Partner'),
('550e8400-e29b-41d4-a716-446655440018', 'Digital')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.dim_markets (id, country) VALUES 
('550e8400-e29b-41d4-a716-446655440019', 'Italy'),
('550e8400-e29b-41d4-a716-446655440020', 'UK'),
('550e8400-e29b-41d4-a716-446655440021', 'Spain')
ON CONFLICT (id) DO NOTHING;

-- Insert calendar data for 12 months (2024)
INSERT INTO public.calendar (id, year, month, period_key) VALUES 
('550e8400-e29b-41d4-a716-446655440022', 2024, 1, '2024-01'),
('550e8400-e29b-41d4-a716-446655440023', 2024, 2, '2024-02'),
('550e8400-e29b-41d4-a716-446655440024', 2024, 3, '2024-03'),
('550e8400-e29b-41d4-a716-446655440025', 2024, 4, '2024-04'),
('550e8400-e29b-41d4-a716-446655440026', 2024, 5, '2024-05'),
('550e8400-e29b-41d4-a716-446655440027', 2024, 6, '2024-06'),
('550e8400-e29b-41d4-a716-446655440028', 2024, 7, '2024-07'),
('550e8400-e29b-41d4-a716-446655440029', 2024, 8, '2024-08'),
('550e8400-e29b-41d4-a716-446655440030', 2024, 9, '2024-09'),
('550e8400-e29b-41d4-a716-446655440031', 2024, 10, '2024-10'),
('550e8400-e29b-41d4-a716-446655440032', 2024, 11, '2024-11'),
('550e8400-e29b-41d4-a716-446655440033', 2024, 12, '2024-12')
ON CONFLICT (period_key) DO NOTHING;