import type { HitboxDefinition } from '../stores/AssetStore'

/**
 * Point interface for hitbox calculations
 */
interface Point {
  x: number
  y: number
}

/**
 * HitboxService - Generates polygon hitboxes from sprite alpha channels
 * 
 * Uses Marching Squares algorithm to trace contours and Ramer-Douglas-Peucker
 * algorithm to simplify the resulting polygon.
 */
class HitboxService {
  // Default alpha threshold (0-255) - pixels with alpha above this are "solid"
  private readonly DEFAULT_THRESHOLD = 128
  
  // Default epsilon for polygon simplification (in pixels)
  private readonly DEFAULT_EPSILON = 2.0

  /**
   * Generate a polygon hitbox from an image's alpha channel
   * 
   * @param img - The source image (HTMLImageElement)
   * @param threshold - Alpha threshold (0-255), default 128
   * @param epsilon - Simplification tolerance (pixels), default 2.0
   * @returns HitboxDefinition with normalized polygon points
   */
  generateFromImage(
    img: HTMLImageElement,
    threshold: number = this.DEFAULT_THRESHOLD,
    epsilon: number = this.DEFAULT_EPSILON
  ): HitboxDefinition {
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height

    if (width === 0 || height === 0) {
      // Return a default rect if image has no dimensions
      return { type: 'rect', x: 0, y: 0, w: 1, h: 1 }
    }

    // Get alpha data from image
    const alphaMap = this.getAlphaMap(img, width, height)
    
    // Create binary map (solid/empty)
    const binaryMap = this.createBinaryMap(alphaMap, width, height, threshold)
    
    // Trace contour using marching squares
    const contour = this.traceContour(binaryMap, width, height)
    
    if (contour.length < 3) {
      // Not enough points for a polygon, return rect
      return { type: 'rect', x: 0, y: 0, w: 1, h: 1 }
    }
    
    // Simplify polygon using Ramer-Douglas-Peucker
    const simplified = this.simplifyPolygon(contour, epsilon)
    
    if (simplified.length < 3) {
      // Simplification reduced too much, return rect
      return { type: 'rect', x: 0, y: 0, w: 1, h: 1 }
    }
    
    // Normalize points to 0-1 range
    const normalized = this.normalizePoints(simplified, width, height)
    
    return {
      type: 'polygon',
      points: normalized
    }
  }

  /**
   * Generate a simple rectangular hitbox from image bounds
   */
  generateRect(
    img: HTMLImageElement,
    threshold: number = this.DEFAULT_THRESHOLD
  ): HitboxDefinition {
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height

    if (width === 0 || height === 0) {
      return { type: 'rect', x: 0, y: 0, w: 1, h: 1 }
    }

    // Get alpha data and find bounding box of non-transparent pixels
    const alphaMap = this.getAlphaMap(img, width, height)
    
    let minX = width, minY = height, maxX = 0, maxY = 0
    let hasContent = false

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (alphaMap[y * width + x] >= threshold) {
          hasContent = true
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
    }

    if (!hasContent) {
      return { type: 'rect', x: 0, y: 0, w: 1, h: 1 }
    }

    return {
      type: 'rect',
      x: minX / width,
      y: minY / height,
      w: (maxX - minX + 1) / width,
      h: (maxY - minY + 1) / height
    }
  }

  /**
   * Generate a compound hitbox (multiple rectangles) from an image
   * Slices the image into horizontal sections and creates a tight rect for each
   * 
   * IMPORTANT: This ensures NO GAPS in vertical coverage to prevent rubber-banding.
   * If a section has no content, it uses interpolated bounds from neighbors.
   * 
   * @param img - The source image
   * @param numRects - Number of rectangles (1-20)
   * @param threshold - Alpha threshold (0-255)
   * @returns HitboxDefinition with compound rects
   */
  generateCompound(
    img: HTMLImageElement,
    numRects: number = 3,
    threshold: number = this.DEFAULT_THRESHOLD
  ): HitboxDefinition {
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height

    if (width === 0 || height === 0) {
      return { type: 'rect', x: 0, y: 0, w: 1, h: 1 }
    }

    // Clamp numRects to valid range
    numRects = Math.max(1, Math.min(20, Math.round(numRects)))

    // Get alpha data
    const alphaMap = this.getAlphaMap(img, width, height)

    // Calculate section height
    const sectionHeight = height / numRects
    
    // First pass: collect bounds for each section (null if no content)
    const sectionBounds: Array<{ minX: number; maxX: number } | null> = []

    for (let i = 0; i < numRects; i++) {
      const startY = Math.floor(i * sectionHeight)
      const endY = Math.floor((i + 1) * sectionHeight)

      // Find min/max X for this section
      let minX = width, maxX = 0
      let hasContent = false

      for (let y = startY; y < endY; y++) {
        for (let x = 0; x < width; x++) {
          if (alphaMap[y * width + x] >= threshold) {
            hasContent = true
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
          }
        }
      }

      sectionBounds.push(hasContent ? { minX, maxX } : null)
    }

    // Find first and last non-null sections to determine sprite extent
    const firstContentIdx = sectionBounds.findIndex(b => b !== null)
    const lastContentIdx = sectionBounds.length - 1 - [...sectionBounds].reverse().findIndex(b => b !== null)
    
    // If no content at all, return full rect
    if (firstContentIdx === -1) {
      return { type: 'rect', x: 0, y: 0, w: 1, h: 1 }
    }

    // Second pass: fill gaps by interpolating between neighbors
    // Only process sections between first and last content
    for (let i = firstContentIdx; i <= lastContentIdx; i++) {
      if (sectionBounds[i] === null) {
        // Find nearest non-null neighbors
        let prevIdx = i - 1
        while (prevIdx >= 0 && sectionBounds[prevIdx] === null) prevIdx--
        let nextIdx = i + 1
        while (nextIdx < sectionBounds.length && sectionBounds[nextIdx] === null) nextIdx++

        const prev = prevIdx >= 0 ? sectionBounds[prevIdx] : null
        const next = nextIdx < sectionBounds.length ? sectionBounds[nextIdx] : null

        if (prev && next) {
          // Interpolate between neighbors
          const t = (i - prevIdx) / (nextIdx - prevIdx)
          sectionBounds[i] = {
            minX: Math.round(prev.minX + (next.minX - prev.minX) * t),
            maxX: Math.round(prev.maxX + (next.maxX - prev.maxX) * t)
          }
        } else if (prev) {
          // Use previous bounds
          sectionBounds[i] = { ...prev }
        } else if (next) {
          // Use next bounds
          sectionBounds[i] = { ...next }
        }
      }
    }

    // Third pass: create rects from filled bounds (only between first and last content)
    const rects: Array<{ x: number; y: number; w: number; h: number }> = []
    
    for (let i = firstContentIdx; i <= lastContentIdx; i++) {
      const bounds = sectionBounds[i]
      if (bounds) {
        const startY = Math.floor(i * sectionHeight)
        const endY = Math.floor((i + 1) * sectionHeight)
        
        rects.push({
          x: bounds.minX / width,
          y: startY / height,
          w: (bounds.maxX - bounds.minX + 1) / width,
          h: (endY - startY) / height
        })
      }
    }

    // If no content found, return full rect
    if (rects.length === 0) {
      return { type: 'rect', x: 0, y: 0, w: 1, h: 1 }
    }

    // If only one rect, return as simple rect type
    if (rects.length === 1) {
      return {
        type: 'rect',
        x: rects[0].x,
        y: rects[0].y,
        w: rects[0].w,
        h: rects[0].h
      }
    }

    return {
      type: 'compound',
      rects
    }
  }

  /**
   * Extract alpha channel values from an image
   */
  private getAlphaMap(img: HTMLImageElement, width: number, height: number): Uint8ClampedArray {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return new Uint8ClampedArray(width * height)
    }
    
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, width, height)
    
    // Extract alpha channel (every 4th byte)
    const alphaMap = new Uint8ClampedArray(width * height)
    for (let i = 0; i < alphaMap.length; i++) {
      alphaMap[i] = imageData.data[i * 4 + 3]
    }
    
    return alphaMap
  }

  /**
   * Create a binary map from alpha values
   * true = solid (alpha >= threshold)
   * false = empty (alpha < threshold)
   */
  private createBinaryMap(
    alphaMap: Uint8ClampedArray,
    width: number,
    height: number,
    threshold: number
  ): boolean[][] {
    const map: boolean[][] = []
    
    for (let y = 0; y < height; y++) {
      map[y] = []
      for (let x = 0; x < width; x++) {
        map[y][x] = alphaMap[y * width + x] >= threshold
      }
    }
    
    return map
  }

  /**
   * Trace the contour of solid pixels using Marching Squares algorithm
   * Returns an array of points forming the outer boundary
   */
  private traceContour(binaryMap: boolean[][], width: number, height: number): Point[] {
    const contour: Point[] = []
    
    // Find starting point (first solid pixel from top-left)
    let startX = -1, startY = -1
    outer: for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (binaryMap[y][x]) {
          startX = x
          startY = y
          break outer
        }
      }
    }
    
    if (startX === -1) {
      // No solid pixels found
      return contour
    }

    // Marching squares directions: 0=right, 1=down, 2=left, 3=up
    // Each cell configuration determines the next direction
    const dx = [1, 0, -1, 0]
    const dy = [0, 1, 0, -1]
    
    // Helper to check if a cell is solid (out of bounds = empty)
    const isSolid = (x: number, y: number): boolean => {
      if (x < 0 || x >= width || y < 0 || y >= height) return false
      return binaryMap[y][x]
    }
    
    // Walk around the boundary
    let x = startX
    let y = startY
    let dir = 0 // Start moving right
    
    // Track visited edge segments to detect when we've completed the loop
    const visited = new Set<string>()
    const maxIterations = width * height * 4 // Safety limit
    let iterations = 0
    
    do {
      // Add current position to contour
      contour.push({ x, y })
      
      // Get the 2x2 cell configuration at current position
      // The "cell" is centered at (x, y) looking at pixels (x-1,y-1), (x,y-1), (x-1,y), (x,y)
      const tl = isSolid(x - 1, y - 1) ? 1 : 0
      const tr = isSolid(x, y - 1) ? 2 : 0
      const bl = isSolid(x - 1, y) ? 4 : 0
      const br = isSolid(x, y) ? 8 : 0
      const cellValue = tl | tr | bl | br
      
      // Determine next direction based on cell configuration and current direction
      // This implements the marching squares lookup table
      let nextDir = dir
      switch (cellValue) {
        case 1: nextDir = 3; break  // tl only -> up
        case 2: nextDir = 0; break  // tr only -> right
        case 3: nextDir = 0; break  // tl+tr -> right
        case 4: nextDir = 2; break  // bl only -> left
        case 5: nextDir = 3; break  // tl+bl -> up
        case 6:                     // tr+bl (saddle)
          nextDir = (dir === 3) ? 2 : 0
          break
        case 7: nextDir = 0; break  // tl+tr+bl -> right
        case 8: nextDir = 1; break  // br only -> down
        case 9:                     // tl+br (saddle)
          nextDir = (dir === 0) ? 3 : 1
          break
        case 10: nextDir = 1; break // tr+br -> down
        case 11: nextDir = 1; break // tl+tr+br -> down
        case 12: nextDir = 2; break // bl+br -> left
        case 13: nextDir = 3; break // tl+bl+br -> up
        case 14: nextDir = 2; break // tr+bl+br -> left
        case 15: nextDir = dir; break // all solid, continue same direction
        default: nextDir = dir; break // all empty (shouldn't happen)
      }
      
      dir = nextDir
      
      // Move to next position
      const edgeKey = `${x},${y},${dir}`
      if (visited.has(edgeKey)) {
        // We've completed the loop
        break
      }
      visited.add(edgeKey)
      
      x += dx[dir]
      y += dy[dir]
      iterations++
      
    } while (iterations < maxIterations && (x !== startX || y !== startY || contour.length < 3))
    
    return contour
  }

  /**
   * Simplify polygon using Ramer-Douglas-Peucker algorithm
   * Reduces the number of points while preserving the shape
   */
  private simplifyPolygon(points: Point[], epsilon: number): Point[] {
    if (points.length < 3) return points
    
    // Find the point with maximum distance from the line between first and last
    let maxDist = 0
    let maxIndex = 0
    
    const start = points[0]
    const end = points[points.length - 1]
    
    for (let i = 1; i < points.length - 1; i++) {
      const dist = this.perpendicularDistance(points[i], start, end)
      if (dist > maxDist) {
        maxDist = dist
        maxIndex = i
      }
    }
    
    // If max distance is greater than epsilon, recursively simplify
    if (maxDist > epsilon) {
      const left = this.simplifyPolygon(points.slice(0, maxIndex + 1), epsilon)
      const right = this.simplifyPolygon(points.slice(maxIndex), epsilon)
      
      // Combine results, removing duplicate middle point
      return [...left.slice(0, -1), ...right]
    }
    
    // Otherwise, return just the endpoints
    return [start, end]
  }

  /**
   * Calculate perpendicular distance from a point to a line segment
   */
  private perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    
    // Line length squared
    const lengthSq = dx * dx + dy * dy
    
    if (lengthSq === 0) {
      // Start and end are the same point
      return Math.sqrt(
        Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
      )
    }
    
    // Calculate perpendicular distance using cross product
    const cross = Math.abs(
      (point.y - lineStart.y) * dx - (point.x - lineStart.x) * dy
    )
    
    return cross / Math.sqrt(lengthSq)
  }

  /**
   * Normalize points from pixel coordinates to 0-1 range
   */
  private normalizePoints(points: Point[], width: number, height: number): Point[] {
    return points.map(p => ({
      x: Math.max(0, Math.min(1, p.x / width)),
      y: Math.max(0, Math.min(1, p.y / height))
    }))
  }

  /**
   * Convert normalized points back to pixel coordinates
   */
  denormalizePoints(points: Point[], width: number, height: number): Point[] {
    return points.map(p => ({
      x: p.x * width,
      y: p.y * height
    }))
  }
}

// Export singleton instance
export const hitboxService = new HitboxService()
