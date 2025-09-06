"use client"

import { Edit3, Trash2, Eye } from "lucide-react"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
  showActions?: boolean
  onEdit?: (product: Product) => void
  onDelete?: (productId: number) => void
}

export const ProductCard = ({ product, showActions = true, onEdit, onDelete }: ProductCardProps) => (
  <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow">
    <img src={product.image || "/placeholder.svg"} alt={product.title} className="w-full h-32 object-cover" />
    <div className="p-4">
      <h3 className="font-semibold text-card-foreground text-balance">{product.title}</h3>
      <p className="text-primary font-bold text-lg mt-1">${product.price}</p>
      {product.category && (
        <span className="inline-block bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-full mt-2">
          {product.category}
        </span>
      )}
      {product.status && (
        <div className="flex items-center justify-between mt-3">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              product.status === "Active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
            }`}
          >
            {product.status}
          </span>
          {product.views && (
            <div className="flex items-center text-muted-foreground text-xs">
              <Eye className="h-3 w-3 mr-1" />
              {product.views}
            </div>
          )}
        </div>
      )}
      {showActions && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onEdit?.(product)}
            className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </button>
          <button
            onClick={() => onDelete?.(product.id)}
            className="px-3 py-2 border border-destructive text-destructive rounded-md text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  </div>
)
