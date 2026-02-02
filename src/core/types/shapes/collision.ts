/**
 * Collision Shape System
 * 
 * Grid is for placement; collision shapes define actual physics boundaries.
 * Shapes are normalized to 0-1 range relative to tile size.
 */

// Normalized point (0-1 range within a tile)
export interface NormalizedPoint {
  x: number  // 0 = left edge, 1 = right edge
  y: number  // 0 = top edge, 1 = bottom edge
}

// Normalized rectangle (0-1 range within a tile)
export interface NormalizedRect {
  x: number      // left edge (0-1)
  y: number      // top edge (0-1)
  w: number      // width (0-1)
  h: number      // height (0-1)
}

// Collision shape definition
export interface CollisionShape {
  type: 'none' | 'rect' | 'polygon'
  rect?: NormalizedRect
  vertices?: NormalizedPoint[]  // For polygon type
}

// ============================================
// Predefined Collision Shapes
// ============================================

export const SHAPES = {
  // No collision
  NONE: { type: 'none' } as CollisionShape,
  
  // Full tile
  FULL: { 
    type: 'rect', 
    rect: { x: 0, y: 0, w: 1, h: 1 } 
  } as CollisionShape,
  
  // Half blocks (horizontal)
  HALF_LEFT: { 
    type: 'rect', 
    rect: { x: 0, y: 0, w: 0.5, h: 1 } 
  } as CollisionShape,
  
  HALF_RIGHT: { 
    type: 'rect', 
    rect: { x: 0.5, y: 0, w: 0.5, h: 1 } 
  } as CollisionShape,
  
  // Half blocks (vertical)
  HALF_TOP: { 
    type: 'rect', 
    rect: { x: 0, y: 0, w: 1, h: 0.5 } 
  } as CollisionShape,
  
  HALF_BOTTOM: { 
    type: 'rect', 
    rect: { x: 0, y: 0.5, w: 1, h: 0.5 } 
  } as CollisionShape,
  
  // Quarter blocks
  QUARTER_TL: { 
    type: 'rect', 
    rect: { x: 0, y: 0, w: 0.5, h: 0.5 } 
  } as CollisionShape,
  
  QUARTER_TR: { 
    type: 'rect', 
    rect: { x: 0.5, y: 0, w: 0.5, h: 0.5 } 
  } as CollisionShape,
  
  QUARTER_BL: { 
    type: 'rect', 
    rect: { x: 0, y: 0.5, w: 0.5, h: 0.5 } 
  } as CollisionShape,
  
  QUARTER_BR: { 
    type: 'rect', 
    rect: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 } 
  } as CollisionShape,
  
  // Slopes (triangles) - vertices in clockwise order
  SLOPE_UP_RIGHT: {
    type: 'polygon',
    vertices: [
      { x: 0, y: 1 },   // bottom-left
      { x: 1, y: 1 },   // bottom-right
      { x: 1, y: 0 },   // top-right
    ]
  } as CollisionShape,
  
  SLOPE_UP_LEFT: {
    type: 'polygon',
    vertices: [
      { x: 0, y: 0 },   // top-left
      { x: 0, y: 1 },   // bottom-left
      { x: 1, y: 1 },   // bottom-right
    ]
  } as CollisionShape,
  
  SLOPE_DOWN_RIGHT: {
    type: 'polygon',
    vertices: [
      { x: 0, y: 0 },   // top-left
      { x: 1, y: 0 },   // top-right
      { x: 1, y: 1 },   // bottom-right
    ]
  } as CollisionShape,
  
  SLOPE_DOWN_LEFT: {
    type: 'polygon',
    vertices: [
      { x: 0, y: 0 },   // top-left
      { x: 1, y: 0 },   // top-right
      { x: 0, y: 1 },   // bottom-left
    ]
  } as CollisionShape,
  
  // Spike shapes (thin triangles for hazards)
  SPIKE_UP: {
    type: 'polygon',
    vertices: [
      { x: 0.2, y: 1 },   // bottom-left
      { x: 0.8, y: 1 },   // bottom-right
      { x: 0.5, y: 0.2 }, // top point
    ]
  } as CollisionShape,
  
  SPIKE_DOWN: {
    type: 'polygon',
    vertices: [
      { x: 0.2, y: 0 },   // top-left
      { x: 0.8, y: 0 },   // top-right
      { x: 0.5, y: 0.8 }, // bottom point
    ]
  } as CollisionShape,
  
  SPIKE_LEFT: {
    type: 'polygon',
    vertices: [
      { x: 1, y: 0.2 },   // top-right
      { x: 1, y: 0.8 },   // bottom-right
      { x: 0.2, y: 0.5 }, // left point
    ]
  } as CollisionShape,
  
  SPIKE_RIGHT: {
    type: 'polygon',
    vertices: [
      { x: 0, y: 0.2 },   // top-left
      { x: 0.8, y: 0.5 }, // right point
      { x: 0, y: 0.8 },   // bottom-left
    ]
  } as CollisionShape,
  
  // Small centered shape for pickups (coins, powerups)
  PICKUP: {
    type: 'rect',
    rect: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 }
  } as CollisionShape,
} as const
