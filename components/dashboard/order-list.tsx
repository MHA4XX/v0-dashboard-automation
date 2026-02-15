'use client'

import { useState } from 'react'
import type { Order } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Send,
  Ban,
  ShoppingBag,
} from 'lucide-react'
import { OrderDetail } from './order-detail'

interface OrderListProps {
  orders: Order[]
  onConfirm: (id: string) => void
  onFulfill: (id: string, tracking?: string) => void
  onCancel: (id: string) => void
  onUpdateTracking: (id: string, tracking: string) => void
  onUpdateShippingStatus: (id: string, status: Order['shippingStatus']) => void
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle },
  fulfilled: { label: 'Enviado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Truck },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
}

const shippingStatusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-500/15 text-yellow-400' },
  processing: { label: 'Procesando', color: 'bg-blue-500/15 text-blue-400' },
  shipped: { label: 'Enviado', color: 'bg-emerald-500/15 text-emerald-400' },
  delivered: { label: 'Entregado', color: 'bg-primary/15 text-primary' },
}

export function OrderList({
  orders,
  onConfirm,
  onFulfill,
  onCancel,
  onUpdateTracking,
  onUpdateShippingStatus,
}: OrderListProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setDetailOpen(true)
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">No hay pedidos</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Los pedidos de Shopify apareceran aqui. Usa el boton de sincronizar para obtener nuevos pedidos.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="text-muted-foreground font-medium text-xs">Pedido</TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs">Cliente</TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs">Productos</TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs text-right">Total</TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs">Envio</TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs">Estado</TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs">Modo</TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const sc = statusConfig[order.status]
              const StatusIcon = sc.icon
              const ssc = shippingStatusConfig[order.shippingStatus]

              return (
                <TableRow key={order.id} className="hover:bg-secondary/30 cursor-pointer" onClick={() => handleViewOrder(order)}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                      <p className="text-[10px] text-muted-foreground">{order.shopifyOrderId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-foreground">{order.customer.name}</p>
                      <p className="text-[10px] text-muted-foreground">{order.customer.city}, {order.customer.country}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="w-7 h-7 rounded bg-secondary overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{order.items.length - 2}</span>
                      )}
                      <span className="text-xs text-muted-foreground ml-1">
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} uds
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-medium text-foreground">${order.totalPrice.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge className={ssc.color + ' text-[10px] border-0'}>{ssc.label}</Badge>
                      {order.trackingNumber && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{order.trackingNumber}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={sc.color + ' text-[10px]'}>
                      <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                      {sc.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {order.mode === 'auto' ? 'Auto' : 'Manual'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleViewOrder(order)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {order.status === 'pending' && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary" onClick={() => onConfirm(order.id)}>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {order.status === 'confirmed' && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-400" onClick={() => onFulfill(order.id)}>
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {(order.status === 'pending' || order.status === 'confirmed') && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => onCancel(order.id)}>
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <OrderDetail
        order={selectedOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onConfirm={(id) => { onConfirm(id); setDetailOpen(false) }}
        onFulfill={(id, tracking) => { onFulfill(id, tracking); setDetailOpen(false) }}
        onCancel={(id) => { onCancel(id); setDetailOpen(false) }}
        onUpdateTracking={onUpdateTracking}
        onUpdateShippingStatus={onUpdateShippingStatus}
      />
    </>
  )
}
