
-- 插入示例数据（仅在表为空时插入）
INSERT INTO public.projects (
    name, 
    resources, 
    start_date, 
    end_date, 
    affiliates_users, 
    usdc_balance, 
    contract_id, 
    created_by
)
SELECT 
    '示例项目 - ' || generate_series,
    ARRAY['https://example.com/resource1.pdf', 'https://example.com/resource2.jpg'],
    NOW() + (generate_series || ' days')::interval,
    NOW() + ((generate_series + 30) || ' days')::interval,
    ARRAY['user1', 'user2'],
    1000.50 + (generate_series * 100),
    'contract_' || generate_series,
    gen_random_uuid()
FROM generate_series(1, 5)
WHERE NOT EXISTS (SELECT 1 FROM public.projects LIMIT 1);
