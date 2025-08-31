'use client'

import React, { useState, useEffect } from 'react'
import { Table, Input, DatePicker, Button, Space, Card, Typography, Tag } from 'antd'
import { SearchOutlined, ReloadOutlined, PlusOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import dayjs, { Dayjs } from 'dayjs'
import { useTheme } from 'next-themes'
import { AppHeader } from '@/components/biz/AppHeader/AppHeader'

const { Title } = Typography
const { RangePicker } = DatePicker

// 项目数据类型定义
interface ProjectData {
  key: string
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'completed' | 'pending'
  createTime: string
  updateTime: string
  creator: string
  participants: number
}

// 模拟项目数据
const generateMockData = (): ProjectData[] => {
  const statuses: ProjectData['status'][] = ['active', 'inactive', 'completed', 'pending']
  const projects: ProjectData[] = []
  
  for (let i = 1; i <= 50; i++) {
    projects.push({
      key: `project-${i}`,
      id: `PRJ-${String(i).padStart(4, '0')}`,
      name: `项目 ${i}`,
      description: `这是第 ${i} 个项目的描述信息`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createTime: dayjs().subtract(Math.floor(Math.random() * 365), 'day').format('YYYY-MM-DD HH:mm:ss'),
      updateTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm:ss'),
      creator: `用户${i}`,
      participants: Math.floor(Math.random() * 20) + 1
    })
  }
  
  return projects
}

// 状态标签颜色映射
const getStatusColor = (status: ProjectData['status']) => {
  const colorMap = {
    active: 'green',
    inactive: 'red',
    completed: 'blue',
    pending: 'orange'
  }
  return colorMap[status]
}

// 状态文本映射
const getStatusText = (status: ProjectData['status']) => {
  const textMap = {
    active: '进行中',
    inactive: '已停用',
    completed: '已完成',
    pending: '待开始'
  }
  return textMap[status]
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
    loadData()
  }, [])

  // 加载数据
  const loadData = () => {
    setLoading(true)
    // 模拟API调用
    setTimeout(() => {
      const mockData = generateMockData()
      setData(mockData)
      setPagination(prev => ({
        ...prev,
        total: mockData.length
      }))
      setLoading(false)
    }, 500)
  }

  // 搜索功能
  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => {
      let filteredData = generateMockData()
      
      // 按项目名称搜索
      if (searchText) {
        filteredData = filteredData.filter(item => 
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.id.toLowerCase().includes(searchText.toLowerCase())
        )
      }
      
      // 按创建时间范围搜索
      if (dateRange && dateRange[0] && dateRange[1]) {
        filteredData = filteredData.filter(item => {
          const createTime = dayjs(item.createTime)
          return createTime.isAfter(dateRange[0]) && createTime.isBefore(dateRange[1])
        })
      }
      
      setData(filteredData)
      setPagination(prev => ({
        ...prev,
        current: 1,
        total: filteredData.length
      }))
      setLoading(false)
    }, 300)
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
      fixed: 'left'
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true
    },
    {
      title: '项目描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ProjectData['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: '进行中', value: 'active' },
        { text: '已停用', value: 'inactive' },
        { text: '已完成', value: 'completed' },
        { text: '待开始', value: 'pending' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      sorter: (a, b) => dayjs(a.createTime).unix() - dayjs(b.createTime).unix()
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 180,
      sorter: (a, b) => dayjs(a.updateTime).unix() - dayjs(b.updateTime).unix()
    },
    {
      title: '创建者',
      dataIndex: 'creator',
      key: 'creator',
      width: 120
    },
    {
      title: '参与人数',
      dataIndex: 'participants',
      key: 'participants',
      width: 100,
      sorter: (a, b) => a.participants - b.participants
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
    setPagination(paginationConfig)
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