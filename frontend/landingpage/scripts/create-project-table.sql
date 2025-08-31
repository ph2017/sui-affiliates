-- =====================================================
-- Supabase Project 表创建脚本
-- 请在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- =====================================================

-- 1. 创建 projects 表
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    resources TEXT[] DEFAULT '{}',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    affiliates_users TEXT[] DEFAULT '{}',
    usdc_balance DECIMAL(20, 6) DEFAULT 0,
    contract_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    -- 添加约束
    CONSTRAINT projects_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT projects_contract_id_not_empty CHECK (LENGTH(TRIM(contract_id)) > 0),
    CONSTRAINT projects_date_range_valid CHECK (end_date > start_date),
    CONSTRAINT projects_usdc_balance_positive CHECK (usdc_balance >= 0)
);

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_name ON public.projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_contract_id ON public.projects(contract_id);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON public.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON public.projects(end_date);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_usdc_balance ON public.projects(usdc_balance);

-- 为 affiliates_users 数组字段创建 GIN 索引以支持数组查询
CREATE INDEX IF NOT EXISTS idx_projects_affiliates_users ON public.projects USING GIN(affiliates_users);

-- 创建复合索引
CREATE INDEX IF NOT EXISTS idx_projects_created_by_created_at ON public.projects(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_date_range ON public.projects(start_date, end_date);

-- 3. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. 创建触发器，自动更新 updated_at 字段
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 启用行级安全策略 (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 6. 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view own projects or affiliate projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- 7. 创建 RLS 策略
-- 用户只能查看自己创建的项目或自己参与的分销项目
CREATE POLICY "Users can view own projects or affiliate projects" ON public.projects
    FOR SELECT USING (
        auth.uid() = created_by OR 
        auth.uid()::text = ANY(affiliates_users)
    );

-- 用户只能创建项目（created_by 会自动设置为当前用户）
CREATE POLICY "Users can create projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 用户只能更新自己创建的项目
CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = created_by);

-- 用户只能删除自己创建的项目
CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = created_by);

-- 8. 插入示例数据（可选 - 仅在开发环境中使用）
-- 取消注释以下代码来插入示例数据
/*
INSERT INTO public.projects (
    name, 
    resources, 
    start_date, 
    end_date, 
    affiliates_users, 
    usdc_balance, 
    contract_id, 
    created_by
) VALUES 
(
    '示例项目 1',
    ARRAY['https://example.com/resource1.pdf', 'https://example.com/image1.jpg'],
    NOW(),
    NOW() + INTERVAL '30 days',
    ARRAY['user1', 'user2'],
    1000.50,
    'contract_example_1',
    auth.uid()
),
(
    '示例项目 2',
    ARRAY['https://example.com/resource2.pdf'],
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '37 days',
    ARRAY['user3'],
    2500.75,
    'contract_example_2',
    auth.uid()
),
(
    '示例项目 3',
    ARRAY['https://example.com/resource3.pdf', 'https://example.com/video1.mp4', 'https://example.com/image2.png'],
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '44 days',
    ARRAY['user1', 'user4', 'user5'],
    5000.00,
    'contract_example_3',
    auth.uid()
);
*/

-- 9. 验证表创建
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. 显示创建的索引
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'projects' 
    AND schemaname = 'public';

-- =====================================================
-- 执行完成后，你应该看到：
-- 1. projects 表的列信息
-- 2. 创建的索引列表
-- 3. 如果没有错误，表示创建成功
-- =====================================================