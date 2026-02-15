'use client'

import { useState, useCallback } from 'react'
import type { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Download,
  Link,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
  Globe,
  ImageIcon,
  DollarSign,
  Star,
  Truck,
  X,
  Plus,
  ExternalLink,
  RefreshCw,
  Weight,
  Tag,
  Box,
} from 'lucide-react'

interface ImportFormProps {
  onImport: (products: Product[]) => void
}

interface ScrapedPreview {
  id: string
  title: string
  description: string
  price: number
  originalPrice: number
  currency: string
  images: string[]
  category: string
  supplier: string
  minOrder: number
  shippingTime: string
  shippingCost: number
  shippingMethods: { id: string; name: string; cost: number; estimatedDays: string; carrier: string }[]
  weight: string
  dimensions: string
  sku: string
  tags: string[]
  rating: number
  reviews: number
  variants: { id: string; name: string; options: string[]; price?: number; sku?: string; inventory?: number }[]
  sourceUrl: string
  source: string
  status: 'draft' | 'ready' | 'published'
  createdAt: string
  updatedAt: string
}

export function ImportForm({ onImport }: ImportFormProps) {
  const [url, setUrl] = useState('')
  const [bulkUrls, setBulkUrls] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importedCount, setImportedCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [previewProduct, setPreviewProduct] = useState<ScrapedPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [bulkResults, setBulkResults] = useState<{ url: string; status: 'pending' | 'importing' | 'success' | 'error'; product?: ScrapedPreview; error?: string }[]>([])
  const [bulkProgress, setBulkProgress] = useState(0)

  const fetchProductPreview = useCallback(async (productUrl: string) => {
    setPreviewLoading(true)
    setErrorMessage('')
    setPreviewProduct(null)
    setImportStatus('idle')

    try {
      const response = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product')
      }

      setPreviewProduct(data.product)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch product data')
      setImportStatus('error')
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  const handlePreview = () => {
    if (!url.trim()) return
    fetchProductPreview(url.trim())
  }

  const handleConfirmImport = () => {
    if (!previewProduct) return

    const product: Product = {
      ...previewProduct,
      shippingMethods: previewProduct.shippingMethods || [],
      tags: previewProduct.tags || [],
      createdAt: new Date(previewProduct.createdAt),
      updatedAt: new Date(previewProduct.updatedAt),
    }

    onImport([product])
    setImportedCount(1)
    setImportStatus('success')
    setPreviewProduct(null)
    setUrl('')
  }

  const handleBulkImport = async () => {
    const urls = bulkUrls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && (u.startsWith('http://') || u.startsWith('https://')))

    if (urls.length === 0) return

    setIsImporting(true)
    setImportStatus('idle')
    setBulkProgress(0)
    const initialResults = urls.map((u) => ({ url: u, status: 'pending' as const }))
    setBulkResults(initialResults)

    const importedProducts: Product[] = []
    const newResults = [...initialResults]

    for (let i = 0; i < urls.length; i++) {
      newResults[i] = { ...newResults[i], status: 'importing' }
      setBulkResults([...newResults])

      try {
        const response = await fetch('/api/scrape-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urls[i] }),
        })

        const data = await response.json()

        if (response.ok && data.product) {
          newResults[i] = { url: urls[i], status: 'success', product: data.product }
          importedProducts.push({
            ...data.product,
            shippingMethods: data.product.shippingMethods || [],
            tags: data.product.tags || [],
            createdAt: new Date(data.product.createdAt),
            updatedAt: new Date(data.product.updatedAt),
          })
        } else {
          newResults[i] = { url: urls[i], status: 'error', error: data.error || 'Failed' }
        }
      } catch (err) {
        newResults[i] = { url: urls[i], status: 'error', error: err instanceof Error ? err.message : 'Network error' }
      }

      setBulkResults([...newResults])
      setBulkProgress(Math.round(((i + 1) / urls.length) * 100))

      // Delay between requests
      if (i < urls.length - 1) {
        await new Promise((r) => setTimeout(r, 800))
      }
    }

    if (importedProducts.length > 0) {
      onImport(importedProducts)
      setImportedCount(importedProducts.length)
      setImportStatus('success')
    } else {
      setImportStatus('error')
      setErrorMessage('No se pudieron importar productos')
    }

    setIsImporting(false)
  }

  const clearPreview = () => {
    setPreviewProduct(null)
    setUrl('')
    setImportStatus('idle')
    setErrorMessage('')
  }

  const bulkUrlCount = bulkUrls.split('\n').filter((u) => u.trim().startsWith('http')).length

  return (
    <div className="space-y-6">
      <Tabs defaultValue="url" className="w-full">
        <TabsList className="w-full bg-secondary">
          <TabsTrigger value="url" className="flex-1">
            <Link className="w-4 h-4 mr-2" />
            Importar por URL
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex-1">
            <FileText className="w-4 h-4 mr-2" />
            Masivo (20+)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Importar de Cualquier Tienda Online
              </CardTitle>
              <CardDescription>
                Pega la URL de un producto de cualquier tienda: Amazon, eBay, Alibaba, AliExpress, Etsy, Walmart, Temu, Shein, Shopify stores y mas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-url">URL del Producto</Label>
                <div className="flex gap-2">
                  <Input
                    id="product-url"
                    placeholder="https://www.amazon.com/dp/... o cualquier tienda online"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePreview()}
                    className="bg-secondary border-border flex-1"
                  />
                  <Button onClick={handlePreview} disabled={previewLoading || !url.trim()} variant="secondary" size="icon">
                    {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Amazon', 'eBay', 'Alibaba', 'AliExpress', 'Etsy', 'Walmart', 'Temu', 'Shein', 'Shopify', 'DHgate'].map((store) => (
                    <Badge key={store} variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-border">
                      {store}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">
                    + cualquier tienda
                  </Badge>
                </div>
              </div>

              {previewLoading && (
                <div className="flex items-center justify-center py-12 border border-dashed border-border rounded-lg">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Extrayendo datos del producto...</p>
                    <p className="text-xs text-muted-foreground">Analizando titulo, precio, imagenes, envio y mas</p>
                  </div>
                </div>
              )}

              {previewProduct && !previewLoading && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-secondary/50 px-4 py-3 flex items-center justify-between border-b border-border">
                    <span className="font-medium text-foreground flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Vista Previa del Producto
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{previewProduct.source}</Badge>
                      <Button variant="ghost" size="sm" onClick={clearPreview}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="flex gap-4">
                      <div className="w-28 h-28 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                        {previewProduct.images[0] ? (
                          <img src={previewProduct.images[0]} alt={previewProduct.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{previewProduct.title}</h3>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            <DollarSign className="w-3 h-3 mr-0.5" />${previewProduct.price.toFixed(2)}
                          </Badge>
                          {previewProduct.rating > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="w-3 h-3 mr-0.5 fill-yellow-500 text-yellow-500" />{previewProduct.rating.toFixed(1)}
                              {previewProduct.reviews > 0 && <span className="ml-0.5 opacity-70">({previewProduct.reviews})</span>}
                            </Badge>
                          )}
                          {previewProduct.sku && (
                            <Badge variant="secondary" className="text-xs">
                              SKU: {previewProduct.sku}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{previewProduct.description}</p>
                      </div>
                    </div>

                    {/* Shipping Info */}
                    {previewProduct.shippingMethods && previewProduct.shippingMethods.length > 0 && (
                      <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-primary" />Metodos de Envio
                        </p>
                        <div className="grid gap-1.5">
                          {previewProduct.shippingMethods.map((method) => (
                            <div key={method.id} className="flex items-center justify-between text-xs bg-background/50 rounded px-2.5 py-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-foreground font-medium">{method.name}</span>
                                <span className="text-muted-foreground">via {method.carrier}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">{method.estimatedDays} dias</span>
                                <span className="text-foreground font-medium">
                                  {method.cost === 0 ? 'Gratis' : `$${method.cost.toFixed(2)}`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-start gap-1.5">
                        <Package className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground block">Proveedor</span>
                          <p className="text-foreground">{previewProduct.supplier}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Box className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground block">Min. Orden</span>
                          <p className="text-foreground">{previewProduct.minOrder} uds</p>
                        </div>
                      </div>
                      {previewProduct.weight && (
                        <div className="flex items-start gap-1.5">
                          <Weight className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="text-muted-foreground block">Peso</span>
                            <p className="text-foreground">{previewProduct.weight}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground block">Imagenes</span>
                          <p className="text-foreground">{previewProduct.images.length} encontradas</p>
                        </div>
                      </div>
                    </div>

                    {previewProduct.variants.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Variantes:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {previewProduct.variants.map((v) => (
                            <Badge key={v.id} variant="outline" className="text-[10px]">
                              {v.name}: {v.options.slice(0, 4).join(', ')}{v.options.length > 4 ? ` +${v.options.length - 4}` : ''}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {previewProduct.tags && previewProduct.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <Tag className="w-3 h-3 text-muted-foreground" />
                        {previewProduct.tags.slice(0, 6).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] text-muted-foreground">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <a
                      href={previewProduct.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Ver producto original <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="bg-secondary/30 px-4 py-3 border-t border-border flex gap-2">
                    <Button onClick={handleConfirmImport} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Importar Producto
                    </Button>
                    <Button variant="outline" onClick={clearPreview}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {!previewProduct && !previewLoading && (
                <Button onClick={handlePreview} disabled={!url.trim()} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Obtener Datos del Producto
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Importacion Masiva (hasta 50 productos)
              </CardTitle>
              <CardDescription>
                Importa hasta 50 productos a la vez de cualquier tienda online. Pega una URL por linea.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bulk-urls">URLs de Productos (una por linea)</Label>
                  <Badge variant={bulkUrlCount > 50 ? 'destructive' : bulkUrlCount > 0 ? 'secondary' : 'outline'} className="text-xs">
                    {bulkUrlCount} / 50 URLs
                  </Badge>
                </div>
                <Textarea
                  id="bulk-urls"
                  placeholder={`https://www.amazon.com/dp/producto-1...\nhttps://www.alibaba.com/product-detail/producto-2...\nhttps://www.ebay.com/itm/producto-3...\nhttps://www.etsy.com/listing/producto-4...\nhttps://www.walmart.com/ip/producto-5...\n\nPuedes mezclar URLs de diferentes tiendas`}
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                  className="bg-secondary border-border min-h-[200px] font-mono text-xs leading-relaxed"
                />
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progreso de importacion</span>
                    <span className="text-foreground font-medium">{bulkProgress}%</span>
                  </div>
                  <Progress value={bulkProgress} className="h-2" />
                </div>
              )}

              {bulkResults.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-secondary/50 px-4 py-2 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">Resultados</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-primary">{bulkResults.filter((r) => r.status === 'success').length} OK</span>
                      <span className="text-destructive">{bulkResults.filter((r) => r.status === 'error').length} Error</span>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-border/50">
                    {bulkResults.map((result, i) => (
                      <div key={i} className="px-3 py-2 flex items-center gap-2">
                        {result.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />}
                        {result.status === 'importing' && <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />}
                        {result.status === 'success' && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
                        {result.status === 'error' && <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          {result.product ? (
                            <div className="flex items-center gap-2">
                              {result.product.images[0] && (
                                <img src={result.product.images[0]} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                              )}
                              <span className="text-xs text-foreground truncate">{result.product.title}</span>
                              <Badge variant="secondary" className="text-[10px] flex-shrink-0">${result.product.price.toFixed(2)}</Badge>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground truncate block">{result.url}</span>
                          )}
                          {result.error && <span className="text-[10px] text-destructive block">{result.error}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleBulkImport} disabled={isImporting || bulkUrlCount === 0 || bulkUrlCount > 50} className="w-full">
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando {bulkUrlCount} productos...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Importar {bulkUrlCount} Producto{bulkUrlCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {importStatus === 'success' && (
        <Alert className="bg-primary/10 border-primary/20">
          <CheckCircle className="w-4 h-4 text-primary" />
          <AlertDescription className="text-foreground">
            Se importaron {importedCount} producto{importedCount > 1 ? 's' : ''} exitosamente con toda su informacion de envio. Ve a Productos para editarlos y publicarlos.
          </AlertDescription>
        </Alert>
      )}

      {importStatus === 'error' && errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
