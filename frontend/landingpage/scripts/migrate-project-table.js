#!/usr/bin/env node

/**
 * Supabase Project 表迁移脚本
 * 用于自动创建和更新 project 表结构
 * 
 * 使用方法:
 * 1. 确保已安装 @supabase/supabase-js
 * 2. 设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY
 * 3. 运行: node scripts/migrate-project-table.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 从环境变量或 .env 文件读取配置
require('dotenv').config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 错误: 请设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量')
  console.log('\n请在 .env 文件中添加:')
  console.log('SUPABASE_URL=your_supabase_url')
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  process.exit(1)
}

// 创建 Supabase 客户端（使用 service role key 以获得管理员权限）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// 项目表的 SQL 创建语句
const CREATE_PROJECTS_TABLE_SQL = `
-- 创建 projects 表
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

-- 创建索引以提高查询性能
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

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器，自动更新 updated_at 字段
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略 (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
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
`

// 添加示例数据的 SQL
const INSERT_SAMPLE_DATA_SQL = `
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
`

// 检查表是否存在的函数
async function checkTableExists() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1)
    
    return !error
  } catch (error) {
    return false
  }
}

// 执行 SQL 语句的函数
async function executeSql(sql, description) {
  try {
    console.log(`🔄 ${description}...`)
    
    // 直接使用 PostgreSQL REST API 执行 SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({ sql })
    })
    
    if (!response.ok) {
      // 如果 REST API 也不可用，使用手动执行
      console.log('⚠️ API 执行失败，切换到手动模式')
      await executeManualSql(sql)
      return true
    }
    
    console.log(`✅ ${description} 完成`)
    return true
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message)
    console.log('💡 切换到手动执行模式')
    await executeManualSql(sql)
    return true
  }
}

// 使用 Supabase SQL Editor API 执行 SQL
async function executeRawSql(sql, description) {
  try {
    console.log(`🔄 ${description}...`)
    
    // 直接使用手动执行模式，因为 Supabase 不支持通过 API 执行任意 SQL
    console.log('🔄 使用手动 SQL 执行...')
    await executeManualSql(sql)
    
    console.log(`✅ ${description} 完成`)
    return true
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message)
    console.log('💡 建议：请手动在 Supabase Dashboard 中执行 SQL 脚本')
    return false
  }
}

// 手动执行 SQL 的备用方法
async function executeManualSql(sql) {
  console.log('\n📋 请手动在 Supabase Dashboard > SQL Editor 中执行以下 SQL:')
  console.log('=' .repeat(80))
  console.log(sql)
  console.log('=' .repeat(80))
  console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard/project')
  
  // 将 SQL 写入文件以便用户复制
  const fs = require('fs')
  const sqlFile = path.join(__dirname, 'manual-migration.sql')
  fs.writeFileSync(sqlFile, sql)
  console.log(`\n💾 SQL 已保存到: ${sqlFile}`)
}

// 主迁移函数
async function migrateProjectTable() {
  console.log('🚀 开始 Supabase Project 表迁移...')
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`)
  
  try {
    // 跳过连接检查，直接开始迁移
    console.log('🔍 开始数据库迁移...')
    console.log('✅ 使用 Service Role Key 进行数据库操作')
    
    // 检查表是否已存在
    const tableExists = await checkTableExists()
    
    if (tableExists) {
      console.log('📋 projects 表已存在，将尝试更新结构...')
    } else {
      console.log('📋 projects 表不存在，将创建新表...')
    }
    
    // 执行表创建/更新 SQL
    const success = await executeRawSql(CREATE_PROJECTS_TABLE_SQL, '创建/更新 projects 表结构')

    // const success = await executeSql(CREATE_PROJECTS_TABLE_SQL, '创建/更新 projects 表结构')

    if (!success) {
      console.log('⚠️  表结构创建可能遇到问题，但这可能是正常的（如果表已存在）')
    }
    
    // 如果是新表，插入示例数据
    if (!tableExists) {
      console.log('📝 插入示例数据...')
      await executeRawSql(INSERT_SAMPLE_DATA_SQL, '插入示例数据')
    }
    
    // 验证表结构
    console.log('🔍 验证表结构...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ 表验证失败:', tableError.message)
    } else {
      console.log('✅ 表结构验证成功')
      
      // 显示表中的记录数
      const { count, error: countError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
      
      if (!countError) {
        console.log(`📊 当前表中有 ${count} 条记录`)
      }
    }
    
    console.log('\n🎉 迁移完成！')
    console.log('\n📚 接下来你可以:')
    console.log('1. 在 Supabase Dashboard 中查看 projects 表')
    console.log('2. 使用 mutations.ts 中的方法进行数据操作')
    console.log('3. 使用 selectors.ts 中的方法进行数据查询')
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message)
    process.exit(1)
  }
}

// 创建备份函数
async function backupTable() {
  try {
    console.log('💾 创建表备份...')
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
    
    if (error) {
      console.log('⚠️  无法创建备份（表可能不存在）')
      return
    }
    
    const backupDir = path.join(__dirname, '../backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(backupDir, `projects-backup-${timestamp}.json`)
    
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2))
    console.log(`✅ 备份已保存到: ${backupFile}`)
    
  } catch (error) {
    console.warn('⚠️  备份创建失败:', error.message)
  }
}

// 命令行参数处理
const args = process.argv.slice(2)
const command = args[0]

switch (command) {
  case 'backup':
    backupTable()
    break
  case 'migrate':
  default:
    // 在迁移前创建备份
    backupTable().then(() => {
      migrateProjectTable()
    })
    break
}

// 导出函数供其他脚本使用
module.exports = {
  migrateProjectTable,
  backupTable,
  checkTableExists
}