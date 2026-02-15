'use client'

import { useState, useEffect } from 'react'
import type { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  Store,
  CheckCircle,
  AlertCircle,
  Loader2,
  Link2,
  ShoppingBag,
} from 'lucide-react'
import Image from 'next/image'
import { loadShopifySettings } from '@/hooks/use-orders'

interface ExportPanelProps {
  products: Product[]
  onExport: (productIds: string[]) => void
}

export function ExportPanel({ products, onExport }: ExportPanelProps) {
  const [shopifyStore, setShopifyStore] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isConnected, setIsConnected] = useState(false)

  // Load saved Shopify settings on mount
  useEffect(() => {
    const saved = loadShopifySettings()
    if (saved.storeUrl) setShopifyStore(saved.storeUrl)
    if (saved.apiToken) setApiKey(saved.apiToken)
    if (saved.connected) setIsConnected(true)
  }, [])

  const readyProducts = products.filter((p) => p.status === 'ready' || p.status === 'draft')

  const handleSelectAll = () => {
    if (selectedProducts.length === readyProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(readyProducts.map((p) => p.id))
    }
  }

  const handleToggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleConnect = async () => {
    if (!shopifyStore.trim() || !apiKey.trim()) return
    
    setIsExporting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsConnected(true)
    setIsExporting(false)
  }

  const handleExport = async () => {
    if (selectedProducts.length === 0) return

    setIsExporting(true)
    setExportStatus('idle')

    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 2500))

    onExport(selectedProducts)
    setExportStatus('success')
    setIsExporting(false)
    setSelectedProducts([])
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Conexion Shopify
          </CardTitle>
          <CardDescription>
            Conecta tu tienda Shopify para publicar productos directamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="store-url">URL de la Tienda</Label>
                <Input
                  id="store-url"
                  placeholder="tu-tienda.myshopify.com"
                  value={shopifyStore}
                  onChange={(e) => setShopifyStore(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">Admin API Access Token</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="shpat_xxxxxxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              <Button
                onClick={handleConnect}
                disabled={isExporting || !shopifyStore.trim() || !apiKey.trim()}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Conectar Tienda
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{shopifyStore}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-primary" />
                    Conectado
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsConnected(false)}
                className="w-full"
              >
                Desconectar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Seleccionar Productos para Exportar
              </CardTitle>
              <CardDescription>
                Elige que productos publicar en tu tienda Shopify
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {selectedProducts.length === readyProducts.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {readyProducts.length > 0 ? (
                readyProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedProducts.includes(product.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-secondary hover:bg-secondary/80'
                    }`}
                    onClick={() => handleToggleProduct(product.id)}
                  >
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => handleToggleProduct(product.id)}
                    />
                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {product.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        product.status === 'ready'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {product.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay productos disponibles para exportar</p>
                  <p className="text-sm text-muted-foreground">Importa productos primero</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <Button
            onClick={handleExport}
            disabled={!isConnected || selectedProducts.length === 0 || isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Exportar {selectedProducts.length} Producto{selectedProducts.length !== 1 ? 's' : ''} a Shopify
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {exportStatus === 'success' && (
        <Alert className="lg:col-span-2 bg-primary/10 border-primary/20">
          <CheckCircle className="w-4 h-4 text-primary" />
          <AlertDescription className="text-foreground">
            Productos exportados exitosamente. Ya estan disponibles en tu tienda Shopify.
          </AlertDescription>
        </Alert>
      )}

      {exportStatus === 'error' && (
        <Alert variant="destructive" className="lg:col-span-2">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Error al exportar productos. Verifica tu conexion e intenta de nuevo.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
