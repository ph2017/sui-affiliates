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

### 1. 数据库设置

#### 方法一：使用 SQL 脚本（推荐）

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制并执行 `scripts/create-project-table.sql` 中的内容

#### 方法二：使用 Node.js 脚本

1. 安装依赖：
```bash
pnpm install dotenv
```

2. 设置环境变量（在 `.env` 文件中）：
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. 运行迁移脚本：
```bash
pnpm run db:migrate
```

### 2. 使用 API

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

#### 更新项目

```typescript
import { updateProject } from '@/lib/supabase/mutations'
import { UpdateProjectInput } from '@/lib/supabase/types'

const updateData: UpdateProjectInput = {
  name: '更新后的项目名称',
  usdcBalance: 2000.75
}

const result = await updateProject('project_id', updateData, 'user_id')
if (result.success) {
  console.log('更新成功:', result.data)
}
```

#### 删除项目

```typescript
import { deleteProject } from '@/lib/supabase/mutations'

const result = await deleteProject('project_id', 'user_id')
if (result.success) {
  console.log('删除成功')
}
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

### 索引

- `idx_projects_created_by`: 创建者索引
- `idx_projects_name`: 项目名称索引
- `idx_projects_contract_id`: 合同ID索引
- `idx_projects_start_date`: 开始日期索引
- `idx_projects_end_date`: 结束日期索引
- `idx_projects_affiliates_users`: 分销用户数组索引（GIN）
- `idx_projects_created_by_created_at`: 复合索引
- `idx_projects_date_range`: 日期范围索引

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

## NPM 脚本命令

```bash
# 运行数据库迁移
pnpm run db:migrate

# 创建数据备份
pnpm run db:backup

# 显示设置说明
pnpm run db:setup
```

## 环境变量

确保在 `.env` 文件中设置以下变量：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# 用于迁移脚本（可选）
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 注意事项

1. **权限控制**: 所有操作都基于用户权限，确保传入正确的 `userId`
2. **数据验证**: 所有输入数据都会进行基本验证
3. **错误处理**: 所有方法都返回统一的 `ApiResponse` 格式
4. **性能优化**: 已创建适当的索引以提高查询性能
5. **安全性**: 启用了 RLS 策略，确保数据安全

## 故障排除

### 常见问题

1. **连接失败**: 检查 Supabase URL 和 API Key 是否正确
2. **权限错误**: 确保用户已登录且有相应权限
3. **RLS 策略**: 如果查询返回空结果，检查 RLS 策略是否正确设置
4. **日期格式**: 确保日期使用 ISO 8601 格式

### 调试技巧

1. 在 Supabase Dashboard 中查看实时日志
2. 使用 `console.log` 输出错误信息
3. 检查网络请求和响应
4. 验证数据库表结构和索引

## 扩展功能

可以根据需要添加以下功能：

1. **文件上传**: 集成 Supabase Storage 处理文件上传
2. **实时更新**: 使用 Supabase Realtime 监听数据变化
3. **审计日志**: 记录所有数据变更操作
4. **数据导出**: 支持导出项目数据为 CSV/Excel
5. **批量操作**: 支持批量创建和更新项目