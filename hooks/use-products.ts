'use client'

import useSWR, { mutate as globalMutate } from 'swr'
import type { Product } from '@/lib/types'
import { sampleProducts } from '@/lib/store'

const STORAGE_KEY = 'dropship-imported-products'
const SWR_KEY = 'products'

function loadProducts(): Product[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      // First time: seed with sample products
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleProducts))
      return sampleProducts.map((p) => ({
        ...p,
        shippingMethods: p.shippingMethods || [],
        tags: p.tags || [],
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }))
    }
    const parsed = JSON.parse(saved)
    return parsed.map((p: Product) => ({
      ...p,
      shippingMethods: p.shippingMethods || [],
      tags: p.tags || [],
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }))
  } catch {
    return []
  }
}

function persistProducts(products: Product[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  } catch (e) {
    console.error('Failed to persist products:', e)
  }
}

export function useProducts() {
  const { data: products = [], isLoading } = useSWR<Product[]>(
    SWR_KEY,
    () => loadProducts(),
    {
      fallbackData: [],
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  const saveProducts = (newProducts: Product[]) => {
    persistProducts(newProducts)
    globalMutate(SWR_KEY, newProducts, false)
  }

  const addProducts = (newProducts: Product[]) => {
    const normalized = newProducts.map((p) => ({
      ...p,
      shippingMethods: p.shippingMethods || [],
      tags: p.tags || [],
    }))
    const updated = [...normalized, ...products]
    saveProducts(updated)
  }

  const updateProduct = (updatedProduct: Product) => {
    const updated = products.map((p) =>
      p.id === updatedProduct.id
        ? { ...updatedProduct, updatedAt: new Date() }
        : p
    )
    saveProducts(updated)
  }

  const deleteProducts = (ids: string[]) => {
    const updated = products.filter((p) => !ids.includes(p.id))
    saveProducts(updated)
  }

  const bulkUpdateStatus = (
    ids: Set<string>,
    status: 'draft' | 'ready' | 'published'
  ) => {
    const updated = products.map((p) =>
      ids.has(p.id) ? { ...p, status, updatedAt: new Date() } : p
    )
    saveProducts(updated)
  }

  return {
    products,
    isLoading,
    addProducts,
    updateProduct,
    deleteProducts,
    bulkUpdateStatus,
    saveProducts,
  }
}
