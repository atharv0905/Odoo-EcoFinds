import { AppSidebar } from '@/components/dashboard/navbar/app-sidebar'
import { SiteHeader } from '@/components/dashboard/navbar/site-header'
import {
    SidebarInset,
    SidebarProvider,
} from '@/components/ui/sidebar'

export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="floating" />
            <SidebarInset>
                <SiteHeader />
                <div className='px-4 lg:px-6' style={{ marginTop: "var(--header-height)" }}>
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
