// Project 表的 TypeScript 类型定义

export interface Project {
  id: string
  name: string
  resources: string[] // 存放上传文件的URL数组
  startDate: string // ISO 8601 日期格式
  endDate: string // ISO 8601 日期格式
  affiliatesUsers: string[] // 分销参与人的ID数组
  usdcBalance: number // 质押的USDC数量
  contractId: string // 分销合同链上对象ID
  createdAt: string // 创建时间
  updatedAt: string // 更新时间
  createdBy: string // 创建者ID
}

// 创建项目时的输入类型（不包含自动生成的字段）
export interface CreateProjectInput {
  name: string
  resources?: string[]
  startDate: string
  endDate: string
  affiliatesUsers?: string[]
  usdcBalance: number
  contractId: string
}

// 更新项目时的输入类型（所有字段都是可选的）
export interface UpdateProjectInput {
  name?: string
  resources?: string[]
  startDate?: string
  endDate?: string
  affiliatesUsers?: string[]
  usdcBalance?: number
  contractId?: string
}

// 项目查询过滤条件
export interface ProjectFilters {
  name?: string
  startDate?: string
  endDate?: string
  createdBy?: string
  usdcBalanceMin?: number
  usdcBalanceMax?: number
}

// 分页参数
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string // 支持数据库字段名（snake_case）和前端字段名（camelCase）
  sortOrder?: 'asc' | 'desc'
}

// 查询结果类型
export interface ProjectsResponse {
  data: Project[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// API 响应类型
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}