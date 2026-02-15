'use client'

import { useMemo } from 'react'
import { Header } from '@/components/dashboard/header'
import { useProducts } from '@/hooks/use-products'
import { useOrders } from '@/hooks/use-orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  TrendingUp,
  Package,
  ShoppingBag,
  Upload,
  ArrowRight,
  DollarSign,
  Star,
  BarChart3,
  Clock,
  ClipboardList,
  Truck,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  fulfilled: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  fulfilled: 'Enviado',
  cancelled: 'Cancelado',
}

export default function DashboardPage() {
  const { products, isLoading } = useProducts()
  const { orders, pendingCount, confirmedCount, fulfilledCount } = useOrders()

  const stats = useMemo(() => {
    const draftCount = products.filter((p) => p.status === 'draft').length
    const readyCount = products.filter((p) => p.status === 'ready').length
    const publishedCount = products.filter((p) => p.status === 'published').length
    const totalProfit = products.reduce((sum, p) => sum + (p.price - p.originalPrice), 0)
    const avgMargin =
      products.length > 0
        ? products.reduce((sum, p) => sum + ((p.price - p.originalPrice) / p.price) * 100, 0) / products.length
        : 0
    const orderRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalPrice, 0)
    return { draftCount, readyCount, publishedCount, totalProfit, avgMargin, orderRevenue }
  }, [products, orders])

  const recentProducts = useMemo(() => products.slice(0, 5), [products])
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" description="Resumen de tu gestion de productos y pedidos" />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Productos</p>
                  <p className="text-2xl font-bold text-foreground">{products.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                  <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                  {pendingCount > 0 && (
                    <p className="text-[10px] text-yellow-400">{pendingCount} pendientes</p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold text-primary">${stats.orderRevenue.toFixed(0)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Margen</p>
                  <p className="text-2xl font-bold text-foreground">{stats.avgMargin.toFixed(0)}%</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Publicados</p>
                  <p className="text-2xl font-bold text-foreground">{stats.publishedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent products */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Productos Recientes
              </CardTitle>
              {products.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/products" className="flex items-center gap-1">
                    Ver Todos <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {recentProducts.length > 0 ? (
                <div className="space-y-3">
                  {recentProducts.map((product) => {
                    const profit = product.price - product.originalPrice
                    return (
                      <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                        <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0 relative">
                          {product.images[0] ? (
                            <Image src={product.images[0]} alt={product.title} fill className="object-cover" sizes="48px" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>${product.price.toFixed(2)}</span>
                            {product.source && (
                              <>
                                <span className="text-muted-foreground/50">|</span>
                                <span>{product.source}</span>
                              </>
                            )}
                            {product.rating > 0 && (
                              <>
                                <span className="text-muted-foreground/50">|</span>
                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                <span>{product.rating.toFixed(1)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-medium ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>+${profit.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">ganancia</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">No hay productos importados</p>
                  <Button asChild>
                    <Link href="/import">
                      <Download className="w-4 h-4 mr-2" />
                      Importar Primer Producto
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Recent Orders */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-foreground text-base flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  Pedidos Recientes
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/orders" className="flex items-center gap-1 text-xs">
                    Ver <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentOrders.length > 0 ? (
                  <div className="space-y-2">
                    {recentOrders.map((order) => (
                      <Link key={order.id} href="/orders" className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{order.orderNumber}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{order.customer.name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-medium text-foreground">${order.totalPrice.toFixed(2)}</p>
                          <Badge className={`${statusColors[order.status]} text-[9px] border-0 px-1.5 py-0`}>
                            {statusLabels[order.status]}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay pedidos aun</p>
                )}
              </CardContent>
            </Card>

            {/* Product status + Quick actions */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Borrador</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-muted-foreground transition-all" style={{ width: `${products.length > 0 ? (stats.draftCount / products.length) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-6 text-right">{stats.draftCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Listo</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-yellow-500 transition-all" style={{ width: `${products.length > 0 ? (stats.readyCount / products.length) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-6 text-right">{stats.readyCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Publicado</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${products.length > 0 ? (stats.publishedCount / products.length) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-6 text-right">{stats.publishedCount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  Acciones Rapidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full justify-start" size="sm">
                  <Link href="/import">
                    <Download className="w-4 h-4 mr-2" />
                    Importar Productos
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="w-full justify-start" size="sm">
                  <Link href="/orders">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Gestionar Pedidos
                    {pendingCount > 0 && <Badge className="ml-auto bg-destructive text-destructive-foreground text-[10px] border-0">{pendingCount}</Badge>}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <Link href="/export">
                    <Upload className="w-4 h-4 mr-2" />
                    Exportar a Shopify
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
