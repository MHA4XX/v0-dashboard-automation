'use client'

import useSWR, { mutate as globalMutate } from 'swr'
import type { Order, ShopifySettings } from '@/lib/types'
import { sampleOrders } from '@/lib/store'

const STORAGE_KEY = 'dropship-orders'
const SETTINGS_KEY = 'dropship-shopify-settings'
const SWR_KEY = 'orders'

function loadOrders(): Order[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleOrders))
      return sampleOrders.map((o) => ({
        ...o,
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt),
      }))
    }
    const parsed = JSON.parse(saved)
    return parsed.map((o: Order) => ({
      ...o,
      createdAt: new Date(o.createdAt),
      updatedAt: new Date(o.updatedAt),
    }))
  } catch {
    return []
  }
}

function persistOrders(orders: Order[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch (e) {
    console.error('Failed to persist orders:', e)
  }
}

export function loadShopifySettings(): ShopifySettings {
  if (typeof window === 'undefined')
    return { storeUrl: '', apiToken: '', webhookUrl: '', orderMode: 'manual', connected: false }
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { storeUrl: '', apiToken: '', webhookUrl: '', orderMode: 'manual', connected: false }
}

export function saveShopifySettings(settings: ShopifySettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function useOrders() {
  const { data: orders = [], isLoading } = useSWR<Order[]>(
    SWR_KEY,
    () => loadOrders(),
    {
      fallbackData: [],
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  const saveOrders = (newOrders: Order[]) => {
    persistOrders(newOrders)
    globalMutate(SWR_KEY, newOrders, false)
  }

  const addOrder = (order: Order) => {
    const updated = [order, ...orders]
    saveOrders(updated)
  }

  const updateOrder = (updatedOrder: Order) => {
    const updated = orders.map((o) =>
      o.id === updatedOrder.id
        ? { ...updatedOrder, updatedAt: new Date() }
        : o
    )
    saveOrders(updated)
  }

  const deleteOrder = (id: string) => {
    const updated = orders.filter((o) => o.id !== id)
    saveOrders(updated)
  }

  const confirmOrder = (id: string) => {
    const updated = orders.map((o) =>
      o.id === id
        ? { ...o, status: 'confirmed' as const, updatedAt: new Date() }
        : o
    )
    saveOrders(updated)
  }

  const fulfillOrder = (id: string, trackingNumber?: string) => {
    const updated = orders.map((o) =>
      o.id === id
        ? {
            ...o,
            status: 'fulfilled' as const,
            shippingStatus: 'shipped' as const,
            trackingNumber: trackingNumber || o.trackingNumber,
            updatedAt: new Date(),
          }
        : o
    )
    saveOrders(updated)
  }

  const cancelOrder = (id: string) => {
    const updated = orders.map((o) =>
      o.id === id
        ? { ...o, status: 'cancelled' as const, updatedAt: new Date() }
        : o
    )
    saveOrders(updated)
  }

  const updateTracking = (id: string, trackingNumber: string) => {
    const updated = orders.map((o) =>
      o.id === id
        ? { ...o, trackingNumber, shippingStatus: 'shipped' as const, updatedAt: new Date() }
        : o
    )
    saveOrders(updated)
  }

  const updateShippingStatus = (id: string, shippingStatus: Order['shippingStatus']) => {
    const updated = orders.map((o) =>
      o.id === id
        ? { ...o, shippingStatus, updatedAt: new Date() }
        : o
    )
    saveOrders(updated)
  }

  const syncFromShopify = () => {
    // Simulate receiving new orders from Shopify
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      shopifyOrderId: `#SH-${Math.floor(1000 + Math.random() * 9000)}`,
      orderNumber: `ORD-2026-${String(orders.length + 1).padStart(3, '0')}`,
      customer: {
        name: ['Sofia Garcia', 'James Wilson', 'Ana Rodriguez', 'Michael Chen', 'Laura Kim'][Math.floor(Math.random() * 5)],
        email: `customer${Math.floor(Math.random() * 999)}@example.com`,
        address: `${Math.floor(100 + Math.random() * 9999)} ${['Elm St', 'Maple Dr', 'Cedar Ln', 'Oak Blvd'][Math.floor(Math.random() * 4)]}`,
        city: ['Houston', 'Chicago', 'Phoenix', 'San Diego', 'Dallas'][Math.floor(Math.random() * 5)],
        state: ['TX', 'IL', 'AZ', 'CA', 'TX'][Math.floor(Math.random() * 5)],
        zip: String(10000 + Math.floor(Math.random() * 89999)),
        country: 'US',
      },
      items: [
        {
          productId: String(Math.floor(1 + Math.random() * 5)),
          title: ['Wireless Earbuds TWS 5.0', 'Smart Watch Fitness Tracker', 'Power Bank 20000mAh', 'LED Ring Light 10"', 'Yoga Mat Eco-Friendly'][Math.floor(Math.random() * 5)],
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
          quantity: Math.floor(1 + Math.random() * 3),
          price: Number((10 + Math.random() * 20).toFixed(2)),
          variant: 'Black',
          sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      ],
      shippingMethod: ['ePacket', 'DHL Express', 'Standard', 'FedEx'][Math.floor(Math.random() * 4)],
      shippingCost: Number((3 + Math.random() * 15).toFixed(2)),
      shippingStatus: 'pending',
      subtotal: 0,
      totalPrice: 0,
      status: 'pending',
      mode: loadShopifySettings().orderMode || 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    newOrder.subtotal = newOrder.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    newOrder.totalPrice = Number((newOrder.subtotal + newOrder.shippingCost).toFixed(2))

    const updated = [newOrder, ...orders]
    saveOrders(updated)
    return newOrder
  }

  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const confirmedCount = orders.filter((o) => o.status === 'confirmed').length
  const fulfilledCount = orders.filter((o) => o.status === 'fulfilled').length
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length

  return {
    orders,
    isLoading,
    addOrder,
    updateOrder,
    deleteOrder,
    confirmOrder,
    fulfillOrder,
    cancelOrder,
    updateTracking,
    updateShippingStatus,
    syncFromShopify,
    saveOrders,
    pendingCount,
    confirmedCount,
    fulfilledCount,
    cancelledCount,
  }
}
