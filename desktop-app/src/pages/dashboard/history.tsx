"use client"

import LayoutDashboard from "@/components/dashboard/layout";
import type { Purchase } from "../../types"



export const PurchaseHistorySection = () => {
    // Dummy purchase history data
    const purchases: Purchase[] = [
        {
            id: 1,
            title: "Eco-Friendly Water Bottle",
            price: 15.99,
            image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80",
            seller: "GreenGoods",
            date: new Date("2025-08-15").toISOString(),
        },
        {
            id: 2,
            title: "Reusable Shopping Bag",
            price: 7.5,
            image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80",
            seller: "EcoShop",
            date: new Date("2025-07-22").toISOString(),
        },
        {
            id: 3,
            title: "Bamboo Toothbrush",
            price: 3.99,
            image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=200&q=80",
            seller: "NatureSmile",
            date: new Date("2025-06-10").toISOString(),
        },
    ];

    const onViewDetails = (purchase: Purchase) => {
        alert(`View details for ${purchase.title}`);
    };

    const onBuyAgain = (purchase: Purchase) => {
        alert(`Buy again: ${purchase.title}`);
    };

    return (
        <LayoutDashboard>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-foreground">Purchase History</h1>

                <div className="space-y-4">
                    {purchases.map((purchase) => (
                        <div key={purchase.id} className="bg-card rounded-lg border border-border p-4">
                            <div className="flex gap-4">
                                <img
                                    src={purchase.image || "/placeholder.svg"}
                                    alt={purchase.title}
                                    className="w-20 h-20 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-card-foreground">{purchase.title}</h3>
                                    <p className="text-muted-foreground text-sm">Sold by {purchase.seller}</p>
                                    <p className="text-primary font-bold text-lg mt-1">${purchase.price}</p>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Purchased on {new Date(purchase.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => onViewDetails(purchase)}
                                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90 transition-colors"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => onBuyAgain(purchase)}
                                        className="border border-border text-foreground px-4 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                                    >
                                        Buy Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </LayoutDashboard>
    );
};
