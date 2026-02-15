'use client'

import { Header } from '@/components/dashboard/header'
import { ExportPanel } from '@/components/dashboard/export-panel'
import { useProducts } from '@/hooks/use-products'

export default function ExportPage() {
  const { products, bulkUpdateStatus } = useProducts()

  const handleExport = (productIds: string[]) => {
    bulkUpdateStatus(new Set(productIds), 'published')
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Exportar a Shopify"
        description="Publica tus productos en tu tienda Shopify"
      />

      <div className="flex-1 p-6 overflow-auto">
        <ExportPanel products={products} onExport={handleExport} />
      </div>
    </div>
  )
}
