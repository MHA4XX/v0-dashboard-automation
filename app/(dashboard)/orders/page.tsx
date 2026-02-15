'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Header } from '@/components/dashboard/header'
import { OrderList } from '@/components/dashboard/order-list'
import { useOrders, loadShopifySettings, saveShopifySettings } from '@/hooks/use-orders'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  RefreshCw,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Zap,
  Hand,
  ShoppingBag,
  Loader2,
} from 'lucide-react'
import type { ShopifySettings } from '@/lib/types'

export default function OrdersPage() {
  const {
    orders,
    confirmOrder,
    fulfillOrder,
    cancelOrder,
    updateTracking,
    updateShippingStatus,
    syncFromShopify,
    pendingCount,
    confirmedCount,
    fulfilledCount,
    cancelledCount,
  } = useOrders()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modeFilter, setModeFilter] = useState<string>('all')
  const [settings, setSettings] = useState<ShopifySettings>({ storeUrl: '', apiToken: '', webhookUrl: '', orderMode: 'manual', connected: false })
  const [syncing, setSyncing] = useState(false)
  const autoSyncRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setSettings(loadShopifySettings())
  }, [])

  const handleToggleMode = useCallback((checked: boolean) => {
    const newSettings = { ...settings, orderMode: checked ? 'auto' as const : 'manual' as const }
    setSettings(newSettings)
    saveShopifySettings(newSettings)
  }, [settings])

  const handleSync = useCallback(() => {
    setSyncing(true)
    // Simulate sync delay
    setTimeout(() => {
      syncFromShopify()
      setSyncing(false)
    }, 1200)
  }, [syncFromShopify])

  // Auto-sync when in auto mode
  useEffect(() => {
    if (settings.orderMode === 'auto') {
      autoSyncRef.current = setInterval(() => {
        syncFromShopify()
      }, 30000) // Auto-sync every 30 seconds
    }
    return () => {
      if (autoSyncRef.current) clearInterval(autoSyncRef.current)
    }
  }, [settings.orderMode, syncFromShopify])

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (modeFilter !== 'all' && o.mode !== modeFilter) return false
    return true
  })

  const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalPrice, 0)

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Pedidos"
        description="Gestiona los pedidos de Shopify con modo automatico o manual"
      />

      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{confirmedCount}</p>
                  <p className="text-xs text-muted-foreground">Confirmados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{fulfilledCount}</p>
                  <p className="text-xs text-muted-foreground">Enviados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-9 bg-secondary text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="fulfilled">Enviados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="w-[140px] h-9 bg-secondary text-sm">
                <SelectValue placeholder="Modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="auto">Automatico</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            {filteredOrders.length !== orders.length && (
              <Badge variant="secondary" className="text-xs">
                {filteredOrders.length} de {orders.length}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Auto/Manual Toggle */}
            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
              <Hand className={`w-4 h-4 ${settings.orderMode === 'manual' ? 'text-foreground' : 'text-muted-foreground'}`} />
              <Switch
                checked={settings.orderMode === 'auto'}
                onCheckedChange={handleToggleMode}
              />
              <Zap className={`w-4 h-4 ${settings.orderMode === 'auto' ? 'text-primary' : 'text-muted-foreground'}`} />
              <Label className="text-xs text-muted-foreground">
                {settings.orderMode === 'auto' ? 'Automatico' : 'Manual'}
              </Label>
              {settings.orderMode === 'auto' && (
                <Badge className="bg-primary/20 text-primary text-[10px] border-0">LIVE</Badge>
              )}
            </div>

            <Button onClick={handleSync} disabled={syncing} variant="secondary" size="sm">
              {syncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sincronizar Shopify
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <OrderList
          orders={filteredOrders}
          onConfirm={confirmOrder}
          onFulfill={fulfillOrder}
          onCancel={cancelOrder}
          onUpdateTracking={updateTracking}
          onUpdateShippingStatus={updateShippingStatus}
        />
      </div>
    </div>
  )
}
