import { Package, TrendingUp, DollarSign, ShoppingCart, Plus, Search, Settings } from "lucide-react"



export const ProfileSection = () => {
  // Dummy user data
  const user = {
    name: "Aryan",
    totalListings: 12,
    totalSales: 34,
    totalEarnings: 512.75,
  };
  // Dummy cart count
  const cartItemsCount = 3;
  // Dummy recent listings
  const recentListings = [
    {
      id: 1,
      title: "Eco-Friendly Water Bottle",
      price: 15.99,
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80",
      status: "Active",
    },
    {
      id: 2,
      title: "Reusable Shopping Bag",
      price: 7.5,
      image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80",
      status: "Inactive",
    },
    {
      id: 3,
      title: "Bamboo Toothbrush",
      price: 3.99,
      image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=200&q=80",
      status: "Active",
    },
  ];

  return (
    <LayoutDashboard>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Welcome back, {user.name}!</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your EcoFinds account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Listings" value={user.totalListings} icon={Package} />
        <StatCard title="Items Sold" value={user.totalSales} icon={TrendingUp} color="secondary" />
        <StatCard title="Total Earnings" value={`$${user.totalEarnings}`} icon={DollarSign} color="accent" />
        <StatCard title="Cart Items" value={cartItemsCount} icon={ShoppingCart} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-card-foreground">Recent Listings</h2>
            <button className="text-primary hover:text-primary/80 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-3">
            {recentListings.slice(0, 3).map((listing) => (
              <div key={listing.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <img
                  src={listing.image || "/placeholder.svg"}
                  alt={listing.title}
                  className="w-12 h-12 rounded-md object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-foreground">{listing.title}</h3>
                  <p className="text-primary font-semibold">${listing.price}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    listing.status === "Active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {listing.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-card-foreground">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <button className="w-full bg-primary text-primary-foreground p-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Listing
            </button>
            <button className="w-full bg-secondary text-secondary-foreground p-3 rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2">
              <Search className="h-4 w-4" />
              Browse Marketplace
            </button>
            <button className="w-full border border-border text-foreground p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Account Settings
            </button>
          </div>
        </div>
      </div>
    </div>
    </LayoutDashboard>
  );
};


import type { LucideIcon } from "lucide-react"
import LayoutDashboard from "@/components/dashboard/layout";

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: "primary" | "secondary" | "accent"
}

export const StatCard = ({ title, value, icon: Icon, color = "primary" }: StatCardProps) => (
  <div className="bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-muted-foreground text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-card-foreground mt-1">{value}</p>
      </div>
      <div
        className={`p-3 rounded-full ${
          color === "primary" ? "bg-primary" : color === "secondary" ? "bg-secondary" : "bg-accent"
        }`}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
)
