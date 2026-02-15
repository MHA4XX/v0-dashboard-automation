import { NextRequest, NextResponse } from 'next/server'

interface ProductData {
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
  rating: number
  reviews: number
  variants: { id: string; name: string; options: string[] }[]
  sourceUrl: string
  source: 'alibaba' | 'aliexpress' | '1688'
}

// Using a proxy service to bypass CORS and get rendered content
async function fetchWithProxy(url: string): Promise<string> {
  // Try multiple proxy approaches
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
        },
        signal: AbortSignal.timeout(15000),
      })

      if (response.ok) {
        const html = await response.text()
        if (html.length > 1000) {
          return html
        }
      }
    } catch {
      continue
    }
  }

  throw new Error('Could not fetch the product page. Try a different URL.')
}

function extractAlibabaData(html: string, url: string): ProductData {
  
  // Title - multiple patterns
  let title = ''
  const titlePatterns = [
    /<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</i,
    /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
    /<title[^>]*>([^<|]+)/i,
    /"subject"\s*:\s*"([^"]+)"/,
    /"title"\s*:\s*"([^"]+)"/,
  ]
  
  for (const pattern of titlePatterns) {
    const match = html.match(pattern)
    if (match && match[1] && match[1].length > 10) {
      title = match[1].trim()
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/ - Alibaba\.com$/i, '')
        .replace(/ \| Alibaba$/i, '')
      break
    }
  }

  // Description
  let description = ''
  const descPatterns = [
    /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
    /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i,
    /"description"\s*:\s*"([^"]{50,500})"/,
  ]
  
  for (const pattern of descPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      description = match[1].trim()
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
      break
    }
  }

  // Price extraction - multiple strategies
  let price = 0
  let originalPrice = 0

  // JSON-LD structured data
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
  for (const jsonScript of jsonLdMatches) {
    try {
      const jsonStr = jsonScript.replace(/<script[^>]*>|<\/script>/gi, '').trim()
      const data = JSON.parse(jsonStr)
      if (data.offers) {
        price = parseFloat(data.offers.lowPrice || data.offers.price) || 0
        originalPrice = parseFloat(data.offers.highPrice) || price * 1.2
      }
      if (data['@graph']) {
        for (const item of data['@graph']) {
          if (item.offers) {
            price = parseFloat(item.offers.lowPrice || item.offers.price) || price
            originalPrice = parseFloat(item.offers.highPrice) || originalPrice
          }
        }
      }
    } catch {
      // Continue
    }
  }

  // Price from data attributes or specific elements
  if (price === 0) {
    const pricePatterns = [
      /"priceRange"\s*:\s*\{\s*"min"\s*:\s*(\d+\.?\d*)/,
      /"price"\s*:\s*"?\$?(\d+\.?\d*)"?/,
      /US\s*\$\s*(\d+\.?\d*)/gi,
      /\$(\d+\.?\d*)\s*-\s*\$(\d+\.?\d*)/,
      /data-price="(\d+\.?\d*)"/,
      /"minPrice"\s*:\s*(\d+\.?\d*)/,
    ]

    for (const pattern of pricePatterns) {
      const matches = [...html.matchAll(new RegExp(pattern.source, 'gi'))]
      for (const match of matches) {
        const foundPrice = parseFloat(match[1])
        if (foundPrice > 0.1 && foundPrice < 50000) {
          price = foundPrice
          if (match[2]) {
            originalPrice = parseFloat(match[2])
          }
          break
        }
      }
      if (price > 0) break
    }
  }

  if (price === 0) {
    price = 12.99 // Default fallback
  }
  if (originalPrice === 0 || originalPrice < price) {
    originalPrice = price
  }

  // Images - comprehensive extraction
  const images: string[] = []
  
  // OG images
  const ogImages = html.matchAll(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/gi)
  for (const match of ogImages) {
    if (match[1] && match[1].startsWith('http')) {
      images.push(match[1].split('?')[0])
    }
  }

  // Alibaba CDN images
  const cdnPatterns = [
    /https:\/\/[a-z0-9]+\.alicdn\.com\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)(?:_\d+x\d+)?/gi,
    /https:\/\/sc\d+\.alicdn\.com\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi,
    /"imageUrl"\s*:\s*"(https:\/\/[^"]+)"/gi,
    /"originalImageURI"\s*:\s*"(https:\/\/[^"]+)"/gi,
  ]

  for (const pattern of cdnPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      const imgUrl = (match[1] || match[0]).split('?')[0]
      if (imgUrl && 
          !images.includes(imgUrl) && 
          !imgUrl.includes('logo') && 
          !imgUrl.includes('icon') &&
          !imgUrl.includes('avatar') &&
          imgUrl.includes('alicdn')) {
        images.push(imgUrl)
      }
      if (images.length >= 8) break
    }
  }

  // Supplier
  let supplier = ''
  const supplierPatterns = [
    /"companyName"\s*:\s*"([^"]+)"/,
    /"supplierName"\s*:\s*"([^"]+)"/,
    /class="[^"]*company-name[^"]*"[^>]*>([^<]+)</i,
    /"sellerName"\s*:\s*"([^"]+)"/,
  ]
  
  for (const pattern of supplierPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      supplier = match[1].trim()
      break
    }
  }

  // Min order
  let minOrder = 1
  const moqPatterns = [
    /"minOrderQuantity"\s*:\s*(\d+)/,
    /Min\.?\s*Order[^:]*:\s*(\d+)/i,
    /MOQ[^:]*:\s*(\d+)/i,
    /(\d+)\s*(?:Piece|Pieces|Set|Sets|Unit|Units)\s*\(Min/i,
  ]
  
  for (const pattern of moqPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      minOrder = parseInt(match[1]) || 1
      break
    }
  }

  // Rating
  let rating = 0
  let reviews = 0
  const ratingMatch = html.match(/"rating"\s*:\s*"?(\d+\.?\d*)"?/) || 
                      html.match(/(\d+\.?\d*)\s*out of 5/)
  if (ratingMatch) {
    rating = parseFloat(ratingMatch[1])
  }
  
  const reviewMatch = html.match(/"reviewCount"\s*:\s*(\d+)/) ||
                      html.match(/(\d+)\s*Reviews?/i)
  if (reviewMatch) {
    reviews = parseInt(reviewMatch[1])
  }

  // Category
  let category = 'General'
  const categoryMatch = html.match(/"category"\s*:\s*"([^"]+)"/) ||
                        html.match(/breadcrumb[^>]*>([^<]+)</i)
  if (categoryMatch) {
    category = categoryMatch[1].trim()
  }

  // Variants
  const variants: { id: string; name: string; options: string[] }[] = []
  
  // Try to find color options
  const colorMatch = html.match(/"Color"\s*:\s*\[([^\]]+)\]/) ||
                     html.match(/"colors?"\s*:\s*\[([^\]]+)\]/i)
  if (colorMatch) {
    const colors = colorMatch[1].match(/"([^"]+)"/g)?.map(c => c.replace(/"/g, '')) || []
    if (colors.length > 0) {
      variants.push({ id: 'color', name: 'Color', options: colors.slice(0, 8) })
    }
  }

  // Try to find size options
  const sizeMatch = html.match(/"Size"\s*:\s*\[([^\]]+)\]/) ||
                    html.match(/"sizes?"\s*:\s*\[([^\]]+)\]/i)
  if (sizeMatch) {
    const sizes = sizeMatch[1].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || []
    if (sizes.length > 0) {
      variants.push({ id: 'size', name: 'Size', options: sizes.slice(0, 8) })
    }
  }

  return {
    title: title || 'Producto Importado',
    description: description || `Producto de alta calidad importado desde Alibaba. ${title}`,
    price: Math.round(price * 100) / 100,
    originalPrice: Math.round(originalPrice * 100) / 100,
    currency: 'USD',
    images: images.length > 0 ? images : [],
    category,
    supplier: supplier || 'Alibaba Supplier',
    minOrder: Math.max(1, minOrder),
    shippingTime: '15-45 days',
    rating: Math.min(5, Math.max(0, rating)),
    reviews,
    variants,
    sourceUrl: url,
    source: 'alibaba',
  }
}

function extractAliExpressData(html: string, url: string): ProductData {
  
  // AliExpress specific patterns
  let title = ''
  const titleMatch = html.match(/"subject"\s*:\s*"([^"]+)"/) ||
                     html.match(/<h1[^>]*>([^<]+)<\/h1>/) ||
                     html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
  if (titleMatch) {
    title = titleMatch[1].trim()
      .replace(/&amp;/g, '&')
      .replace(/-\s*AliExpress$/i, '')
  }

  let price = 0
  const pricePatterns = [
    /"formattedPrice"\s*:\s*"US\s*\$(\d+\.?\d*)"/,
    /"minPrice"\s*:\s*"?(\d+\.?\d*)"?/,
    /"discountPrice"\s*:\s*"?(\d+\.?\d*)"?/,
    /US\s*\$\s*(\d+\.?\d*)/,
  ]
  
  for (const pattern of pricePatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      price = parseFloat(match[1])
      if (price > 0) break
    }
  }

  // Images
  const images: string[] = []
  const imgPatterns = [
    /https:\/\/[a-z0-9]+\.alicdn\.com\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi,
    /"imageUrl"\s*:\s*"(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi,
  ]
  
  for (const pattern of imgPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      const imgUrl = (match[1] || match[0]).split('?')[0]
      if (imgUrl && !images.includes(imgUrl) && imgUrl.includes('alicdn')) {
        images.push(imgUrl)
      }
      if (images.length >= 8) break
    }
  }

  let description = ''
  const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)
  if (descMatch) {
    description = descMatch[1]
  }

  // Rating
  let rating = 0
  const ratingMatch = html.match(/"averageRating"\s*:\s*"?(\d+\.?\d*)"?/) ||
                      html.match(/"averageStar"\s*:\s*"?(\d+\.?\d*)"?/)
  if (ratingMatch) {
    rating = parseFloat(ratingMatch[1])
  }

  return {
    title: title || 'Producto AliExpress',
    description: description || `Producto importado desde AliExpress. ${title}`,
    price: price || 9.99,
    originalPrice: price * 1.3,
    currency: 'USD',
    images,
    category: 'General',
    supplier: 'AliExpress Seller',
    minOrder: 1,
    shippingTime: '15-30 days',
    rating,
    reviews: 0,
    variants: [],
    sourceUrl: url,
    source: 'aliexpress',
  }
}

function extract1688Data(html: string, url: string): ProductData {
  
  let title = ''
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                     html.match(/"title"\s*:\s*"([^"]+)"/)
  if (titleMatch) {
    title = titleMatch[1].trim()
      .replace(/-1688\.com$/i, '')
  }

  let price = 0
  const priceMatch = html.match(/&yen;\s*(\d+\.?\d*)/) ||
                     html.match(/"price"\s*:\s*"?(\d+\.?\d*)"?/)
  if (priceMatch) {
    // Convert CNY to USD roughly
    price = parseFloat(priceMatch[1]) * 0.14
  }

  const images: string[] = []
  const imgMatches = html.matchAll(/https:\/\/[a-z0-9]+\.alicdn\.com\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi)
  for (const match of imgMatches) {
    if (!images.includes(match[0])) {
      images.push(match[0].split('?')[0])
    }
    if (images.length >= 8) break
  }

  return {
    title: title || 'Producto 1688',
    description: `Producto importado desde 1688. ${title}`,
    price: price || 5.99,
    originalPrice: (price || 5.99) * 1.2,
    currency: 'USD',
    images,
    category: 'General',
    supplier: '1688 Supplier',
    minOrder: 2,
    shippingTime: '20-45 days',
    rating: 0,
    reviews: 0,
    variants: [],
    sourceUrl: url,
    source: '1688',
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate and determine source
    let urlObj: URL
    try {
      urlObj = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const hostname = urlObj.hostname.toLowerCase()
    let source: 'alibaba' | 'aliexpress' | '1688' | null = null

    if (hostname.includes('alibaba.com')) source = 'alibaba'
    else if (hostname.includes('aliexpress')) source = 'aliexpress'
    else if (hostname.includes('1688.com')) source = '1688'

    if (!source) {
      return NextResponse.json({ 
        error: 'URL must be from alibaba.com, aliexpress.com, or 1688.com' 
      }, { status: 400 })
    }

    // Fetch the page
    const html = await fetchWithProxy(url)
    
    // Extract data based on source
    let productData: ProductData
    
    switch (source) {
      case 'alibaba':
        productData = extractAlibabaData(html, url)
        break
      case 'aliexpress':
        productData = extractAliExpressData(html, url)
        break
      case '1688':
        productData = extract1688Data(html, url)
        break
    }

    return NextResponse.json({
      success: true,
      product: {
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...productData,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to import product. The page might be protected or unavailable.'
    }, { status: 500 })
  }
}
