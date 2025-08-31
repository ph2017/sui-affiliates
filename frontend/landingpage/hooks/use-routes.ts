"use client"

import { Settings2, SquareTerminal, PanelsTopLeft, Wallet } from "lucide-react"
import { usePathname } from "next/navigation"

export const routes = [
  {
    title: "Dashboard",
    url: "/main/dashboard",
    icon: SquareTerminal,
  },
  {
    title: "MyProjects",
    url: "/main/my-projects",
    icon: PanelsTopLeft,
  }
]

export default function useRoutes() {
  const pathname = usePathname()
  return routes.map(route => ({
    ...route,
    isActive: pathname.startsWith(route.url),
  }))
}
