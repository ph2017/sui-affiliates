"use client"

import HomeComponent from "@/components/home";
import { usePathname } from "next/navigation";

export default function Home() {
  const pathname = usePathname();
  
  // 如果当前路径是 /main 或其子路由，不渲染 HomeComponent
  if (pathname.includes('/main')) {
    return null;
  }
  
  return <HomeComponent />;
}
