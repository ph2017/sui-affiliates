# Google OAuth 登录设置指南

本项目已集成 Google OAuth 登录功能，使用 Supabase 作为认证服务提供商。

## 配置步骤

### 1. 设置 Supabase 项目

1. 访问 [Supabase](https://supabase.com/) 并创建新项目
2. 在项目设置中找到 API 配置
3. 复制 `Project URL` 和 `anon public` 密钥

### 2. 配置 Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID：
   - 应用类型：Web 应用
   - 授权重定向 URI：`https://your-project-ref.supabase.co/auth/v1/callback`
5. 复制客户端 ID 和客户端密钥

### 3. 在 Supabase 中配置 Google Provider

1. 在 Supabase 项目中，转到 Authentication > Providers
2. 启用 Google provider
3. 输入 Google OAuth 客户端 ID 和客户端密钥
4. 保存配置

### 4. 设置环境变量

复制 `.env.example` 到 `.env.local` 并填入以下值：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 5. 本地开发设置

对于本地开发，在 Google Cloud Console 中添加以下重定向 URI：
- `http://localhost:54321/auth/v1/callback` (Supabase 本地开发)
- 或使用您的 Supabase 项目 URL

## 使用方法

### 登录页面
访问 `/login` 页面即可看到 Google 登录按钮。

### 在组件中使用认证状态

```tsx
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, loading, signOut, isAuthenticated } = useAuth()

  if (loading) return <div>加载中...</div>

  if (isAuthenticated) {
    return (
      <div>
        <p>欢迎, {user.email}!</p>
        <button onClick={signOut}>退出登录</button>
      </div>
    )
  }

  return <a href="/login">登录</a>
}
```

## 文件结构

- `/app/[locale]/login/page.tsx` - 登录页面
- `/app/auth/callback/route.ts` - OAuth 回调处理
- `/app/auth/auth-code-error/page.tsx` - 认证错误页面
- `/utils/supbase/client.ts` - 客户端 Supabase 配置
- `/utils/supbase/server.ts` - 服务端 Supabase 配置
- `/hooks/useAuth.ts` - 认证状态管理 Hook
- `/components/icons/google.tsx` - Google 图标组件

## 注意事项

1. 确保在生产环境中正确配置重定向 URI
2. 定期轮换 API 密钥以确保安全
3. 在 Supabase 中配置适当的 RLS (Row Level Security) 策略
4. 考虑添加其他认证提供商（如 GitHub、Facebook 等）