'use client'

import { useState } from 'react'
import type { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { X, Plus, ImageIcon, DollarSign, Tag, Package, ExternalLink, Truck, TrendingUp, TrendingDown } from 'lucide-react'

interface ProductEditorProps {
  product: Product
  onSave: (product: Product) => void
  onClose: () => void
}

export function ProductEditor({ product, onSave, onClose }: ProductEditorProps) {
  const [editedProduct, setEditedProduct] = useState<Product>({ ...product })
  const [newVariantOption, setNewVariantOption] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')

  const handleChange = (field: keyof Product, value: unknown) => {
    setEditedProduct((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return
    setEditedProduct((prev) => ({
      ...prev,
      images: [...prev.images, newImageUrl.trim()],
    }))
    setNewImageUrl('')
  }

  const handleAddVariantOption = (variantId: string) => {
    if (!newVariantOption.trim()) return
    setEditedProduct((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        v.id === variantId
          ? { ...v, options: [...v.options, newVariantOption.trim()] }
          : v
      ),
    }))
    setNewVariantOption('')
  }

  const handleRemoveVariantOption = (variantId: string, option: string) => {
    setEditedProduct((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        v.id === variantId
          ? { ...v, options: v.options.filter((o) => o !== option) }
          : v
      ),
    }))
  }

  const handleAddVariant = () => {
    const newVariant = {
      id: `variant-${Date.now()}`,
      name: 'Nueva Variante',
      options: [],
    }
    setEditedProduct((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }))
  }

  const profit = editedProduct.price - editedProduct.originalPrice
  const margin = editedProduct.price > 0 ? ((profit / editedProduct.price) * 100).toFixed(1) : '0'
  const isProfitable = profit >= 0

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            Editar Producto
            {editedProduct.source && (
              <Badge variant="outline" className="text-xs font-normal">
                {editedProduct.source.toUpperCase()}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full bg-secondary">
            <TabsTrigger value="basic" className="flex-1">
              <Package className="w-4 h-4 mr-2" />
              Info Basica
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1">
              <DollarSign className="w-4 h-4 mr-2" />
              Precios
            </TabsTrigger>
            <TabsTrigger value="images" className="flex-1">
              <ImageIcon className="w-4 h-4 mr-2" />
              Imagenes
            </TabsTrigger>
            <TabsTrigger value="variants" className="flex-1">
              <Tag className="w-4 h-4 mr-2" />
              Variantes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo del Producto</Label>
              <Input
                id="title"
                value={editedProduct.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                value={editedProduct.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={5}
                className="bg-secondary border-border resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={editedProduct.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={editedProduct.status}
                  onValueChange={(value: 'draft' | 'ready' | 'published') =>
                    handleChange('status', value)
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="ready">Listo para Publicar</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <Input
                id="supplier"
                value={editedProduct.supplier}
                onChange={(e) => handleChange('supplier', e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {editedProduct.sourceUrl && (
              <a
                href={editedProduct.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Ver producto original
              </a>
            )}
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Costo (Precio de Alibaba)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={editedProduct.originalPrice}
                    onChange={(e) => handleChange('originalPrice', parseFloat(e.target.value) || 0)}
                    className="pl-7 bg-secondary border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio de Venta</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={editedProduct.price}
                    onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    className="pl-7 bg-secondary border-border"
                  />
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${isProfitable ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground">Ganancia por unidad</span>
                <span className={`text-lg font-semibold flex items-center gap-1 ${isProfitable ? 'text-primary' : 'text-destructive'}`}>
                  {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  ${Math.abs(profit).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Margen de ganancia</span>
                <span className={`text-lg font-semibold ${isProfitable ? 'text-primary' : 'text-destructive'}`}>
                  {margin}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrder">Pedido Minimo</Label>
                <Input
                  id="minOrder"
                  type="number"
                  value={editedProduct.minOrder}
                  onChange={(e) => handleChange('minOrder', parseInt(e.target.value) || 0)}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingTime">Tiempo de Envio</Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="shippingTime"
                    value={editedProduct.shippingTime}
                    onChange={(e) => handleChange('shippingTime', e.target.value)}
                    className="pl-10 bg-secondary border-border"
                  />
                </div>
              </div>
            </div>

            {/* Quick pricing suggestions */}
            <div className="pt-2">
              <Label className="text-muted-foreground mb-2 block">Sugerencias rapidas de precio</Label>
              <div className="flex gap-2 flex-wrap">
                {[1.5, 2, 2.5, 3].map((multiplier) => (
                  <Button
                    key={multiplier}
                    variant="outline"
                    size="sm"
                    onClick={() => handleChange('price', Math.round(editedProduct.originalPrice * multiplier * 100) / 100)}
                  >
                    x{multiplier} = ${(editedProduct.originalPrice * multiplier).toFixed(2)}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              {editedProduct.images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="relative aspect-square bg-secondary rounded-lg overflow-hidden group"
                >
                  <img 
                    src={image || "/placeholder.svg"} 
                    alt={`Producto ${index + 1}`} 
                    className="object-cover w-full h-full"
                  />
                  <button
                    onClick={() =>
                      handleChange(
                        'images',
                        editedProduct.images.filter((_, i) => i !== index)
                      )
                    }
                    className="absolute top-2 right-2 p-1 bg-destructive rounded-full text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {index === 0 && (
                    <Badge className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs">
                      Principal
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="URL de la imagen..."
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddImage()
                  }
                }}
                className="bg-secondary border-border flex-1"
              />
              <Button onClick={handleAddImage} disabled={!newImageUrl.trim()}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="variants" className="space-y-4 mt-4">
            {editedProduct.variants.length > 0 ? (
              editedProduct.variants.map((variant) => (
                <div key={variant.id} className="p-4 bg-secondary rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <Input
                      value={variant.name}
                      onChange={(e) => {
                        setEditedProduct((prev) => ({
                          ...prev,
                          variants: prev.variants.map((v) =>
                            v.id === variant.id ? { ...v, name: e.target.value } : v
                          ),
                        }))
                      }}
                      className="bg-card border-border max-w-[200px] font-medium"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditedProduct((prev) => ({
                          ...prev,
                          variants: prev.variants.filter((v) => v.id !== variant.id),
                        }))
                      }
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {variant.options.map((option) => (
                      <Badge
                        key={option}
                        variant="secondary"
                        className="flex items-center gap-1 bg-card"
                      >
                        {option}
                        <button
                          onClick={() => handleRemoveVariantOption(variant.id, option)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Agregar opcion de ${variant.name.toLowerCase()}...`}
                      value={newVariantOption}
                      onChange={(e) => setNewVariantOption(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddVariantOption(variant.id)
                        }
                      }}
                      className="bg-card border-border"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => handleAddVariantOption(variant.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay variantes configuradas
              </div>
            )}

            <Button variant="outline" onClick={handleAddVariant} className="w-full bg-transparent">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Nueva Variante
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(editedProduct)}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
