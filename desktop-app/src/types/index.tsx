export interface User {
  name: string
  email: string
  avatar: string
  joinDate: string
  totalListings: number
  totalSales: number
  totalEarnings: number
}

export interface Product {
  id: number
  title: string
  price: number
  category?: string
  image: string
  status?: string
  views?: number
}

export interface CartItem {
  id: number
  title: string
  price: number
  seller: string
  image: string
}

export interface Purchase {
  id: number
  title: string
  price: number
  seller: string
  date: string
  image: string
}

export interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
}
