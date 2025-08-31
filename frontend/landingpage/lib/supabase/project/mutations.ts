import { createClient } from '@supabase/supabase-js'
import { CreateProjectInput, UpdateProjectInput, Project, ApiResponse } from '../types'

// 获取 Supabase 客户端
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

/**
 * 创建新项目
 * @param projectData 项目数据
 * @param userId 创建者ID
 * @returns 创建的项目数据
 */
export async function createProject(
  projectData: CreateProjectInput,
  userId: string
): Promise<ApiResponse<Project>> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        resources: projectData.resources || [],
        affiliatesUsers: projectData.affiliatesUsers || [],
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('创建项目失败:', error)
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
    console.error('创建项目异常:', error)
    return {
      success: false,
      error: '创建项目时发生未知错误'
    }
  }
}

/**
 * 更新项目
 * @param projectId 项目ID
 * @param updateData 更新数据
 * @param userId 操作者ID
 * @returns 更新后的项目数据
 */
export async function updateProject(
  projectId: string,
  updateData: UpdateProjectInput,
  userId: string
): Promise<ApiResponse<Project>> {
  try {
    const supabase = getSupabaseClient()
    
    // 首先检查项目是否存在且用户有权限修改
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('createdBy')
      .eq('id', projectId)
      .single()

    if (fetchError) {
      return {
        success: false,
        error: '项目不存在'
      }
    }

    // 检查权限（只有创建者可以修改）
    if (existingProject.createdBy !== userId) {
      return {
        success: false,
        error: '没有权限修改此项目'
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updateData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('更新项目失败:', error)
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
    console.error('更新项目异常:', error)
    return {
      success: false,
      error: '更新项目时发生未知错误'
    }
  }
}

/**
 * 删除项目
 * @param projectId 项目ID
 * @param userId 操作者ID
 * @returns 删除结果
 */
export async function deleteProject(
  projectId: string,
  userId: string
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = getSupabaseClient()
    
    // 首先检查项目是否存在且用户有权限删除
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('createdBy')
      .eq('id', projectId)
      .single()

    if (fetchError) {
      return {
        success: false,
        error: '项目不存在'
      }
    }

    // 检查权限（只有创建者可以删除）
    if (existingProject.createdBy !== userId) {
      return {
        success: false,
        error: '没有权限删除此项目'
      }
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('删除项目失败:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: true
    }
  } catch (error) {
    console.error('删除项目异常:', error)
    return {
      success: false,
      error: '删除项目时发生未知错误'
    }
  }
}

/**
 * 批量删除项目
 * @param projectIds 项目ID数组
 * @param userId 操作者ID
 * @returns 删除结果
 */
export async function batchDeleteProjects(
  projectIds: string[],
  userId: string
): Promise<ApiResponse<number>> {
  try {
    const supabase = getSupabaseClient()
    
    // 检查所有项目的权限
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('id, createdBy')
      .in('id', projectIds)

    if (fetchError) {
      return {
        success: false,
        error: '查询项目失败'
      }
    }

    // 过滤出用户有权限删除的项目
    const deletableProjects = projects.filter((project: { id: string; createdBy: string }) => project.createdBy === userId)
    const deletableIds = deletableProjects.map((project: { id: string; createdBy: string }) => project.id)

    if (deletableIds.length === 0) {
      return {
        success: false,
        error: '没有权限删除任何项目'
      }
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .in('id', deletableIds)

    if (error) {
      console.error('批量删除项目失败:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: deletableIds.length
    }
  } catch (error) {
    console.error('批量删除项目异常:', error)
    return {
      success: false,
      error: '批量删除项目时发生未知错误'
    }
  }
}

/**
 * 添加分销参与人
 * @param projectId 项目ID
 * @param affiliateUserId 分销参与人ID
 * @param userId 操作者ID
 * @returns 更新结果
 */
export async function addAffiliateUser(
  projectId: string,
  affiliateUserId: string,
  userId: string
): Promise<ApiResponse<Project>> {
  try {
    const supabase = getSupabaseClient()
    
    // 获取当前项目数据
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (fetchError) {
      return {
        success: false,
        error: '项目不存在'
      }
    }

    // 检查权限
    if (project.createdBy !== userId) {
      return {
        success: false,
        error: '没有权限修改此项目'
      }
    }

    // 检查是否已经存在
    const currentAffiliates = project.affiliatesUsers || []
    if (currentAffiliates.includes(affiliateUserId)) {
      return {
        success: false,
        error: '该用户已经是分销参与人'
      }
    }

    // 添加新的分销参与人
    const updatedAffiliates = [...currentAffiliates, affiliateUserId]
    
    const { data, error } = await supabase
      .from('projects')
      .update({
        affiliatesUsers: updatedAffiliates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
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
    console.error('添加分销参与人异常:', error)
    return {
      success: false,
      error: '添加分销参与人时发生未知错误'
    }
  }
}

/**
 * 移除分销参与人
 * @param projectId 项目ID
 * @param affiliateUserId 分销参与人ID
 * @param userId 操作者ID
 * @returns 更新结果
 */
export async function removeAffiliateUser(
  projectId: string,
  affiliateUserId: string,
  userId: string
): Promise<ApiResponse<Project>> {
  try {
    const supabase = getSupabaseClient()
    
    // 获取当前项目数据
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (fetchError) {
      return {
        success: false,
        error: '项目不存在'
      }
    }

    // 检查权限
    if (project.createdBy !== userId) {
      return {
        success: false,
        error: '没有权限修改此项目'
      }
    }

    // 移除分销参与人
    const currentAffiliates = project.affiliatesUsers || []
    const updatedAffiliates = currentAffiliates.filter((id: string) => id !== affiliateUserId)
    
    const { data, error } = await supabase
      .from('projects')
      .update({
        affiliatesUsers: updatedAffiliates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
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
    console.error('移除分销参与人异常:', error)
    return {
      success: false,
      error: '移除分销参与人时发生未知错误'
    }
  }
}