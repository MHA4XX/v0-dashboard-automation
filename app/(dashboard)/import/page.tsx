'use client'

import { Header } from '@/components/dashboard/header'
import { ImportForm } from '@/components/dashboard/import-form'
import { useProducts } from '@/hooks/use-products'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, ArrowRight, Sparkles, ShoppingBag, Globe, Truck, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

export default function ImportPage() {
  const { products, addProducts } = useProducts()

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Importar Productos"
        description="Importa productos de cualquier tienda online con informacion completa"
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <ImportForm onImport={addProducts} />

            <Card className="bg-card border-border mt-6">
              <CardHeader>
                <CardTitle className="text-foreground text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Como Funciona
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        Pega la URL del Producto
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Funciona con Amazon, eBay, Alibaba, AliExpress, Etsy, Walmart, Temu, Shein, Shopify y cualquier otra tienda online
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        Datos Completos Automaticos
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Se extraen titulo, precio, imagenes, variantes, metodos de envio con costos reales, peso, SKU y mas
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <Store className="w-4 h-4 text-muted-foreground" />
                        Importacion Masiva
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Importa hasta 50 productos de golpe, incluso de diferentes tiendas mezcladas
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                        Publica en Shopify
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Exporta tus productos directamente a tu tienda Shopify
                      </p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border h-fit">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Importados Recientemente</CardTitle>
              {products.length > 0 && (
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  {products.length} total
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="space-y-3">
                  {products.slice(0, 6).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-secondary relative">
                        {product.images[0] ? (
                          <Image src={product.images[0]} alt={product.title} fill className="object-cover" sizes="48px" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="w-3 h-3 text-primary" />
                          <span>${product.price.toFixed(2)}</span>
                          {product.source && (
                            <>
                              <span className="text-muted-foreground/50">|</span>
                              <span>{product.source}</span>
                            </>
                          )}
                          {product.shippingMethods && product.shippingMethods.length > 0 && (
                            <>
                              <span className="text-muted-foreground/50">|</span>
                              <Truck className="w-3 h-3" />
                              <span>{product.shippingMethods.length} envios</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs flex-shrink-0">
                        {product.status === 'draft' ? 'Borrador' : product.status === 'ready' ? 'Listo' : 'Publicado'}
                      </Badge>
                    </div>
                  ))}
                  {products.length > 6 && (
                    <p className="text-xs text-center text-muted-foreground">+{products.length - 6} productos mas</p>
                  )}
                  <Button asChild className="w-full mt-4">
                    <Link href="/products">
                      Ver Todos los Productos
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay productos importados</p>
                  <p className="text-sm text-muted-foreground">Usa el formulario para importar tu primer producto</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
