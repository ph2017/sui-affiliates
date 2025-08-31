'use client'

import React from 'react'
import { Button, Card, Table, Tag, DatePicker, Input, Space } from 'antd'
import { SearchOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons'
import { useTheme } from 'next-themes'

const { RangePicker } = DatePicker

// 测试数据
const testData = [
  {
    key: '1',
    name: '测试项目 1',
    status: 'active',
    createTime: '2024-01-01',
  },
  {
    key: '2', 
    name: '测试项目 2',
    status: 'completed',
    createTime: '2024-01-02',
  }
]

const columns = [
  {
    title: '项目名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => (
      <Tag color={status === 'active' ? 'green' : 'blue'}>
        {status === 'active' ? '进行中' : '已完成'}
      </Tag>
    ),
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
  },
]

export function ThemeTestPanel() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="p-6 space-y-6">
      <Card title="Ant Design 主题测试面板" className="w-full">
        <Space direction="vertical" size="large" className="w-full">
          {/* 主题切换按钮 */}
          <div className="flex items-center gap-4">
            <span>当前主题: {theme}</span>
            <Button 
              type="primary" 
              icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
            >
              切换到 {theme === 'dark' ? '浅色' : '深色'} 主题
            </Button>
          </div>

          {/* 搜索组件测试 */}
          <div className="space-y-4">
            <h3>搜索组件测试</h3>
            <div className="flex gap-4">
              <Input 
                placeholder="搜索项目名称" 
                prefix={<SearchOutlined />}
                className="w-64"
              />
              <RangePicker placeholder={['开始日期', '结束日期']} />
              <Button type="primary">搜索</Button>
              <Button>重置</Button>
            </div>
          </div>

          {/* 表格组件测试 */}
          <div className="space-y-4">
            <h3>表格组件测试</h3>
            <Table 
              columns={columns} 
              dataSource={testData} 
              pagination={false}
              size="middle"
            />
          </div>

          {/* 按钮组件测试 */}
          <div className="space-y-4">
            <h3>按钮组件测试</h3>
            <Space wrap>
              <Button type="primary">主要按钮</Button>
              <Button>默认按钮</Button>
              <Button type="dashed">虚线按钮</Button>
              <Button type="text">文本按钮</Button>
              <Button type="link">链接按钮</Button>
              <Button danger>危险按钮</Button>
            </Space>
          </div>

          {/* 标签组件测试 */}
          <div className="space-y-4">
            <h3>标签组件测试</h3>
            <Space wrap>
              <Tag color="blue">蓝色标签</Tag>
              <Tag color="green">绿色标签</Tag>
              <Tag color="orange">橙色标签</Tag>
              <Tag color="red">红色标签</Tag>
              <Tag color="purple">紫色标签</Tag>
            </Space>
          </div>
        </Space>
      </Card>
    </div>
  )
}