import { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../core/constants'
import type { CollisionShape, NormalizedPoint } from '../../core/types/shapes'

/**
 * DrawingUtils - Common drawing helper functions
 * 
 * Stateless utility functions for canvas drawing operations.
 * Used by all screen renderers for consistent visual elements.
 */

// ============================================
// Tile Rendering Utilities
// ============================================

/**
 * Calculate the visible tile range based on camera position
 * Returns the column/row bounds for tiles that should be rendered
 */
export function calculateVisibleTileRange(
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number,
  levelWidth: number,
  levelHeight: number,
  buffer: number = 1
): { startCol: number; endCol: number; startRow: number; endRow: number } {
  return {
    startCol: Math.max(0, Math.floor(cameraX / TILE_SIZE) - buffer),
    endCol: Math.min(levelWidth, Math.ceil((cameraX + viewportWidth) / TILE_SIZE) + buffer),
    startRow: Math.max(0, Math.floor(cameraY / TILE_SIZE) - buffer),
    endRow: Math.min(levelHeight, Math.ceil((cameraY + viewportHeight) / TILE_SIZE) + buffer),
  }
}

/**
 * Draw a tile's collision shape at screen coordinates
 */
export function drawTileShape(
  ctx: CanvasRenderingContext2D,
  shape: CollisionShape,
  color: string,
  screenX: number,
  screenY: number
): void {
  ctx.fillStyle = color

  if (shape.type === 'none') {
    return
  }

  if (shape.type === 'rect' && shape.rect) {
    const x = screenX + shape.rect.x * TILE_SIZE
    const y = screenY + shape.rect.y * TILE_SIZE
    const w = shape.rect.w * TILE_SIZE
    const h = shape.rect.h * TILE_SIZE
    ctx.fillRect(x, y, w, h)
  }

  if (shape.type === 'polygon' && shape.vertices) {
    drawPolygonShape(ctx, shape.vertices, screenX, screenY)
  }
}

/**
 * Draw a polygon shape from normalized vertices at screen coordinates
 */
export function drawPolygonShape(
  ctx: CanvasRenderingContext2D,
  vertices: NormalizedPoint[],
  screenX: number,
  screenY: number
): void {
  if (vertices.length < 3) return

  ctx.beginPath()
  const first = vertices[0]
  ctx.moveTo(screenX + first.x * TILE_SIZE, screenY + first.y * TILE_SIZE)

  for (let i = 1; i < vertices.length; i++) {
    const v = vertices[i]
    ctx.lineTo(screenX + v.x * TILE_SIZE, screenY + v.y * TILE_SIZE)
  }

  ctx.closePath()
  ctx.fill()
}

// ============================================
// General Drawing Utilities
// ============================================

/**
 * Draw a rounded rectangle path (does not fill or stroke - call ctx.fill() or ctx.stroke() after)
 */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * Create a vertical gradient for dark backgrounds
 */
export function createDarkGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEWPORT_HEIGHT)
  gradient.addColorStop(0, '#0d1117')
  gradient.addColorStop(0.5, '#161b22')
  gradient.addColorStop(1, '#0d1117')
  return gradient
}

/**
 * Draw a subtle grid pattern overlay
 */
export function drawGridPattern(
  ctx: CanvasRenderingContext2D,
  spacing: number = 40,
  color: string = 'rgba(48, 54, 61, 0.3)'
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  
  for (let x = 0; x < VIEWPORT_WIDTH; x += spacing) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, VIEWPORT_HEIGHT)
    ctx.stroke()
  }
  
  for (let y = 0; y < VIEWPORT_HEIGHT; y += spacing) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(VIEWPORT_WIDTH, y)
    ctx.stroke()
  }
}

/**
 * Draw corner accent lines (L-shaped corners)
 */
export function drawCornerAccents(
  ctx: CanvasRenderingContext2D,
  padding: number = 20,
  cornerSize: number = 40,
  color: string = '#58a6ff'
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  
  // Top-left
  ctx.beginPath()
  ctx.moveTo(padding, padding + cornerSize)
  ctx.lineTo(padding, padding)
  ctx.lineTo(padding + cornerSize, padding)
  ctx.stroke()
  
  // Top-right
  ctx.beginPath()
  ctx.moveTo(VIEWPORT_WIDTH - padding - cornerSize, padding)
  ctx.lineTo(VIEWPORT_WIDTH - padding, padding)
  ctx.lineTo(VIEWPORT_WIDTH - padding, padding + cornerSize)
  ctx.stroke()
  
  // Bottom-left
  ctx.beginPath()
  ctx.moveTo(padding, VIEWPORT_HEIGHT - padding - cornerSize)
  ctx.lineTo(padding, VIEWPORT_HEIGHT - padding)
  ctx.lineTo(padding + cornerSize, VIEWPORT_HEIGHT - padding)
  ctx.stroke()
  
  // Bottom-right
  ctx.beginPath()
  ctx.moveTo(VIEWPORT_WIDTH - padding - cornerSize, VIEWPORT_HEIGHT - padding)
  ctx.lineTo(VIEWPORT_WIDTH - padding, VIEWPORT_HEIGHT - padding)
  ctx.lineTo(VIEWPORT_WIDTH - padding, VIEWPORT_HEIGHT - padding - cornerSize)
  ctx.stroke()
}

/**
 * Create a horizontal fade gradient for decorative lines
 */
export function createFadeGradient(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  width: number,
  color: string = '#58a6ff',
  highlightColor: string = '#79c0ff'
): CanvasGradient {
  const gradient = ctx.createLinearGradient(centerX - width / 2, 0, centerX + width / 2, 0)
  gradient.addColorStop(0, 'transparent')
  gradient.addColorStop(0.2, color)
  gradient.addColorStop(0.5, highlightColor)
  gradient.addColorStop(0.8, color)
  gradient.addColorStop(1, 'transparent')
  return gradient
}

/**
 * Draw a semi-transparent overlay
 */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  alpha: number = 0.7
): void {
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
  ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)
}

/**
 * Draw centered text with optional glow effect
 */
export function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  options: {
    font?: string
    color?: string
    glowColor?: string
    glowBlur?: number
  } = {}
): void {
  const { 
    font = 'bold 24px Arial', 
    color = '#ffffff',
    glowColor,
    glowBlur = 15
  } = options

  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  
  if (glowColor) {
    ctx.shadowColor = glowColor
    ctx.shadowBlur = glowBlur
  }
  
  ctx.fillStyle = color
  ctx.fillText(text, VIEWPORT_WIDTH / 2, y)
  
  ctx.shadowBlur = 0
}

/**
 * Draw a progress bar
 */
export function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number,
  options: {
    bgColor?: string
    fillColor?: string
    borderColor?: string
    rounded?: boolean
    radius?: number
  } = {}
): void {
  const {
    bgColor = '#21262d',
    fillColor = '#238636',
    borderColor = '#30363d',
    rounded = false,
    radius = 4
  } = options

  // Background
  ctx.fillStyle = bgColor
  if (rounded) {
    roundRect(ctx, x, y, width, height, radius)
    ctx.fill()
  } else {
    ctx.fillRect(x, y, width, height)
  }

  // Fill
  if (progress > 0) {
    ctx.fillStyle = fillColor
    if (rounded) {
      roundRect(ctx, x, y, width * progress, height, radius)
      ctx.fill()
    } else {
      ctx.fillRect(x, y, width * progress, height)
    }
  }

  // Border
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1
  if (rounded) {
    roundRect(ctx, x, y, width, height, radius)
    ctx.stroke()
  } else {
    ctx.strokeRect(x, y, width, height)
  }
}
