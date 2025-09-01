import { createClient } from '@supabase/supabase-js'
import { Project, ProjectFilters, PaginationParams, ProjectsResponse, ApiResponse } from './types'

// 获取 Supabase 客户端
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

/**
 * 根据ID获取单个项目
 * @param projectId 项目ID
 * @returns 项目数据
 */
export async function getProjectById(projectId: string): Promise<ApiResponse<Project>> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('获取项目失败:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data as Project
    }
  } catch (error) {
    console.error('获取项目异常:', error)
    return {
      success: false,
      error: '获取项目时发生未知错误'
    }
  }
}

/**
 * 获取项目列表（带分页和过滤）
 * @param filters 过滤条件
 * @param pagination 分页参数
 * @param userId 用户ID（可选，用于获取用户自己的项目）
 * @returns 项目列表和分页信息
 */
export async function getProjects(
  filters: ProjectFilters = {},
  pagination: PaginationParams = {},
  userId?: string
): Promise<ApiResponse<ProjectsResponse>> {
  try {
    const supabase = getSupabaseClient()
    
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = pagination

    // 构建查询
    let query = supabase.from('projects').select('*', { count: 'exact' })

    // 应用过滤条件
    if (filters.name) {
      query = query.ilike('name', `%${filters.name}%`)
    }

    if (filters.startDate) {
      query = query.gte('start_date', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('end_date', filters.endDate)
    }

    if (filters.createdBy || userId) {
      query = query.eq('created_by', filters.createdBy || userId)
    }

    if (filters.usdcBalanceMin !== undefined) {
      query = query.gte('usdc_balance', filters.usdcBalanceMin)
    }

    if (filters.usdcBalanceMax !== undefined) {
      query = query.lte('usdc_balance', filters.usdcBalanceMax)
    }

    // 应用排序
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // 应用分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('获取项目列表失败:', error)
      return {
        success: false,
        error: error.message
      }
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    return {
      success: true,
      data: {
        data: data as Project[],
        total: count || 0,
        page,
        pageSize,
        totalPages
      }
    }
  } catch (error) {
    console.error('获取项目列表异常:', error)
    return {
      success: false,
      error: '获取项目列表时发生未知错误'
    }
  }
}

/**
 * 获取用户创建的项目列表
 * @param userId 用户ID
 * @param pagination 分页参数
 * @returns 用户项目列表
 */
export async function getUserProjects(
  userId: string,
  pagination: PaginationParams = {}
): Promise<ApiResponse<ProjectsResponse>> {
  return getProjects({}, pagination, userId)
}

/**
 * 获取用户参与的分销项目列表
 * @param userId 用户ID
 * @param pagination 分页参数
 * @returns 用户参与的项目列表
 */
export async function getUserAffiliateProjects(
  userId: string,
  pagination: PaginationParams = {}
): Promise<ApiResponse<ProjectsResponse>> {
  try {
    const supabase = getSupabaseClient()
    
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination

    // 查询包含用户ID的分销项目
    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .contains('affiliatesUsers', [userId])

    // 应用排序
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // 应用分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('获取用户分销项目失败:', error)
      return {
        success: false,
        error: error.message
      }
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    return {
      success: true,
      data: {
        data: data as Project[],
        total: count || 0,
        page,
        pageSize,
        totalPages
      }
    }
  } catch (error) {
    console.error('获取用户分销项目异常:', error)
    return {
      success: false,
      error: '获取用户分销项目时发生未知错误'
    }
  }
}

/**
 * 搜索项目（全文搜索）
 * @param searchTerm 搜索关键词
 * @param pagination 分页参数
 * @param userId 用户ID（可选，限制搜索范围）
 * @returns 搜索结果
 */
export async function searchProjects(
  searchTerm: string,
  pagination: PaginationParams = {},
  userId?: string
): Promise<ApiResponse<ProjectsResponse>> {
  try {
    const supabase = getSupabaseClient()
    
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination

    // 构建搜索查询
    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${searchTerm}%,contractId.ilike.%${searchTerm}%`)

    // 如果指定了用户ID，只搜索该用户的项目
    if (userId) {
      query = query.eq('createdBy', userId)
    }

    // 应用排序
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // 应用分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('搜索项目失败:', error)
      return {
        success: false,
        error: error.message
      }
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    return {
      success: true,
      data: {
        data: data as Project[],
        total: count || 0,
        page,
        pageSize,
        totalPages
      }
    }
  } catch (error) {
    console.error('搜索项目异常:', error)
    return {
      success: false,
      error: '搜索项目时发生未知错误'
    }
  }
}

/**
 * 获取项目统计信息
 * @param userId 用户ID（可选，获取特定用户的统计）
 * @returns 统计信息
 */
export async function getProjectStats(userId?: string): Promise<ApiResponse<{
  totalProjects: number
  totalUsdcBalance: number
  activeProjects: number
  completedProjects: number
  upcomingProjects: number
}>> {
  try {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    // 构建基础查询
    let baseQuery = supabase.from('projects').select('*')
    if (userId) {
      baseQuery = baseQuery.eq('createdBy', userId)
    }

    const { data: allProjects, error } = await baseQuery

    if (error) {
      console.error('获取项目统计失败:', error)
      return {
        success: false,
        error: error.message
      }
    }

    const projects = allProjects as Project[]
    
    // 计算统计信息
    const totalProjects = projects.length
    const totalUsdcBalance = projects.reduce((sum, project) => sum + project.usdcBalance, 0)
    
    const activeProjects = projects.filter(
      project => project.startDate <= now && project.endDate >= now
    ).length
    
    const completedProjects = projects.filter(
      project => project.endDate < now
    ).length
    
    const upcomingProjects = projects.filter(
      project => project.startDate > now
    ).length

    return {
      success: true,
      data: {
        totalProjects,
        totalUsdcBalance,
        activeProjects,
        completedProjects,
        upcomingProjects
      }
    }
  } catch (error) {
    console.error('获取项目统计异常:', error)
    return {
      success: false,
      error: '获取项目统计时发生未知错误'
    }
  }
}

/**
 * 检查项目名称是否已存在
 * @param name 项目名称
 * @param excludeId 排除的项目ID（用于更新时检查）
 * @param userId 用户ID（可选，限制检查范围）
 * @returns 是否存在
 */
export async function checkProjectNameExists(
  name: string,
  excludeId?: string,
  userId?: string
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = getSupabaseClient()
    
    let query = supabase
      .from('projects')
      .select('id')
      .eq('name', name)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    if (userId) {
      query = query.eq('createdBy', userId)
    }

    const { data, error } = await query.limit(1)

    if (error) {
      console.error('检查项目名称失败:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data.length > 0
    }
  } catch (error) {
    console.error('检查项目名称异常:', error)
    return {
      success: false,
      error: '检查项目名称时发生未知错误'
    }
  }
}

/**
 * 获取即将到期的项目
 * @param days 提前天数（默认7天）
 * @param userId 用户ID（可选）
 * @returns 即将到期的项目列表
 */
export async function getExpiringProjects(
  days: number = 7,
  userId?: string
): Promise<ApiResponse<Project[]>> {
  try {
    const supabase = getSupabaseClient()
    
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    
    let query = supabase
      .from('projects')
      .select('*')
      .gte('endDate', now.toISOString())
      .lte('endDate', futureDate.toISOString())
      .order('endDate', { ascending: true })

    if (userId) {
      query = query.eq('createdBy', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('获取即将到期项目失败:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data as Project[]
    }
  } catch (error) {
    console.error('获取即将到期项目异常:', error)
    return {
      success: false,
      error: '获取即将到期项目时发生未知错误'
    }
  }
}