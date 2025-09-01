import { NextRequest, NextResponse } from 'next/server'
import { getProjects } from '@/lib/supabase/project/selectors'
import { ProjectFilters, PaginationParams } from '@/lib/supabase/project/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 解析分页参数
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    
    // 解析过滤参数
    const name = searchParams.get('name') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const createdBy = searchParams.get('createdBy') || undefined
    const usdcBalanceMin = searchParams.get('usdcBalanceMin') 
      ? parseFloat(searchParams.get('usdcBalanceMin')!) 
      : undefined
    const usdcBalanceMax = searchParams.get('usdcBalanceMax') 
      ? parseFloat(searchParams.get('usdcBalanceMax')!) 
      : undefined
    
    const filters: ProjectFilters = {
      name,
      startDate,
      endDate,
      createdBy,
      usdcBalanceMin,
      usdcBalanceMax
    }
    
    // 构建分页参数 - 将前端的camelCase转换为数据库的snake_case
    const dbSortBy = (() => {
      const sortField = sortBy || 'createdAt'
      const fieldMapping: Record<string, string> = {
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'startDate': 'start_date',
        'endDate': 'end_date',
        'usdcBalance': 'usdc_balance',
        'contractId': 'contract_id',
        'createdBy': 'created_by',
        'affiliatesUsers': 'affiliates_users'
      }
      return fieldMapping[sortField] || sortField
    })()

    const pagination: PaginationParams = {
      page,
      pageSize,
      sortBy: dbSortBy,
      sortOrder
    }
    
    // 调用查询方法
    const result = await getProjects(filters, pagination)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '查询项目失败' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result.data
    })
    
  } catch (error) {
    console.error('项目查询API错误:', error)
    const message = error instanceof Error ? error.message : '服务器处理请求失败'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}