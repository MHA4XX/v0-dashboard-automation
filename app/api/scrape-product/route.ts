import { NextRequest, NextResponse } from 'next/server'

interface ExtractedProduct {
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
  shippingCost: number
  shippingMethods: { id: string; name: string; cost: number; estimatedDays: string; carrier: string }[]
  weight: string
  dimensions: string
  sku: string
  tags: string[]
  rating: number
  reviews: number
  variants: { id: string; name: string; options: string[]; price?: number; sku?: string; inventory?: number }[]
  sourceUrl: string
  source: string
}

async function fetchWithProxy(url: string): Promise<string> {
  const proxyUrls = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ]

  for (const proxyUrl of proxyUrls) {
    try {
      const response = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (response.ok) {
        const html = await response.text()
        if (html.length > 500) {
          return html
        }
      }
    } catch {
      continue
    }
  }

  throw new Error('Could not fetch the product page. The site may be blocking automated access.')
}

function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function detectSource(hostname: string): string {
  const map: Record<string, string> = {
    'alibaba.com': 'Alibaba',
    'aliexpress.com': 'AliExpress',
    'aliexpress.us': 'AliExpress',
    '1688.com': '1688',
    'amazon.com': 'Amazon',
    'amazon.co.uk': 'Amazon UK',
    'amazon.de': 'Amazon DE',
    'amazon.es': 'Amazon ES',
    'amazon.com.mx': 'Amazon MX',
    'ebay.com': 'eBay',
    'etsy.com': 'Etsy',
    'walmart.com': 'Walmart',
    'temu.com': 'Temu',
    'shein.com': 'Shein',
    'dhgate.com': 'DHgate',
    'made-in-china.com': 'Made-in-China',
    'banggood.com': 'Banggood',
    'gearbest.com': 'GearBest',
    'wish.com': 'Wish',
    'target.com': 'Target',
    'bestbuy.com': 'Best Buy',
    'newegg.com': 'Newegg',
    'homedepot.com': 'Home Depot',
    'wayfair.com': 'Wayfair',
    'overstock.com': 'Overstock',
    'costco.com': 'Costco',
    'zappos.com': 'Zappos',
  }

  for (const [domain, name] of Object.entries(map)) {
    if (hostname.includes(domain)) return name
  }
  return hostname.replace('www.', '').split('.')[0]
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = []
  const matches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
  for (const match of matches) {
    try {
      const data = JSON.parse(match[1].trim())
      if (Array.isArray(data)) {
        results.push(...data)
      } else if (data['@graph']) {
        results.push(...(data['@graph'] as Record<string, unknown>[]))
      } else {
        results.push(data)
      }
    } catch { /* skip invalid JSON-LD */ }
  }
  return results
}

function extractFromJsonLd(jsonLdItems: Record<string, unknown>[]): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {}

  for (const item of jsonLdItems) {
    const type = (item['@type'] as string || '').toLowerCase()

    if (type === 'product' || type === 'productmodel' || type === 'individualproduct') {
      if (item.name) result.title = cleanText(String(item.name))
      if (item.description) result.description = cleanText(String(item.description))
      if (item.sku) result.sku = String(item.sku)
      if (item.brand && typeof item.brand === 'object') {
        result.supplier = String((item.brand as Record<string, unknown>).name || '')
      }
      if (item.category) result.category = String(item.category)

      const image = item.image
      if (image) {
        if (typeof image === 'string') result.images = [image]
        else if (Array.isArray(image)) result.images = image.filter((i): i is string => typeof i === 'string').slice(0, 10)
      }

      // Offers
      const offers = item.offers as Record<string, unknown> | Record<string, unknown>[] | undefined
      if (offers) {
        const offerObj = Array.isArray(offers) ? offers[0] : offers
        if (offerObj) {
          const p = parseFloat(String(offerObj.price || offerObj.lowPrice || '0'))
          if (p > 0) result.price = p
          const hp = parseFloat(String(offerObj.highPrice || '0'))
          if (hp > 0) result.originalPrice = hp
          if (offerObj.priceCurrency) result.currency = String(offerObj.priceCurrency)

          // Shipping from offers
          const shipping = offerObj.shippingDetails as Record<string, unknown> | undefined
          if (shipping) {
            const rate = shipping.shippingRate as Record<string, unknown> | undefined
            if (rate) {
              result.shippingCost = parseFloat(String(rate.value || '0'))
            }
            const deliveryTime = shipping.deliveryTime as Record<string, unknown> | undefined
            if (deliveryTime) {
              const minDays = deliveryTime.minValue || deliveryTime.transitTime
              const maxDays = deliveryTime.maxValue
              if (minDays && maxDays) {
                result.shippingTime = `${minDays}-${maxDays} days`
              }
            }
          }
        }
      }

      // AggregateRating
      const rating = item.aggregateRating as Record<string, unknown> | undefined
      if (rating) {
        result.rating = parseFloat(String(rating.ratingValue || '0'))
        result.reviews = parseInt(String(rating.reviewCount || rating.ratingCount || '0'))
      }

      // Weight
      if (item.weight) {
        const w = item.weight as Record<string, unknown>
        result.weight = `${w.value || ''} ${w.unitCode || w.unitText || 'kg'}`.trim()
      }
    }
  }

  return result
}

function extractFromMetaTags(html: string): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {}

  const metaMap: Record<string, keyof ExtractedProduct> = {
    'og:title': 'title',
    'og:description': 'description',
    'product:price:amount': 'price' as keyof ExtractedProduct,
    'product:price:currency': 'currency',
  }

  for (const [prop, key] of Object.entries(metaMap)) {
    const match = html.match(new RegExp(`<meta[^>]*(?:property|name)="${prop}"[^>]*content="([^"]+)"`, 'i'))
    if (match && match[1]) {
      const value = cleanText(match[1])
      if (key === 'price') {
        result.price = parseFloat(value)
      } else {
        (result as Record<string, unknown>)[key] = value
      }
    }
  }

  // OG images
  const ogImages: string[] = []
  const imgMatches = html.matchAll(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/gi)
  for (const match of imgMatches) {
    if (match[1]?.startsWith('http')) ogImages.push(match[1])
  }
  if (ogImages.length > 0) result.images = ogImages

  return result
}

function extractFromHtml(html: string, url: string): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {}

  // Title from h1 or title tag
  if (!result.title) {
    const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    if (h1) result.title = cleanText(h1[1])
    else {
      const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleTag) result.title = cleanText(titleTag[1]).split('|')[0].split('-')[0].trim()
    }
  }

  // Price patterns
  if (!result.price) {
    const pricePatterns = [
      /(?:"price"|"offerPrice"|"salePrice"|"currentPrice")\s*:\s*"?\$?(\d+\.?\d*)"?/g,
      /class="[^"]*price[^"]*"[^>]*>\s*\$?\s*(\d+\.?\d*)/gi,
      /\$(\d+\.?\d*)/g,
      /US\s*\$\s*(\d+\.?\d*)/gi,
      /(\d+\.?\d*)\s*USD/gi,
    ]

    for (const pattern of pricePatterns) {
      const matches = [...html.matchAll(pattern)]
      for (const match of matches) {
        const p = parseFloat(match[1])
        if (p > 0.01 && p < 100000) {
          result.price = p
          break
        }
      }
      if (result.price) break
    }
  }

  // Images from src attributes
  if (!result.images || result.images.length === 0) {
    const imgs: string[] = []
    const imgSrcMatches = html.matchAll(/<img[^>]*src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)
    for (const match of imgSrcMatches) {
      const src = match[1]
      if (src && !src.includes('icon') && !src.includes('logo') && !src.includes('sprite') && !src.includes('pixel') && !src.includes('1x1')) {
        imgs.push(src)
      }
      if (imgs.length >= 10) break
    }
    if (imgs.length > 0) result.images = imgs
  }

  // Rating
  if (!result.rating) {
    const ratingMatch = html.match(/(\d+\.?\d*)\s*(?:out of|\/)\s*5/) ||
      html.match(/"ratingValue"\s*:\s*"?(\d+\.?\d*)"?/) ||
      html.match(/"averageRating"\s*:\s*"?(\d+\.?\d*)"?/)
    if (ratingMatch) result.rating = parseFloat(ratingMatch[1])
  }

  // Reviews count
  if (!result.reviews) {
    const reviewMatch = html.match(/(\d[\d,]*)\s*(?:reviews?|ratings?|evaluations?|opiniones?)/i) ||
      html.match(/"reviewCount"\s*:\s*"?(\d+)"?/)
    if (reviewMatch) result.reviews = parseInt(reviewMatch[1].replace(/,/g, ''))
  }

  // Weight
  if (!result.weight) {
    const weightMatch = html.match(/(?:weight|peso)[^:]*:\s*([^<,\n]{2,30})/i) ||
      html.match(/(\d+\.?\d*)\s*(?:kg|lbs?|oz|g)\b/i)
    if (weightMatch) result.weight = cleanText(weightMatch[1] || weightMatch[0])
  }

  // Dimensions
  if (!result.dimensions) {
    const dimMatch = html.match(/(?:dimensions?|size)[^:]*:\s*([^<,\n]{2,50})/i) ||
      html.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*x?\s*(\d+\.?\d*)?\s*(?:cm|in|mm)/i)
    if (dimMatch) result.dimensions = cleanText(dimMatch[0])
  }

  // Shipping info
  const shippingPatterns = [
    /(?:shipping|delivery|envio)[^:]*:\s*\$?(\d+\.?\d*)/i,
    /"shippingPrice"\s*:\s*"?\$?(\d+\.?\d*)"?/,
    /shipping[^>]*>\s*\$?(\d+\.?\d*)/i,
  ]
  for (const pattern of shippingPatterns) {
    const match = html.match(pattern)
    if (match && !result.shippingCost) {
      result.shippingCost = parseFloat(match[1])
      break
    }
  }

  // Free shipping check
  if (html.match(/free\s*shipping|envio\s*gratis|envio\s*gratuito/i)) {
    result.shippingCost = 0
  }

  // Shipping time
  if (!result.shippingTime) {
    const shipTimeMatch = html.match(/(\d+)\s*[-to]+\s*(\d+)\s*(?:days?|business days?|dias?)/i)
    if (shipTimeMatch) {
      result.shippingTime = `${shipTimeMatch[1]}-${shipTimeMatch[2]} days`
    }
  }

  // Tags/keywords
  const keywordsMatch = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]+)"/i)
  if (keywordsMatch) {
    result.tags = keywordsMatch[1].split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 1).slice(0, 10)
  }

  // Supplier/brand
  if (!result.supplier) {
    const brandMatch = html.match(/"brand"\s*:\s*"([^"]+)"/) ||
      html.match(/(?:brand|marca|sold by|seller)[^:]*:\s*([^<,\n"]{2,50})/i)
    if (brandMatch) result.supplier = cleanText(brandMatch[1])
  }

  // Variants - common patterns
  if (!result.variants || result.variants.length === 0) {
    const variants: ExtractedProduct['variants'] = []

    // Color variants
    const colorPatterns = [
      /"(?:color|colour)"\s*:\s*\[([^\]]+)\]/i,
      /data-option-name="(?:color|colour)"[^>]*>([\s\S]*?)<\/div>/gi,
    ]
    for (const pattern of colorPatterns) {
      const match = html.match(pattern)
      if (match) {
        const colors = (match[1] || '').match(/"([^"]+)"/g)?.map(c => c.replace(/"/g, '')) || []
        if (colors.length > 0) {
          variants.push({ id: 'color', name: 'Color', options: colors.slice(0, 10) })
          break
        }
      }
    }

    // Size variants
    const sizePatterns = [
      /"(?:size|talla|taille)"\s*:\s*\[([^\]]+)\]/i,
    ]
    for (const pattern of sizePatterns) {
      const match = html.match(pattern)
      if (match) {
        const sizes = (match[1] || '').match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || []
        if (sizes.length > 0) {
          variants.push({ id: 'size', name: 'Size', options: sizes.slice(0, 10) })
          break
        }
      }
    }

    result.variants = variants
  }

  return result
}

function extractAlibabaSpecific(html: string): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {}

  // Alibaba CDN images
  const images: string[] = []
  const cdnMatches = html.matchAll(/https:\/\/[a-z0-9]+\.alicdn\.com\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi)
  for (const match of cdnMatches) {
    const url = match[0].split('?')[0]
    if (!images.includes(url) && !url.includes('logo') && !url.includes('icon') && !url.includes('avatar')) {
      images.push(url)
    }
    if (images.length >= 10) break
  }
  if (images.length > 0) result.images = images

  // Supplier
  const supplierMatch = html.match(/"companyName"\s*:\s*"([^"]+)"/) || html.match(/"supplierName"\s*:\s*"([^"]+)"/)
  if (supplierMatch) result.supplier = cleanText(supplierMatch[1])

  // MOQ
  const moqMatch = html.match(/"minOrderQuantity"\s*:\s*(\d+)/) || html.match(/Min\.?\s*Order[^:]*:\s*(\d+)/i)
  if (moqMatch) result.minOrder = parseInt(moqMatch[1])

  return result
}

function extractAmazonSpecific(html: string): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {}

  // Amazon ASIN
  const asinMatch = html.match(/\/dp\/([A-Z0-9]{10})/) || html.match(/"asin"\s*:\s*"([A-Z0-9]{10})"/)
  if (asinMatch) result.sku = asinMatch[1]

  // Amazon images - high res
  const images: string[] = []
  const imgMatches = html.matchAll(/"hiRes"\s*:\s*"(https:\/\/[^"]+)"/g)
  for (const match of imgMatches) {
    if (!images.includes(match[1])) images.push(match[1])
    if (images.length >= 10) break
  }
  if (images.length === 0) {
    const altImgs = html.matchAll(/"large"\s*:\s*"(https:\/\/[^"]+)"/g)
    for (const match of altImgs) {
      if (!images.includes(match[1])) images.push(match[1])
      if (images.length >= 10) break
    }
  }
  if (images.length > 0) result.images = images

  // Amazon brand
  const brandMatch = html.match(/id="bylineInfo"[^>]*>.*?(?:Visit the |Brand: )([^<]+)/i) ||
    html.match(/"brand"\s*:\s*"([^"]+)"/)
  if (brandMatch) result.supplier = cleanText(brandMatch[1])

  return result
}

function buildShippingMethods(data: Partial<ExtractedProduct>, source: string): ExtractedProduct['shippingMethods'] {
  const methods: ExtractedProduct['shippingMethods'] = []

  const baseCost = data.shippingCost || 0

  if (source.includes('Alibaba') || source.includes('AliExpress') || source === '1688' || source.includes('DHgate') || source.includes('Made-in-China') || source.includes('Banggood')) {
    methods.push(
      { id: 'sm-std', name: 'ePacket / Standard', cost: baseCost || 3.50, estimatedDays: '15-30', carrier: 'China Post' },
      { id: 'sm-exp', name: 'Express Shipping', cost: baseCost > 0 ? baseCost * 3 : 15.00, estimatedDays: '5-10', carrier: 'DHL/FedEx' },
    )
  } else if (source.includes('Amazon')) {
    methods.push(
      { id: 'sm-std', name: 'Standard Shipping', cost: baseCost || 5.99, estimatedDays: '5-8', carrier: 'USPS' },
      { id: 'sm-prime', name: 'Priority/Prime', cost: 0, estimatedDays: '1-3', carrier: 'Amazon Logistics' },
    )
  } else if (source.includes('eBay')) {
    methods.push(
      { id: 'sm-std', name: 'Standard', cost: baseCost || 4.99, estimatedDays: '5-10', carrier: 'USPS/UPS' },
      { id: 'sm-exp', name: 'Expedited', cost: baseCost > 0 ? baseCost * 2 : 12.99, estimatedDays: '2-5', carrier: 'UPS' },
    )
  } else if (source.includes('Walmart')) {
    methods.push(
      { id: 'sm-std', name: 'Standard', cost: baseCost || 0, estimatedDays: '3-7', carrier: 'FedEx/USPS' },
      { id: 'sm-exp', name: 'Express', cost: baseCost > 0 ? baseCost * 2 : 9.99, estimatedDays: '1-3', carrier: 'FedEx' },
    )
  } else if (source.includes('Temu') || source.includes('Shein') || source.includes('Wish')) {
    methods.push(
      { id: 'sm-std', name: 'Standard Shipping', cost: baseCost || 0, estimatedDays: '7-15', carrier: 'Standard' },
      { id: 'sm-exp', name: 'Express', cost: baseCost > 0 ? baseCost * 2.5 : 8.99, estimatedDays: '3-7', carrier: 'Express' },
    )
  } else {
    // Generic
    methods.push(
      { id: 'sm-std', name: 'Standard Shipping', cost: baseCost || 5.00, estimatedDays: '5-15', carrier: 'Standard' },
      { id: 'sm-exp', name: 'Express Shipping', cost: baseCost > 0 ? baseCost * 2.5 : 15.00, estimatedDays: '2-5', carrier: 'Express' },
    )
  }

  // If free shipping was detected
  if (data.shippingCost === 0 && methods.length > 0) {
    methods[0].cost = 0
    methods[0].name = 'Free Shipping'
  }

  return methods
}

function mergeResults(...partials: Partial<ExtractedProduct>[]): ExtractedProduct {
  const merged: Partial<ExtractedProduct> = {}

  for (const partial of partials) {
    for (const [key, value] of Object.entries(partial)) {
      if (value === undefined || value === null || value === '' || value === 0) continue
      if (Array.isArray(value) && value.length === 0) continue

      const current = (merged as Record<string, unknown>)[key]
      if (current === undefined || current === null || current === '' || current === 0 ||
          (Array.isArray(current) && current.length === 0)) {
        (merged as Record<string, unknown>)[key] = value
      }
    }
  }

  return {
    title: merged.title || 'Imported Product',
    description: merged.description || `Product imported from online store.`,
    price: merged.price || 0,
    originalPrice: merged.originalPrice || (merged.price ? merged.price * 1.3 : 0),
    currency: merged.currency || 'USD',
    images: merged.images || [],
    category: merged.category || 'General',
    supplier: merged.supplier || 'Online Store',
    minOrder: merged.minOrder || 1,
    shippingTime: merged.shippingTime || '7-21 days',
    shippingCost: merged.shippingCost || 0,
    shippingMethods: merged.shippingMethods || [],
    weight: merged.weight || '',
    dimensions: merged.dimensions || '',
    sku: merged.sku || '',
    tags: merged.tags || [],
    rating: Math.min(5, Math.max(0, merged.rating || 0)),
    reviews: merged.reviews || 0,
    variants: merged.variants || [],
    sourceUrl: merged.sourceUrl || '',
    source: merged.source || '',
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let urlObj: URL
    try {
      urlObj = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const hostname = urlObj.hostname.toLowerCase()
    const source = detectSource(hostname)

    // Fetch HTML
    const html = await fetchWithProxy(url)

    // Extract from all available sources
    const jsonLdItems = extractJsonLd(html)
    const jsonLdData = extractFromJsonLd(jsonLdItems)
    const metaData = extractFromMetaTags(html)
    const htmlData = extractFromHtml(html, url)

    // Platform-specific extraction
    let specificData: Partial<ExtractedProduct> = {}
    if (hostname.includes('alibaba') || hostname.includes('aliexpress') || hostname.includes('1688')) {
      specificData = extractAlibabaSpecific(html)
    } else if (hostname.includes('amazon')) {
      specificData = extractAmazonSpecific(html)
    }

    // Merge all results (priority: JSON-LD > meta > specific > html)
    const product = mergeResults(
      { sourceUrl: url, source },
      jsonLdData,
      specificData,
      metaData,
      htmlData
    )

    // Build shipping methods
    product.shippingMethods = buildShippingMethods(product, source)
    if (!product.shippingCost && product.shippingMethods.length > 0) {
      product.shippingCost = product.shippingMethods[0].cost
    }
    if (!product.shippingTime && product.shippingMethods.length > 0) {
      product.shippingTime = product.shippingMethods[0].estimatedDays + ' days'
    }

    // Ensure originalPrice >= price
    if (product.originalPrice < product.price) {
      product.originalPrice = Math.round(product.price * 1.3 * 100) / 100
    }

    // Generate tags if empty
    if (product.tags.length === 0 && product.title) {
      product.tags = product.title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2)
        .slice(0, 8)
    }

    return NextResponse.json({
      success: true,
      product: {
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...product,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to import product. The page might be protected or unavailable.',
      },
      { status: 500 }
    )
  }
}
