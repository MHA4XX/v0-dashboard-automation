'use client'

import { cn } from '@/lib/utils'
import {
  Package,
  Download,
  Upload,
  Settings,
  LayoutDashboard,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ClipboardList,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'

const ORDERS_KEY = 'dropship-orders'

function getPendingOrderCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const stored = localStorage.getItem(ORDERS_KEY)
    if (!stored) return 0
    const orders = JSON.parse(stored)
    return orders.filter((o: { status: string }) => o.status === 'pending').length
  } catch {
    return 0
  }
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [pendingOrders, setPendingOrders] = useState(0)

  useEffect(() => {
    setPendingOrders(getPendingOrderCount())
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      setPendingOrders(getPendingOrderCount())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
    { name: 'Productos', href: '/products', icon: Package, badge: null },
    { name: 'Pedidos', href: '/orders', icon: ClipboardList, badge: pendingOrders > 0 ? pendingOrders : null },
    { name: 'Importar', href: '/import', icon: Download, badge: null },
    { name: 'Exportar a Shopify', href: '/export', icon: Upload, badge: null },
    { name: 'Configuracion', href: '/settings', icon: Settings, badge: null },
  ]

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">DropShip Hub</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium flex-1">{item.name}</span>}
              {item.badge !== null && (
                <Badge
                  className={cn(
                    'h-5 min-w-5 flex items-center justify-center px-1.5 text-[10px] font-bold border-0',
                    'bg-destructive text-destructive-foreground',
                    collapsed && 'absolute -top-1 -right-1 h-4 min-w-4 px-1'
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        <a
          href="https://alibaba.com"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all',
            collapsed && 'justify-center'
          )}
        >
          <ExternalLink className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Abrir Alibaba</span>}
        </a>
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left text-destructive hover:bg-destructive/10 transition-all',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Cerrar Sesion</span>}
        </button>
      </div>
    </aside>
  )
}
