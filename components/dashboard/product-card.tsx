'use client'

import type { Product } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Upload, Star, ExternalLink } from 'lucide-react'
import Image from 'next/image'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onPublish: (id: string) => void
}

export function ProductCard({ product, onEdit, onDelete, onPublish }: ProductCardProps) {
  const statusColors = {
    draft: 'bg-muted text-muted-foreground',
    ready: 'bg-primary/20 text-primary',
    published: 'bg-green-500/20 text-green-400',
  }

  const profit = product.price - product.originalPrice
  const margin = ((profit / product.price) * 100).toFixed(0)

  return (
    <Card className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-colors">
      <div className="relative aspect-square bg-secondary">
        <Image
          src={product.images[0] || "/placeholder.svg"}
          alt={product.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={() => onEdit(product)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          {product.status !== 'published' && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onPublish(product.id)}
            >
              <Upload className="w-4 h-4 mr-1" />
              Publish
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge className={statusColors[product.status]} variant="secondary">
            {product.status}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
            {product.rating}
          </div>
        </div>

        <h3 className="font-medium text-foreground line-clamp-2 mb-2 text-sm leading-tight">
          {product.title}
        </h3>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-foreground">${product.price.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
          <span className="text-xs text-primary font-medium ml-auto">{margin}% margin</span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Min: {product.minOrder} pcs</span>
          <span>{product.shippingTime}</span>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          {product.alibabaUrl && (
            <a
              href={product.alibabaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Alibaba
            </a>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
