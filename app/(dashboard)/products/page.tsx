'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/dashboard/header'
import { ProductEditor } from '@/components/dashboard/product-editor'
import { useProducts } from '@/hooks/use-products'
import type { Product } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Upload,
  Package,
  Star,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ProductsPage() {
  const { products, isLoading, updateProduct, deleteProducts, bulkUpdateStatus } = useProducts()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const filteredProducts = useMemo(() => {
    let result = [...products]
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.supplier.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter)
    }
    return result
  }, [products, searchQuery, statusFilter])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)))
    } else {
      setSelectedProducts(new Set())
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts)
    if (checked) {
      newSelected.add(productId)
    } else {
      newSelected.delete(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleDeleteProduct = (productId: string) => {
    deleteProducts([productId])
    const newSelected = new Set(selectedProducts)
    newSelected.delete(productId)
    setSelectedProducts(newSelected)
  }

  const handleBulkDelete = () => {
    deleteProducts(Array.from(selectedProducts))
    setSelectedProducts(new Set())
  }

  const handleBulkStatusChange = (status: 'draft' | 'ready' | 'published') => {
    bulkUpdateStatus(selectedProducts, status)
  }

  const handleSaveProduct = (updatedProduct: Product) => {
    updateProduct(updatedProduct)
    setEditingProduct(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <Badge className="bg-primary/20 text-primary border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Publicado
          </Badge>
        )
      case 'ready':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-0">
            <RefreshCw className="w-3 h-3 mr-1" />
            Listo
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground border-0">
            Borrador
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando productos...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Mis Productos"
        description={`${products.length} productos en tu catalogo`}
      />

      <div className="flex-1 p-6 overflow-auto">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-card border-border">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="ready">Listo</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild>
              <Link href="/import">
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Link>
            </Button>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedProducts.size > 0 && (
          <div className="flex items-center gap-4 p-3 mb-4 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-sm text-foreground">
              {selectedProducts.size} producto(s) seleccionado(s)
            </span>
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusChange('ready')}
              >
                Marcar Listo
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusChange('published')}
              >
                Publicar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar productos</AlertDialogTitle>
                    <AlertDialogDescription>
                      {'Se eliminaran ' + selectedProducts.size + ' producto(s). Esta accion no se puede deshacer.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {/* Products list */}
        {filteredProducts.length > 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {/* Table header */}
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-border bg-secondary/50 text-sm font-medium text-muted-foreground">
                <div className="flex items-center">
                  <Checkbox
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                </div>
                <div>Producto</div>
                <div className="text-center">Costo</div>
                <div className="text-center">Precio</div>
                <div className="text-center">Margen</div>
                <div className="text-center">Estado</div>
              </div>

              {/* Table rows */}
              {filteredProducts.map((product) => {
                const profit = product.price - product.originalPrice
                const margin = product.price === 0 ? 0 : ((profit / product.price) * 100).toFixed(0)
                
                return (
                  <div
                    key={product.id}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-4 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors items-center"
                  >
                    <div>
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={(checked) =>
                          handleSelectProduct(product.id, checked as boolean)
                        }
                      />
                    </div>
                    
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-secondary relative">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {product.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{product.supplier}</span>
                          {product.rating > 0 && (
                            <>
                              <span className="text-muted-foreground/50">|</span>
                              <span className="flex items-center">
                                <Star className="w-3 h-3 mr-0.5 fill-yellow-500 text-yellow-500" />
                                {product.rating.toFixed(1)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                      ${product.originalPrice.toFixed(2)}
                    </div>

                    <div className="text-center text-sm font-medium text-foreground">
                      ${product.price.toFixed(2)}
                    </div>

                    <div className="text-center">
                      <span
                        className={`text-sm font-medium ${
                          profit >= 0 ? 'text-primary' : 'text-destructive'
                        }`}
                      >
                        {margin}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      {getStatusBadge(product.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {product.sourceUrl && (
                            <DropdownMenuItem asChild>
                              <a
                                href={product.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Ver Original
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {products.length === 0 ? 'No hay productos' : 'No se encontraron resultados'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {products.length === 0
                ? 'Importa tu primer producto desde Alibaba para comenzar'
                : 'Intenta con otros terminos de busqueda o filtros'}
            </p>
            {products.length === 0 && (
              <Button asChild>
                <Link href="/import">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Productos
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Product Editor Modal */}
      {editingProduct && (
        <ProductEditor
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  )
}
