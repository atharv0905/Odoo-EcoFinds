"use client"

import { Edit3, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Product type inferred from API response


export interface ProductCardProps {
  product: any;
  showActions?: boolean;
  onEdit?: (product: any) => void;
  onDelete?: (productId: string) => void;
  onChange?: () => void;
}
export function ProductCard({ product, showActions = true, onChange }: ProductCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [editForm, setEditForm] = useState({
    title: product.title,
    description: product.description,
    category: product.category,
    price: product.price,
    stock: product.stock,
  });
  const [imgIdx, setImgIdx] = useState(0);
  const images = product.images || [];
  // Auto-play carousel
  useEffect(() => {
    if (images.length < 2) return;
    const timer = setInterval(() => {
      setImgIdx((idx) => (idx + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow">
      {/* Framer Motion Carousel */}
      <div className="w-full h-40 bg-muted flex items-center justify-center relative">
        {images.length > 0 ? (
          <AnimatePresence initial={false} mode="wait">
            <motion.img
              key={images[imgIdx]._id}
              src={images[imgIdx].url}
              alt={images[imgIdx].alt || product.title}
              className="h-full w-auto max-w-[80%] object-cover rounded shadow"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5 }}
            />
          </AnimatePresence>
        ) : (
          <div className="text-muted-foreground text-sm">No image</div>
        )}
      </div>
    <div className="p-4">
      <h3 className="font-semibold text-card-foreground text-lg mb-1">{product.title}</h3>
      <p className="text-muted-foreground text-sm mb-2">{product.description}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        <span className="inline-block px-2 py-1 rounded-full text-xs" style={{background: "var(--color-secondary)", color: "var(--color-secondary-foreground)"}}>
          {product.category}
        </span>
        <span className="inline-block px-2 py-1 rounded-full text-xs font-bold" style={{background: "var(--color-primary)", color: "var(--color-primary-foreground)"}}>
          ${product.price}
        </span>
        <span className="inline-block px-2 py-1 rounded-full text-xs" style={{background: "var(--color-muted)", color: "var(--color-muted-foreground)"}}>
          Stock: {product.stock}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        <span className="inline-block px-2 py-1 rounded-full text-xs" style={{background: "var(--color-accent)", color: "var(--color-accent-foreground)"}}>
          Sold: {product.totalSold}
        </span>
        <span className="inline-block px-2 py-1 rounded-full text-xs" style={{background: "var(--color-muted)", color: "var(--color-muted-foreground)"}}>
          Views: {product.views}
        </span>
        <span className="inline-block px-2 py-1 rounded-full text-xs" style={{background: product.isActive ? "var(--color-primary)" : "var(--color-destructive)", color: product.isActive ? "var(--color-primary-foreground)" : "var(--color-destructive-foreground)"}}>
          {product.isActive ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="text-xs text-muted-foreground mb-2">
        Created by: {product.createdBy?.name} ({product.createdBy?.email})
      </div>
      <div className="text-xs text-muted-foreground mb-2">
        Created: {new Date(product.createdAt).toLocaleString()}
      </div>
      <div className="text-xs text-muted-foreground mb-2">
        Updated: {new Date(product.updatedAt).toLocaleString()}
      </div>
      {showActions && (
        <div className="flex gap-2 mt-3">
          {/* Edit Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <button
                className="flex-1 px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-1"
                style={{background: "var(--color-primary)", color: "var(--color-primary-foreground)"}}
              >
                <Edit3 className="h-3 w-3" />
                Edit
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>Update product details below.</DialogDescription>
              </DialogHeader>
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEditLoading(true);
                  setEditError("");
                  setEditSuccess("");
                  try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL}api/products/${product._id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(editForm),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    setEditSuccess("Product updated!");
                    setEditOpen(false);
                    if (onChange) onChange();
                  } catch (err: any) {
                    setEditError(err.message || "Failed to update product");
                  } finally {
                    setEditLoading(false);
                  }
                }}
              >
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Title"
                  required
                  className="w-full px-3 py-2 border rounded"
                />
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description"
                  required
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  value={editForm.category}
                  onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="Category"
                  required
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="number"
                  value={editForm.price}
                  onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))}
                  placeholder="Price"
                  required
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="number"
                  value={editForm.stock}
                  onChange={e => setEditForm(f => ({ ...f, stock: Number(e.target.value) }))}
                  placeholder="Stock"
                  className="w-full px-3 py-2 border rounded"
                />
                {editError && <div className="text-red-500 text-sm">{editError}</div>}
                {editSuccess && <div className="text-green-500 text-sm">{editSuccess}</div>}
                <button
                  type="submit"
                  disabled={editLoading}
                  className="w-full px-3 py-2 rounded-md text-sm transition-colors"
                  style={{background: "var(--color-primary)", color: "var(--color-primary-foreground)"}}
                >
                  {editLoading ? "Saving..." : "Save"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
          {/* Delete Dialog */}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <button
                className="px-3 py-2 border rounded-md text-sm transition-colors"
                style={{borderColor: "var(--color-destructive)", color: "var(--color-destructive)"}}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Product</DialogTitle>
                <DialogDescription>Are you sure you want to delete this product?</DialogDescription>
              </DialogHeader>
              {deleteError && <div className="text-red-500 text-sm mb-2">{deleteError}</div>}
              {deleteSuccess && <div className="text-green-500 text-sm mb-2">{deleteSuccess}</div>}
              <button
                onClick={async () => {
                  setDeleteLoading(true);
                  setDeleteError("");
                  setDeleteSuccess("");
                  try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL}api/products/${product._id}`, {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ createdBy: product.createdByFId }),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    setDeleteSuccess("Product deleted!");
                    setDeleteOpen(false);
                    if (onChange) onChange();
                  } catch (err: any) {
                    setDeleteError(err.message || "Failed to delete product");
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
                disabled={deleteLoading}
                className="w-full px-3 py-2 rounded-md text-sm transition-colors"
                style={{background: "var(--color-destructive)", color: "var(--color-destructive-foreground)"}}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  </div>
  );
}
