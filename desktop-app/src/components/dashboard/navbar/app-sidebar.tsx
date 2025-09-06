"use client"

import * as React from "react"
import { Link } from "react-router-dom"
import {
  IconTrendingUp,
  IconUser,
  IconPackage,
  IconShoppingCart,
  IconHistory,
  IconInnerShadowTop,
} from "@tabler/icons-react"
type SidebarItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  to: string;
};

const sidebarItems: SidebarItem[] = [
  { id: "overview", label: "Overview", icon: IconTrendingUp, to: "/dashboard" },
  { id: "profile", label: "Profile", icon: IconUser, to: "/dashboard/profile" },
  { id: "listings", label: "My Listings", icon: IconPackage, to: "/dashboard/mylisting" },
  { id: "cart", label: "Cart", icon: IconShoppingCart, to: "/dashboard/cart" },
  { id: "purchases", label: "Purchase History", icon: IconHistory, to: "/dashboard/history" },
];

import { NavUser } from '@/components/dashboard/navbar/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">ECOFinds.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu className="mt-2">
          {sidebarItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild>
                <Link to={item.to} className="flex items-center w-full">
                  <item.icon className="mr-2 size-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
