"use client"

import { Plus, Search, Filter } from "lucide-react"
// import type { Product } from "../../types"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useState, useRef, useEffect } from "react"
import { ProductCard } from "./products/product-card"


export const ListingsSection = () => {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const formRef = useRef<HTMLFormElement>(null);
    const [listings, setListings] = useState<any[]>([]);
    const [loadingListings, setLoadingListings] = useState(false);


    useEffect(() => {
        if (!user?.uid) return;
        setLoadingListings(true);
        // Step 1: Get backend user _id from firebaseId
        fetch(`${import.meta.env.VITE_API_URL}api/users/firebase/${user.uid}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch user backend id");
                return res.json();
            })
            .then(data => {
                const backendId = data?.user?._id;
                console.log("Fetched backend user id:", data.user);
                if (!backendId) throw new Error("No backend user id found");
                // Step 2: Fetch products by backend user _id
                return fetch(`${import.meta.env.VITE_API_URL}api/products/user/${backendId}`)
                    .then(res => {
                        if (!res.ok) throw new Error("Failed to fetch listings");
                        return res.json();
                    });
            })
        .then(data => setListings(data.products || []))
            .catch(() => setListings([]))
            .finally(() => setLoadingListings(false));
    }, [user?.uid, formSuccess]);


    const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError("");
        setFormSuccess("");
        setFormLoading(true);
        const formData = new FormData(formRef.current!);
        // Add firebase id
        if (user?.uid) {
            formData.append("createdByFId", user.uid);
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}api/products/`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                throw new Error(await res.text());
            }
            setFormSuccess("Product created successfully!");
            setOpen(false);
            if (formRef.current) formRef.current.reset();
        } catch (err: any) {
            setFormError(err.message || "Failed to create product");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-foreground">My Listings</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="default">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Product</DialogTitle>
                            <DialogDescription>
                                Fill in the details and upload 1-5 images (max 5MB each).
                            </DialogDescription>
                        </DialogHeader>
                        <form ref={formRef} onSubmit={handleCreateProduct} className="space-y-4">
                            <input name="title" type="text" placeholder="Title" required className="w-full px-3 py-2 border rounded" />
                            <textarea name="description" placeholder="Description" required className="w-full px-3 py-2 border rounded" />
                            <input name="category" type="text" placeholder="Category" required className="w-full px-3 py-2 border rounded" />
                            <input name="price" type="number" step="0.01" min="0" placeholder="Price" required className="w-full px-3 py-2 border rounded" />
                            <input name="stock" type="number" min="0" placeholder="Stock (default 0)" className="w-full px-3 py-2 border rounded" />
                            <input name="images" type="file" accept="image/*" multiple required className="w-full px-3 py-2 border rounded" />
                            {formError && <div className="text-red-500 text-sm">{formError}</div>}
                            {formSuccess && <div className="text-green-500 text-sm">{formSuccess}</div>}
                            <Button type="submit" disabled={formLoading} className="w-full">
                                {formLoading ? "Creating..." : "Create"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search your listings..."
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input text-foreground"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                    <Filter className="h-4 w-4" />
                    Filter
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingListings ? (
                    <div className="col-span-full text-center text-muted-foreground">Loading...</div>
                ) : listings.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground">No listings found.</div>
                ) : (
                    listings.map((listing) => (
                        <ProductCard key={listing.id} product={listing} />
                    ))
                )}
            </div>
        </div>
    );
}
