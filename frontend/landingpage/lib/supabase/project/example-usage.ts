/**
 * Supabase Project 管理系统使用示例
 * 
 * 这个文件展示了如何在实际项目中使用 project 表的 CRUD 操作
 */

import { 
  createProject, 
  updateProject, 
  deleteProject, 
  addAffiliateUser, 
  removeAffiliateUser 
} from './mutations'

import { 
  getProjectById, 
  getProjects, 
  getUserProjects, 
  searchProjects, 
  getProjectStats 
} from './selectors'

import { 
  CreateProjectInput, 
  UpdateProjectInput, 
  ProjectFilters, 
  PaginationParams 
} from './types'

// ============================================
// 示例 1: 创建新项目
// ============================================
export async function exampleCreateProject() {
  const projectData: CreateProjectInput = {
    name: 'SUI 生态推广项目',
    resources: [
      'https://example.com/project-banner.jpg',
      'https://example.com/project-whitepaper.pdf',
      'https://example.com/demo-video.mp4'
    ],
    startDate: '2024-02-01T00:00:00Z',
    endDate: '2024-05-31T23:59:59Z',
    affiliatesUsers: ['affiliate_user_1', 'affiliate_user_2'],
    usdcBalance: 5000.00,
    contractId: 'sui_contract_0x123456789abcdef'
  }

  const result = await createProject(projectData, 'current_user_id')
  
  if (result.success) {
    console.log('✅ 项目创建成功:', result.data)
    return result.data
  } else {
    console.error('❌ 项目创建失败:', result.error)
    throw new Error(result.error)
  }
}

// ============================================
// 示例 2: 获取项目列表（带分页和过滤）
// ============================================
export async function exampleGetProjectsList() {
  const filters: ProjectFilters = {
    name: 'SUI', // 搜索包含 "SUI" 的项目
    usdcBalanceMin: 1000, // 最小质押金额
    usdcBalanceMax: 10000, // 最大质押金额
    startDate: '2024-01-01T00:00:00Z' // 2024年开始的项目
  }

  const pagination: PaginationParams = {
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }

  const result = await getProjects(filters, pagination)
  
  if (result.success && result.data) {
    console.log('✅ 获取项目列表成功:')
    console.log(`总共 ${result.data.total} 个项目`)
    console.log(`当前第 ${result.data.page} 页，共 ${result.data.totalPages} 页`)
    
    result.data.data.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name} - USDC: ${project.usdcBalance}`)
    })
    
    return result.data
  } else {
    console.error('❌ 获取项目列表失败:', result.error)
    throw new Error(result.error)
  }
}

// ============================================
// 示例 3: 更新项目信息
// ============================================
export async function exampleUpdateProject(projectId: string) {
  const updateData: UpdateProjectInput = {
    name: '更新后的项目名称',
    usdcBalance: 7500.50,
    endDate: '2024-06-30T23:59:59Z', // 延长项目结束时间
    resources: [
      'https://example.com/updated-banner.jpg',
      'https://example.com/new-resource.pdf'
    ]
  }

  const result = await updateProject(projectId, updateData, 'current_user_id')
  
  if (result.success) {
    console.log('✅ 项目更新成功:', result.data)
    return result.data
  } else {
    console.error('❌ 项目更新失败:', result.error)
    throw new Error(result.error)
  }
}

// ============================================
// 示例 4: 管理分销参与人
// ============================================
export async function exampleManageAffiliates(projectId: string) {
  // 添加新的分销参与人
  const addResult = await addAffiliateUser(
    projectId, 
    'new_affiliate_user_id', 
    'current_user_id'
  )
  
  if (addResult.success) {
    console.log('✅ 成功添加分销参与人')
  }

  // 移除分销参与人
  const removeResult = await removeAffiliateUser(
    projectId, 
    'old_affiliate_user_id', 
    'current_user_id'
  )
  
  if (removeResult.success) {
    console.log('✅ 成功移除分销参与人')
  }
}

// ============================================
// 示例 5: 搜索项目
// ============================================
export async function exampleSearchProjects(searchTerm: string) {
  const pagination: PaginationParams = {
    page: 1,
    pageSize: 20,
    sortBy: 'name',
    sortOrder: 'asc'
  }

  const result = await searchProjects(searchTerm, pagination)
  
  if (result.success && result.data) {
    console.log(`🔍 搜索 "${searchTerm}" 找到 ${result.data.total} 个结果:`)
    
    result.data.data.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name}`)
      console.log(`   合同ID: ${project.contractId}`)
      console.log(`   USDC余额: ${project.usdcBalance}`)
      console.log(`   项目期间: ${project.startDate} ~ ${project.endDate}`)
      console.log('---')
    })
    
    return result.data
  } else {
    console.error('❌ 搜索失败:', result.error)
    throw new Error(result.error)
  }
}

// ============================================
// 示例 6: 获取用户项目统计
// ============================================
export async function exampleGetUserStats(userId: string) {
  const result = await getProjectStats(userId)
  
  if (result.success && result.data) {
    const stats = result.data
    console.log('📊 用户项目统计:')
    console.log(`总项目数: ${stats.totalProjects}`)
    console.log(`总USDC质押: ${stats.totalUsdcBalance}`)
    console.log(`进行中项目: ${stats.activeProjects}`)
    console.log(`已完成项目: ${stats.completedProjects}`)
    console.log(`即将开始项目: ${stats.upcomingProjects}`)
    
    return stats
  } else {
    console.error('❌ 获取统计失败:', result.error)
    throw new Error(result.error)
  }
}

// ============================================
// 示例 7: 获取用户自己的项目
// ============================================
export async function exampleGetUserProjects(userId: string) {
  const pagination: PaginationParams = {
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }

  const result = await getUserProjects(userId, pagination)
  
  if (result.success && result.data) {
    console.log(`👤 用户 ${userId} 的项目列表:`)
    
    result.data.data.forEach((project, index) => {
      const status = getProjectStatus(project.startDate, project.endDate)
      console.log(`${index + 1}. ${project.name} [${status}]`)
      console.log(`   分销参与人数: ${project.affiliatesUsers.length}`)
      console.log(`   物料数量: ${project.resources.length}`)
    })
    
    return result.data
  } else {
    console.error('❌ 获取用户项目失败:', result.error)
    throw new Error(result.error)
  }
}

// ============================================
// 示例 8: 删除项目
// ============================================
export async function exampleDeleteProject(projectId: string) {
  // 先获取项目信息确认
  const projectResult = await getProjectById(projectId)
  
  if (!projectResult.success) {
    console.error('❌ 项目不存在')
    return
  }

  console.log(`⚠️  即将删除项目: ${projectResult.data?.name}`)
  
  const result = await deleteProject(projectId, 'current_user_id')
  
  if (result.success) {
    console.log('✅ 项目删除成功')
  } else {
    console.error('❌ 项目删除失败:', result.error)
    throw new Error(result.error)
  }
}

// ============================================
// 辅助函数：获取项目状态
// ============================================
function getProjectStatus(startDate: string, endDate: string): string {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (now < start) {
    return '即将开始'
  } else if (now > end) {
    return '已结束'
  } else {
    return '进行中'
  }
}

// ============================================
// 完整的项目管理流程示例
// ============================================
export async function exampleCompleteWorkflow() {
  try {
    console.log('🚀 开始完整的项目管理流程演示...')
    
    // 1. 创建项目
    console.log('\n1️⃣ 创建新项目')
    const newProject = await exampleCreateProject()
    
    if (!newProject) {
      throw new Error('项目创建失败')
    }
    
    // 2. 获取项目详情
    console.log('\n2️⃣ 获取项目详情')
    const projectDetail = await getProjectById(newProject.id)
    if (projectDetail.success && projectDetail.data) {
      console.log('项目详情:', projectDetail.data.name)
    }
    
    // 3. 更新项目
    console.log('\n3️⃣ 更新项目信息')
    await exampleUpdateProject(newProject.id)
    
    // 4. 管理分销参与人
    console.log('\n4️⃣ 管理分销参与人')
    await exampleManageAffiliates(newProject.id)
    
    // 5. 获取项目列表
    console.log('\n5️⃣ 获取项目列表')
    await exampleGetProjectsList()
    
    // 6. 搜索项目
    console.log('\n6️⃣ 搜索项目')
    await exampleSearchProjects('SUI')
    
    // 7. 获取统计信息
    console.log('\n7️⃣ 获取统计信息')
    await exampleGetUserStats('current_user_id')
    
    console.log('\n🎉 完整流程演示完成！')
    
  } catch (error) {
    console.error('❌ 流程执行失败:', error)
  }
}

// ============================================
// React Hook 使用示例
// ============================================

/*
// 在 React 组件中使用的示例

import { useState, useEffect } from 'react'
import { Project, ProjectsResponse } from './types'
import { getProjects } from './selectors'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        const result = await getProjects()
        
        if (result.success) {
          setProjects(result.data.data)
          setError(null)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('获取项目列表失败')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return { projects, loading, error }
}

// 在组件中使用
function ProjectList() {
  const { projects, loading, error } = useProjects()

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error}</div>

  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>
          <h3>{project.name}</h3>
          <p>USDC余额: {project.usdcBalance}</p>
          <p>分销参与人: {project.affiliatesUsers.length}人</p>
        </div>
      ))}
    </div>
  )
}
*/