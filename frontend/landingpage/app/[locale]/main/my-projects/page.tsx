'use client'

import React, { useState, useEffect } from 'react'
import { Table, Input, DatePicker, Button, Space, Card, Typography, Tag, message } from 'antd'
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import dayjs, { Dayjs } from 'dayjs'
import { useTheme } from 'next-themes'
import { AppHeader } from '@/components/biz/AppHeader/AppHeader'
import { Project } from '@/lib/supabase/project/types'

const { Title } = Typography
const { RangePicker } = DatePicker

// 项目数据类型定义（基于Supabase Project类型）
interface ProjectData {
  key: string
  id: string
  name: string
  resources: string[]
  startDate: string
  endDate: string
  affiliatesUsers: string[]
  usdcBalance: number
  contractId: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

// API响应类型
interface ApiResponse {
  success: boolean
  data?: {
    data: Project[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  error?: string
}

// 将Supabase Project转换为表格数据
const transformProjectData = (projects: any[]): ProjectData[] => {
  return projects.map(project => ({
    key: project.id,
    id: project.id,
    name: project.name,
    resources: project.resources,
    startDate: project.start_date,
    endDate: project.end_date,
    affiliatesUsers: project.affiliates_users,
    usdcBalance: project.usdc_balance,
    contractId: project.contract_id,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    createdBy: project.created_by
  }))
}

// 获取项目状态（基于日期）
const getProjectStatus = (startDate: string, endDate: string) => {
  const now = dayjs()
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  
  if (now.isBefore(start)) {
    return { status: 'pending', text: '待开始', color: 'orange' }
  } else if (now.isAfter(end)) {
    return { status: 'completed', text: '已完成', color: 'blue' }
  } else {
    return { status: 'active', text: '进行中', color: 'green' }
  }
}

export default function MyProjectsPage() {
  const { theme, setTheme } = useTheme()
  const [data, setData] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`
  })

  // 初始化数据
  useEffect(() => {
    loadData(1, 10)
  }, [])

  // 加载数据
  const loadData = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      
      // 添加搜索条件
      if (searchText) {
        params.append('name', searchText)
      }
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'))
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'))
      }
      
      const response = await fetch(`/api/projects?${params.toString()}`)
      const result: ApiResponse = await response.json()
      
      if (result.success && result.data) {
        const transformedData = transformProjectData(result.data.data)
        setData(transformedData)
        setPagination(prev => ({
          ...prev,
          current: result.data!.page,
          total: result.data!.total,
          pageSize: result.data!.pageSize
        }))
      } else {
        message.error(result.error || '加载项目数据失败')
        setData([])
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('网络请求失败，请稍后重试')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // 搜索功能
  const handleSearch = () => {
    loadData(1, pagination.pageSize)
  }

  // 重置搜索
  const handleReset = () => {
    setSearchText('')
    setDateRange(null)
    loadData()
  }

  // 表格列定义
  const columns: ColumnsType<ProjectData> = [
    {
      title: '项目ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      fixed: 'left',
      render: (id: string) => (
        <span className="font-mono text-xs">{id.slice(0, 8)}...</span>
      )
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true
    },
    {
      title: '合同ID',
      dataIndex: 'contractId',
      key: 'contractId',
      width: 150,
      ellipsis: true,
      render: (contractId: string) => (
        <span className="font-mono text-xs">{contractId}</span>
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const statusInfo = getProjectStatus(record.startDate, record.endDate)
        return (
          <Tag color={statusInfo.color}>
            {statusInfo.text}
          </Tag>
        )
      },
      filters: [
        { text: '进行中', value: 'active' },
        { text: '已完成', value: 'completed' },
        { text: '待开始', value: 'pending' }
      ],
      onFilter: (value, record) => {
        const statusInfo = getProjectStatus(record.startDate, record.endDate)
        return statusInfo.status === value
      }
    },
    {
      title: 'USDC余额',
      dataIndex: 'usdcBalance',
      key: 'usdcBalance',
      width: 120,
      render: (balance: number) => (
        <span className="font-mono">{balance.toFixed(2)} USDC</span>
      ),
      sorter: (a, b) => a.usdcBalance - b.usdcBalance
    },
    {
      title: '开始时间',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.startDate).unix() - dayjs(b.startDate).unix()
    },
    {
      title: '结束时间',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.endDate).unix() - dayjs(b.endDate).unix()
    },
    {
      title: '参与人数',
      dataIndex: 'affiliatesUsers',
      key: 'affiliatesUsers',
      width: 100,
      render: (users: string[]) => users.length,
      sorter: (a, b) => a.affiliatesUsers.length - b.affiliatesUsers.length
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix()
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small">
            查看
          </Button>
          <Button type="link" size="small">
            编辑
          </Button>
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 表格变化处理
  const handleTableChange = (
    paginationConfig: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<ProjectData> | SorterResult<ProjectData>[]
  ) => {
    const { current = 1, pageSize = 10 } = paginationConfig
    loadData(current, pageSize)
  }

  return (
    <div className="p-6">
      <AppHeader breadcrumbs={[{ label: "MyProjects" }]} />
      <div className="mb-6 flex justify-between items-center">
        {/* <Button 
          type="default"
          icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-2"

          {theme === 'dark' ? '浅色模式' : '深色模式'}
        </Button> */}
      </div>
      
      {/* 搜索区域 */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">项目名称/ID</label>
            <Input
              placeholder="请输入项目名称或ID"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
          
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium mb-2">创建时间</label>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="YYYY-MM-DD"
              placeholder={['开始日期', '结束日期']}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              搜索
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置
            </Button>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              className="bg-green-600 hover:bg-green-700"
            >
              新建项目
            </Button>
          </div>
        </div>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table<ProjectData>
          columns={columns}
          dataSource={data}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
          size="middle"
        />
      </Card>
    </div>
  )
}