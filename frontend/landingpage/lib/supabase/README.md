# Supabase Project 管理系统

这个目录包含了完整的 Supabase Project 表管理系统，包括类型定义、CRUD 操作、查询方法和数据库迁移脚本。

## 文件结构

```
lib/supabase/
├── types.ts          # TypeScript 类型定义
├── mutations.ts      # 增删改操作
├── selectors.ts      # 查询操作
└── README.md         # 使用说明

scripts/
├── create-project-table.sql    # SQL 创建脚本（推荐）
└── migrate-project-table.js     # Node.js 迁移脚本
```

## 快速开始

### 1. 环境变量配置

#### 创建环境变量文件

复制 `.env.local.example` 为 `.env.local`：
```bash
cp .env.local.example .env.local
```

#### 配置 Supabase 密钥

在 `.env.local` 文件中设置以下变量：

```env
# Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase 公开密钥（用于客户端）
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase 服务角色密钥（用于数据库迁移）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 获取 Supabase 密钥

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 Settings > API
4. 复制以下信息：
   - **URL**: 项目 URL
   - **anon public**: 公开密钥
   - **service_role**: 服务角色密钥（⚠️ 请妥善保管）

### 2. 数据库设置

#### 方法一：使用 SQL 脚本（推荐）

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制并执行 `scripts/create-project-table.sql` 中的内容

#### 方法二：使用 Node.js 脚本

1. 确保已配置环境变量
2. 运行迁移脚本：
```bash
pnpm run db:migrate
```

### 3. 使用 API

#### 创建项目

```typescript
import { createProject } from '@/lib/supabase/mutations'
import { CreateProjectInput } from '@/lib/supabase/types'

const projectData: CreateProjectInput = {
  name: '我的项目',
  resources: ['https://example.com/file1.pdf'],
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-12-31T23:59:59Z',
  affiliatesUsers: ['user1', 'user2'],
  usdcBalance: 1000.50,
  contractId: 'contract_123'
}

const result = await createProject(projectData, 'current_user_id')
if (result.success) {
  console.log('项目创建成功:', result.data)
} else {
  console.error('创建失败:', result.error)
}
```

#### 查询项目

```typescript
import { getProjects, getUserProjects } from '@/lib/supabase/selectors'
import { ProjectFilters, PaginationParams } from '@/lib/supabase/types'

// 获取所有项目（带分页）
const filters: ProjectFilters = {
  name: '搜索关键词',
  usdcBalanceMin: 100
}

const pagination: PaginationParams = {
  page: 1,
  pageSize: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc'
}

const result = await getProjects(filters, pagination)
if (result.success) {
  console.log('项目列表:', result.data.data)
  console.log('总数:', result.data.total)
}

// 获取用户自己的项目
const userProjects = await getUserProjects('user_id', pagination)
```

## 故障排除

### 常见错误及解决方案

#### 1. 连接失败错误

**错误信息**: `连接失败: Could not find the table 'public._health' in the schema cache`

**解决方案**:
1. 检查 `SUPABASE_URL` 是否正确
2. 检查 `SUPABASE_SERVICE_ROLE_KEY` 是否正确设置
3. 确保使用的是 **service_role** 密钥，不是 anon 密钥
4. 在 Supabase Dashboard 中验证项目状态

#### 2. 权限错误

**错误信息**: `权限不足` 或 `RLS policy violation`

**解决方案**:
1. 确保用户已登录
2. 检查 RLS 策略是否正确设置
3. 验证传入的 `userId` 是否正确

#### 3. 环境变量未找到

**错误信息**: `请设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量`

**解决方案**:
1. 创建 `.env.local` 文件
2. 设置正确的环境变量
3. 重启开发服务器

### 调试技巧

1. **检查环境变量**:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **验证 Supabase 连接**:
   - 在 Supabase Dashboard 中查看实时日志
   - 使用 API 测试工具验证连接

3. **检查表结构**:
   - 在 Supabase Dashboard 的 Table Editor 中查看表结构
   - 确认 RLS 策略已启用

## NPM 脚本命令

```bash
# 运行数据库迁移
pnpm run db:migrate

# 创建数据备份
pnpm run db:backup

# 显示设置说明
pnpm run db:setup
```

## 数据库表结构

### projects 表字段

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | UUID | 主键 | 自动生成 |
| name | VARCHAR(255) | 项目名称 | 非空 |
| resources | TEXT[] | 物料文件URL数组 | 默认空数组 |
| start_date | TIMESTAMPTZ | 开始日期 | 非空 |
| end_date | TIMESTAMPTZ | 结束日期 | 非空，必须大于开始日期 |
| affiliates_users | TEXT[] | 分销参与人ID数组 | 默认空数组 |
| usdc_balance | DECIMAL(20,6) | 质押USDC数量 | 默认0，非负数 |
| contract_id | VARCHAR(255) | 合同链上对象ID | 非空 |
| created_at | TIMESTAMPTZ | 创建时间 | 自动生成 |
| updated_at | TIMESTAMPTZ | 更新时间 | 自动更新 |
| created_by | UUID | 创建者ID | 非空 |

### 行级安全策略 (RLS)

- **查看权限**: 用户只能查看自己创建的项目或自己参与的分销项目
- **创建权限**: 用户可以创建项目（created_by 自动设置为当前用户）
- **更新权限**: 用户只能更新自己创建的项目
- **删除权限**: 用户只能删除自己创建的项目

## API 方法列表

### Mutations (mutations.ts)

- `createProject(projectData, userId)` - 创建项目
- `updateProject(projectId, updateData, userId)` - 更新项目
- `deleteProject(projectId, userId)` - 删除项目
- `batchDeleteProjects(projectIds, userId)` - 批量删除项目
- `addAffiliateUser(projectId, affiliateUserId, userId)` - 添加分销参与人
- `removeAffiliateUser(projectId, affiliateUserId, userId)` - 移除分销参与人

### Selectors (selectors.ts)

- `getProjectById(projectId)` - 根据ID获取项目
- `getProjects(filters, pagination, userId)` - 获取项目列表
- `getUserProjects(userId, pagination)` - 获取用户项目
- `getUserAffiliateProjects(userId, pagination)` - 获取用户参与的分销项目
- `searchProjects(searchTerm, pagination, userId)` - 搜索项目
- `getProjectStats(userId)` - 获取项目统计
- `checkProjectNameExists(name, excludeId, userId)` - 检查项目名称是否存在
- `getExpiringProjects(days, userId)` - 获取即将到期的项目

## 安全注意事项

1. **服务角色密钥安全**:
   - 永远不要在客户端代码中使用 service_role 密钥
   - 不要将 service_role 密钥提交到版本控制
   - 定期轮换密钥

2. **RLS 策略**:
   - 确保所有表都启用了 RLS
   - 定期审查和测试安全策略
   - 使用最小权限原则

3. **数据验证**:
   - 在客户端和服务端都进行数据验证
   - 使用 TypeScript 类型确保类型安全
   - 对用户输入进行清理和验证