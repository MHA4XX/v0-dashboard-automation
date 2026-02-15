export interface ShippingMethod {
  id: string
  name: string
  cost: number
  estimatedDays: string
  carrier: string
}

export interface ProductVariant {
  id: string
  name: string
  options: string[]
  price?: number
  sku?: string
  inventory?: number
  weight?: number
}

export interface Product {
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
  shippingCost?: number
  shippingMethods: ShippingMethod[]
  weight?: string
  dimensions?: string
  sku?: string
  barcode?: string
  tags: string[]
  rating: number
  reviews: number
  variants: ProductVariant[]
  status: 'draft' | 'ready' | 'published'
  alibabaUrl?: string
  sourceUrl?: string
  source?: string
  shopifyId?: string
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  productId: string
  title: string
  image: string
  quantity: number
  price: number
  variant?: string
  sku?: string
}

export interface OrderCustomer {
  name: string
  email: string
  phone?: string
  address: string
  city: string
  state?: string
  zip: string
  country: string
}

export interface Order {
  id: string
  shopifyOrderId?: string
  orderNumber: string
  customer: OrderCustomer
  items: OrderItem[]
  shippingMethod: string
  shippingCost: number
  shippingStatus: 'pending' | 'processing' | 'shipped' | 'delivered'
  trackingNumber?: string
  subtotal: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled'
  mode: 'auto' | 'manual'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface ImportSession {
  id: string
  url: string
  status: 'pending' | 'importing' | 'completed' | 'error'
  productsFound: number
  productsImported: number
  error?: string
  createdAt: Date
}

export interface ShopifySettings {
  storeUrl: string
  apiToken: string
  webhookUrl: string
  orderMode: 'auto' | 'manual'
  connected: boolean
}
