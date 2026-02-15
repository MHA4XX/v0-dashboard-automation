'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Store,
  DollarSign,
  Bell,
  Globe,
  Save,
  CheckCircle,
  Zap,
  Hand,
  Link2,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { loadShopifySettings, saveShopifySettings } from '@/hooks/use-orders'
import type { ShopifySettings } from '@/lib/types'

const SETTINGS_KEY = 'dropship-settings'

interface AppSettings {
  defaultMarkup: string
  currency: string
  autoPublish: boolean
  emailNotifications: boolean
  importNotifications: boolean
  language: string
}

const defaultAppSettings: AppSettings = {
  defaultMarkup: '50',
  currency: 'USD',
  autoPublish: false,
  emailNotifications: true,
  importNotifications: true,
  language: 'es',
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings)
  const [shopifySettings, setShopifySettings] = useState<ShopifySettings>({
    storeUrl: '',
    apiToken: '',
    webhookUrl: '',
    orderMode: 'manual',
    connected: false,
  })
  const [isHydrated, setIsHydrated] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) setSettings({ ...defaultAppSettings, ...JSON.parse(stored) })
    } catch {}
    setShopifySettings(loadShopifySettings())
    setIsHydrated(true)
  }, [])

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    saveShopifySettings(shopifySettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleTestConnection = () => {
    setTestingConnection(true)
    setConnectionResult('idle')
    // Simulate connection test
    setTimeout(() => {
      if (shopifySettings.storeUrl && shopifySettings.apiToken) {
        setConnectionResult('success')
        setShopifySettings((prev) => ({ ...prev, connected: true }))
      } else {
        setConnectionResult('error')
      }
      setTestingConnection(false)
    }, 1500)
  }

  if (!isHydrated) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Configuracion" description="Administra tu cuenta, integraciones y preferencias" />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl space-y-6">
          {/* Shopify Integration */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Store className="w-5 h-5 text-primary" />
                    Integracion Shopify
                  </CardTitle>
                  <CardDescription>Conecta tu tienda Shopify para sincronizar productos y pedidos</CardDescription>
                </div>
                {shopifySettings.connected && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Conectado</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-url">URL de la Tienda</Label>
                <Input
                  id="store-url"
                  placeholder="tu-tienda.myshopify.com"
                  value={shopifySettings.storeUrl}
                  onChange={(e) => setShopifySettings({ ...shopifySettings, storeUrl: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-token">Admin API Access Token</Label>
                <Input
                  id="api-token"
                  type="password"
                  placeholder="shpat_xxxxxxxxxxxxx"
                  value={shopifySettings.apiToken}
                  onChange={(e) => setShopifySettings({ ...shopifySettings, apiToken: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    placeholder="https://tu-dominio.com/api/shopify/webhook"
                    value={shopifySettings.webhookUrl}
                    onChange={(e) => setShopifySettings({ ...shopifySettings, webhookUrl: e.target.value })}
                    className="bg-secondary border-border flex-1"
                  />
                  <Button variant="secondary" size="icon" className="flex-shrink-0">
                    <Link2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Para recibir pedidos automaticamente de Shopify</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={handleTestConnection} disabled={testingConnection}>
                  {testingConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Probar Conexion
                    </>
                  )}
                </Button>
                {connectionResult === 'success' && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Conexion exitosa</Badge>
                )}
                {connectionResult === 'error' && (
                  <Badge className="bg-destructive/20 text-destructive border-0">Error: verifica tus datos</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Mode */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Modo de Pedidos
              </CardTitle>
              <CardDescription>
                Elige como procesar los pedidos que llegan de Shopify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShopifySettings({ ...shopifySettings, orderMode: 'manual' })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    shopifySettings.orderMode === 'manual'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-secondary/50 hover:border-muted-foreground/30'
                  }`}
                >
                  <Hand className={`w-6 h-6 mb-2 ${shopifySettings.orderMode === 'manual' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="font-medium text-foreground text-sm">Manual</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Revisa y confirma cada pedido antes de procesarlo
                  </p>
                </button>
                <button
                  onClick={() => setShopifySettings({ ...shopifySettings, orderMode: 'auto' })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    shopifySettings.orderMode === 'auto'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-secondary/50 hover:border-muted-foreground/30'
                  }`}
                >
                  <Zap className={`w-6 h-6 mb-2 ${shopifySettings.orderMode === 'auto' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="font-medium text-foreground text-sm">Automatico</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Los pedidos se procesan y sincronizan automaticamente
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Precios
              </CardTitle>
              <CardDescription>Reglas de precios para productos importados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="markup">Markup por Defecto (%)</Label>
                  <Input
                    id="markup"
                    type="number"
                    value={settings.defaultMarkup}
                    onChange={(e) => setSettings({ ...settings, defaultMarkup: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={settings.currency} onValueChange={(value) => setSettings({ ...settings, currency: value })}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="MXN">MXN ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-publicar en Shopify</Label>
                  <p className="text-xs text-muted-foreground">Publicar productos automaticamente al importar</p>
                </div>
                <Switch checked={settings.autoPublish} onCheckedChange={(checked) => setSettings({ ...settings, autoPublish: checked })} />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por Email</Label>
                  <p className="text-xs text-muted-foreground">Recibir actualizaciones por correo</p>
                </div>
                <Switch checked={settings.emailNotifications} onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })} />
              </div>
              <Separator className="bg-border" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones de Importacion</Label>
                  <p className="text-xs text-muted-foreground">Aviso cuando las importaciones se completen</p>
                </div>
                <Switch checked={settings.importNotifications} onCheckedChange={(checked) => setSettings({ ...settings, importNotifications: checked })} />
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Idioma y Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select value={settings.language} onValueChange={(value) => setSettings({ ...settings, language: value })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Espanol</SelectItem>
                    <SelectItem value="fr">Francais</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {saved && (
            <Alert className="bg-primary/10 border-primary/20">
              <CheckCircle className="w-4 h-4 text-primary" />
              <AlertDescription className="text-foreground">Configuracion guardada exitosamente</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Guardar Configuracion
          </Button>
        </div>
      </div>
    </div>
  )
}
