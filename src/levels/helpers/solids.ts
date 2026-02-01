import { TileTypeId } from '../../core/types'
import type { TilePlacement } from '../types'

// ============================================
// Material Helper Factory
// ============================================

/**
 * Create single tile and platform helpers for a material type
 */
function createMaterialHelper(tileTypeId: TileTypeId) {
  return {
    single: (col: number, row: number): TilePlacement[] => 
      [{ col, row, type: tileTypeId }],
    platform: (startCol: number, row: number, length: number): TilePlacement[] =>
      Array.from({ length }, (_, i) => ({ col: startCol + i, row, type: tileTypeId }))
  }
}

// ============================================
// Basic Solid Tile Helpers
// ============================================

/**
 * Create a horizontal platform (row of solid tiles)
 */
export function platform(startCol: number, row: number, length: number): TilePlacement[] {
  return Array.from({ length }, (_, i) => ({
    col: startCol + i,
    row,
    type: TileTypeId.SOLID_FULL,
  }))
}

/**
 * Create a vertical wall (column of solid tiles)
 */
export function wall(col: number, startRow: number, height: number): TilePlacement[] {
  return Array.from({ length: height }, (_, i) => ({
    col,
    row: startRow + i,
    type: TileTypeId.SOLID_FULL,
  }))
}

/**
 * Fill a rectangle with a tile type
 */
export function rect(
  startCol: number,
  startRow: number,
  width: number,
  height: number,
  type: number = TileTypeId.SOLID_FULL
): TilePlacement[] {
  const placements: TilePlacement[] = []
  for (let row = startRow; row < startRow + height; row++) {
    for (let col = startCol; col < startCol + width; col++) {
      placements.push({ col, row, type })
    }
  }
  return placements
}

/**
 * Create a hollow rectangle (outline only)
 */
export function hollowRect(
  startCol: number,
  startRow: number,
  width: number,
  height: number,
  type: number = TileTypeId.SOLID_FULL
): TilePlacement[] {
  const placements: TilePlacement[] = []
  
  // Top and bottom edges
  for (let col = startCol; col < startCol + width; col++) {
    placements.push({ col, row: startRow, type })
    placements.push({ col, row: startRow + height - 1, type })
  }
  
  // Left and right edges (excluding corners already placed)
  for (let row = startRow + 1; row < startRow + height - 1; row++) {
    placements.push({ col: startCol, row, type })
    placements.push({ col: startCol + width - 1, row, type })
  }
  
  return placements
}

// ============================================
// Material Variants (Using Factory)
// ============================================

const brickHelper = createMaterialHelper(TileTypeId.SOLID_BRICK)
/** Place a brick block */
export const brick = brickHelper.single
/** Create a row of brick blocks */
export const brickPlatform = brickHelper.platform

const stoneHelper = createMaterialHelper(TileTypeId.SOLID_STONE)
/** Place a stone block */
export const stone = stoneHelper.single
/** Create a row of stone blocks */
export const stonePlatform = stoneHelper.platform

const metalHelper = createMaterialHelper(TileTypeId.SOLID_METAL)
/** Place a metal block */
export const metal = metalHelper.single
/** Create a row of metal blocks */
export const metalPlatform = metalHelper.platform

const woodHelper = createMaterialHelper(TileTypeId.SOLID_WOOD)
/** Place a wood block */
export const wood = woodHelper.single
/** Create a row of wood blocks */
export const woodPlatform = woodHelper.platform

const iceHelper = createMaterialHelper(TileTypeId.SOLID_ICE)
/** Place an ice block */
export const ice = iceHelper.single
/** Create a row of ice blocks */
export const icePlatform = iceHelper.platform

const grassHelper = createMaterialHelper(TileTypeId.SOLID_GRASS)
/** Place a grass block */
export const grass = grassHelper.single
/** Create a row of grass blocks */
export const grassPlatform = grassHelper.platform

const sandHelper = createMaterialHelper(TileTypeId.SOLID_SAND)
/** Place a sand block */
export const sand = sandHelper.single
/** Create a row of sand blocks */
export const sandPlatform = sandHelper.platform

const dirtHelper = createMaterialHelper(TileTypeId.SOLID_DIRT)
/** Place a dirt block */
export const dirt = dirtHelper.single
/** Create a row of dirt blocks */
export const dirtPlatform = dirtHelper.platform

const crystalHelper = createMaterialHelper(TileTypeId.SOLID_CRYSTAL)
/** Place a crystal block */
export const crystal = crystalHelper.single
/** Create a row of crystal blocks */
export const crystalPlatform = crystalHelper.platform

const lavaRockHelper = createMaterialHelper(TileTypeId.SOLID_LAVA_ROCK)
/** Place a lava rock block */
export const lavaRock = lavaRockHelper.single
/** Create a row of lava rock blocks */
export const lavaRockPlatform = lavaRockHelper.platform
