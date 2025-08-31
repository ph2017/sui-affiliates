'use client'

import React from 'react'
import { ConfigProvider, theme } from 'antd'
import { useTheme } from 'next-themes'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useLocale } from 'next-intl'

interface AntdConfigProviderProps {
  children: React.ReactNode
}

export function AntdConfigProvider({ children }: AntdConfigProviderProps) {
  const { theme: currentTheme } = useTheme()
  const locale = useLocale()

  // 根据当前主题选择算法
  const algorithm = currentTheme === 'dark' 
    ? theme.darkAlgorithm 
    : theme.defaultAlgorithm

  // 根据语言选择locale
  const antdLocale = locale === 'zh' ? zhCN : enUS

  // 自定义主题配置
  const themeConfig = {
    algorithm,
    token: {
      // 主色调
      colorPrimary: '#3b82f6',
      // 圆角
      borderRadius: 6,
      // 字体
      fontFamily: 'inherit',
    },
    components: {
      Table: {
        // 表格样式定制
        headerBg: currentTheme === 'dark' ? '#1f2937' : '#f8fafc',
        headerColor: currentTheme === 'dark' ? '#f3f4f6' : '#374151',
        rowHoverBg: currentTheme === 'dark' ? '#374151' : '#f1f5f9',
      },
      Card: {
        // 卡片样式定制
        headerBg: 'transparent',
      },
      Button: {
        // 按钮样式定制
        borderRadius: 6,
      },
      Input: {
        // 输入框样式定制
        borderRadius: 6,
      },
      DatePicker: {
        // 日期选择器样式定制
        borderRadius: 6,
      },
    },
  }

  return (
    <ConfigProvider
      theme={themeConfig}
      locale={antdLocale}
    >
      {children}
    </ConfigProvider>
  )
}