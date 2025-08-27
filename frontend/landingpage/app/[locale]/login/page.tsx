'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supbase/client'
import { Button } from '@/components/ui/button'
import { GoogleIcon } from '@/components/icons/google'
import { toast } from 'react-hot-toast'
import { useTranslations } from 'next-intl'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const t = useTranslations('Login')
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        console.error('Login error:', error)
        toast.error('登录失败，请重试')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录您的账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            使用您的Google账户快速登录
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <GoogleIcon className="h-5 w-5" />
              </span>
              {isLoading ? '登录中...' : '使用 Google 登录'}
            </Button>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            登录即表示您同意我们的{' '}
            <a href="/terms-of-service" className="font-medium text-indigo-600 hover:text-indigo-500">
              服务条款
            </a>{' '}
            和{' '}
            <a href="/privacy-policy" className="font-medium text-indigo-600 hover:text-indigo-500">
              隐私政策
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}