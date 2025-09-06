"use client"

import { Trash2 } from "lucide-react"
import type { CartItem } from "../../types"
import { useState } from "react"
import LayoutDashboard from "@/components/dashboard/layout";

// interface CartSectionProps {
//   cartItems: CartItem[]
//   onRemoveItem: (itemId: number) => void
//   onCheckout: () => void
// }

export const Cart = () => {
    // Dummy cart data
    const [cartItems, setCartItems] = useState<CartItem[]>([
        {
            id: 1,
            title: "Eco-Friendly Water Bottle",
            price: 15.99,
            image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80",
            seller: "GreenGoods",
        },
        {
            id: 2,
            title: "Reusable Shopping Bag",
            price: 7.5,
            image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80",
            seller: "EcoShop",
        },
        {
            id: 3,
            title: "Bamboo Toothbrush",
            price: 3.99,
            image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=200&q=80",
            seller: "NatureSmile",
        },
    ]);

    const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
    const shipping = 10;
    const total = subtotal + shipping;

    const onRemoveItem = (itemId: number) => {
        setCartItems(items => items.filter(item => item.id !== itemId));
    };

    const onCheckout = () => {
        alert("Checkout not implemented in demo.");
    };

    return (
        <LayoutDashboard>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                        {cartItems.length} items
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map((item) => (
                            <div key={item.id} className="bg-card rounded-lg border border-border p-4">
                                <div className="flex gap-4">
                                    <img
                                        src={item.image || "/placeholder.svg"}
                                        alt={item.title}
                                        className="w-20 h-20 rounded-lg object-cover"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-card-foreground">{item.title}</h3>
                                        <p className="text-muted-foreground text-sm">Sold by {item.seller}</p>
                                        <p className="text-primary font-bold text-lg mt-1">${item.price}</p>
                                    </div>
                                    <button onClick={() => onRemoveItem(item.id)} className="text-destructive hover:text-destructive/80">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-card rounded-lg border border-border p-6 h-fit">
                        <h2 className="text-xl font-semibold text-card-foreground mb-4">Order Summary</h2>
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="text-foreground">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                <span className="text-foreground">${shipping.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-border pt-2">
                                <div className="flex justify-between font-semibold">
                                    <span className="text-foreground">Total</span>
                                    <span className="text-primary">${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onCheckout}
                            className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </LayoutDashboard>
    );
};
