'use client'

import { useState } from 'react'
import type { Order } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Package,
  Truck,
  MapPin,
  Mail,
  Phone,
  User,
  Calendar,
  Hash,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Send,
  Copy,
} from 'lucide-react'

interface OrderDetailProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
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
  pending: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400' },
  processing: { label: 'Procesando', color: 'bg-blue-500/20 text-blue-400' },
  shipped: { label: 'Enviado', color: 'bg-emerald-500/20 text-emerald-400' },
  delivered: { label: 'Entregado', color: 'bg-primary/20 text-primary' },
}

export function OrderDetail({
  order,
  open,
  onOpenChange,
  onConfirm,
  onFulfill,
  onCancel,
  onUpdateTracking,
  onUpdateShippingStatus,
}: OrderDetailProps) {
  const [trackingInput, setTrackingInput] = useState('')
  const [showTrackingForm, setShowTrackingForm] = useState(false)

  if (!order) return null

  const sc = statusConfig[order.status]
  const StatusIcon = sc.icon
  const ssc = shippingStatusConfig[order.shippingStatus]

  const handleFulfillWithTracking = () => {
    onFulfill(order.id, trackingInput || undefined)
    setTrackingInput('')
    setShowTrackingForm(false)
  }

  const handleCopyTracking = () => {
    if (order.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Pedido {order.orderNumber}
            </DialogTitle>
            <Badge className={sc.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {sc.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Order Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="w-3.5 h-3.5" />
              <span>Shopify: {order.shopifyOrderId || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(order.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Modo: {order.mode === 'auto' ? 'Automatico' : 'Manual'}</Badge>
            </div>
            <div>
              <Badge className={ssc.color + ' text-xs'}>Envio: {ssc.label}</Badge>
            </div>
          </div>

          <Separator />

          {/* Customer */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Cliente</h4>
            <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-foreground font-medium">{order.customer.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{order.customer.email}</span>
              </div>
              {order.customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{order.customer.phone}</span>
                </div>
              )}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  {order.customer.address}, {order.customer.city}
                  {order.customer.state && `, ${order.customer.state}`} {order.customer.zip}, {order.customer.country}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Products */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Productos ({order.items.length})</h4>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3">
                  <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.variant && <span>Variante: {item.variant}</span>}
                      {item.sku && <span>SKU: {item.sku}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} x ${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                Envio ({order.shippingMethod})
              </span>
              <span className="text-foreground">${order.shippingCost.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-foreground flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-primary" />Total
              </span>
              <span className="text-foreground text-lg">${order.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Tracking */}
          {order.trackingNumber && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Numero de Rastreo</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-primary font-mono flex-1">{order.trackingNumber}</code>
                <Button variant="ghost" size="sm" onClick={handleCopyTracking}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Notas</p>
              <p className="text-sm text-foreground">{order.notes}</p>
            </div>
          )}

          {/* Tracking form */}
          {showTrackingForm && (
            <div className="bg-secondary/50 rounded-lg p-3 space-y-3">
              <Label className="text-sm">Numero de Rastreo</Label>
              <Input
                placeholder="Ej: EP123456789CN"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                className="bg-background"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleFulfillWithTracking}>
                  <Send className="w-3.5 h-3.5 mr-1.5" />Confirmar Envio
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowTrackingForm(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* Shipping status update */}
          {order.status !== 'cancelled' && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Estado envio:</Label>
              <Select value={order.shippingStatus} onValueChange={(val) => onUpdateShippingStatus(order.id, val as Order['shippingStatus'])}>
                <SelectTrigger className="h-8 text-xs bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="processing">Procesando</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {order.status === 'pending' && (
              <>
                <Button onClick={() => onConfirm(order.id)} className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />Confirmar Pedido
                </Button>
                <Button variant="destructive" onClick={() => onCancel(order.id)}>
                  <XCircle className="w-4 h-4 mr-2" />Cancelar
                </Button>
              </>
            )}
            {order.status === 'confirmed' && (
              <>
                <Button onClick={() => setShowTrackingForm(true)} className="flex-1">
                  <Truck className="w-4 h-4 mr-2" />Marcar como Enviado
                </Button>
                <Button variant="destructive" onClick={() => onCancel(order.id)}>
                  <XCircle className="w-4 h-4 mr-2" />Cancelar
                </Button>
              </>
            )}
            {order.status === 'fulfilled' && !order.trackingNumber && (
              <Button variant="secondary" onClick={() => setShowTrackingForm(true)} className="flex-1">
                <Hash className="w-4 h-4 mr-2" />Agregar Tracking
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
