import { AppHeader } from "@/components/biz/AppHeader";

export default function Dashboard() {
  return (
    <div>
      <AppHeader breadcrumbs={[{ label: "Dashboard" }]} />
      <h1>Dashboard</h1>
    </div>
  )
}