"use client"

import React, { useCallback } from "react"
import { User } from '@supabase/supabase-js'
import { Loading } from "@/components/biz/Loading"
import useRoutes from "@/hooks/use-routes"
// import { useSession, signOut } from "next-auth/react"
import { useAuth } from '@/hooks/useAuth'
import { redirect } from "next/navigation"
import { useEffect } from "react"
import { AppSidebarLayout } from "@/components/biz/AppSidebarLayout"
import { type NavMainItem } from "@/components/biz/AppSidebarLayout/interface"
import { WalletHeader } from "@/components/biz/WalletHeader"
import { WalletProvider } from "@/components/provider/wallet-provider"
import Providers from "@/components/provider/sui-provider"

// create a internal component to use context
function MainLayoutContent({
  children,
  user,
  signOut
}: {
  children: React.ReactNode
  user: User
  signOut: () => Promise<void>
}) {
  const routes = useRoutes()
  

  // handle nav item click
  const handleNavItemClick = useCallback(
    (url: string) => {
      return false
    },
    [],
  )

  return (
    <Providers>
      <AppSidebarLayout
        navMain={routes as NavMainItem[]}
        user={{
          name: user.user_metadata?.name,
          email: user.email as string,
          avatar: user.user_metadata?.avatar_url,
        }}
        onLogout={signOut}
        onNavItemClick={handleNavItemClick}
      >
        {/* <WalletProvider>
          <WalletHeader></WalletHeader>
          {children}
        </WalletProvider> */}
        {children}
      </AppSidebarLayout>
    </Providers>
  )
}

// main layout
export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { signOut, user, loading } = useAuth()
  useEffect(() => {
    debugger
    if (loading) {
      return
    }
    if (!user) {
      redirect("/login")
    }
  }, [user, loading])

  // Show loading state while checking authentication status
  if (loading) {
    return <Loading fullscreen />
  }

  return (
    <MainLayoutContent user={user as User} signOut={signOut}>{children}</MainLayoutContent>
  )
}
