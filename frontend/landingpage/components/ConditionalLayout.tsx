"use client"

import { usePathname } from "next/navigation";
import { LanguageDetectionAlert } from "@/components/LanguageDetectionAlert";

interface ConditionalLayoutProps {
  children: React.ReactNode;
  messages: any;
  header: React.ReactNode;
  footer: React.ReactNode;
}

export default function ConditionalLayout({ 
  children, 
  messages,
  header,
  footer
}: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isMainRoute = pathname.includes('/main');

  if (isMainRoute) {
    // 在 /main 路由下，不渲染 Header 和 Footer
    return <>{children}</>;
  }

  // 在其他路由下，正常渲染 Header 和 Footer
  return (
    <>
      {messages.LanguageDetection && <LanguageDetectionAlert />}
      {messages.Header && header}
      
      <main className="flex-1 flex flex-col items-center">
        {children}
      </main>
      
      {messages.Footer && footer}
    </>
  );
}