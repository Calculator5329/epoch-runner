import { TILE_SIZE, GRAVITY, MAX_FALL_SPEED, PLAYER_SPEED } from '../core/constants'
import { TileTypeId, getTileType, isTileTypeSolid, isTileTypePlatform, SHAPES } from '../core/types/shapes'
import type { CollisionShape, NormalizedPoint } from '../core/types/shapes'
import type { InputState } from '../core/types'
import {
  checkSolidCollision,
  checkHazardCollision,
  checkPickupCollision,
  checkPlatformCollision,
  checkTileCollisions,
} from './CollisionUtils'
import type { PlayerStore } from '../stores/PlayerStore'
import type { LevelStore } from '../stores/LevelStore'
import type { GameStore } from '../stores/GameStore'

/**
 * PhysicsService - Stateless physics and collision logic
 * 
 * Handles gravity, movement, and shape-based collision detection/response.
 * Reads from stores, writes position updates back to PlayerStore.
 */
class PhysicsService {
  /**
   * Main physics update - called once per frame
   * @param input - Optional input state for noclip vertical movement
   */
  update(
    deltaTime: number,
    playerStore: PlayerStore,
    levelStore: LevelStore,
    gameStore: GameStore,
    input?: InputState
  ): void {
    // Don't update if game is paused, complete, or game over
    if (gameStore.isPaused || gameStore.levelComplete || gameStore.isGameOver) {
      return
    }

    // Store previous position for platform collision
    const prevY = playerStore.y

    // Noclip mode: free flight, no gravity
    if (gameStore.isNoclip) {
      // Calculate vertical velocity from input (up/down keys)
      let flyVy = 0
      if (input) {
        if (input.up && !input.down) flyVy = -PLAYER_SPEED
        else if (input.down && !input.up) flyVy = PLAYER_SPEED
      }
      
      // Direct movement without collision
      playerStore.x += playerStore.vx * deltaTime
      playerStore.y += flyVy * deltaTime
      
      // Still check pickups and triggers in noclip
      this.checkPickups(playerStore, levelStore, gameStore)
      this.checkTriggers(playerStore, levelStore, gameStore)
      return
    }

    // Apply gravity
    playerStore.vy += GRAVITY * deltaTime
    
    // Cap fall speed
    if (playerStore.vy > MAX_FALL_SPEED) {
      playerStore.vy = MAX_FALL_SPEED
    }

    // Calculate intended movement
    const moveX = playerStore.vx * deltaTime
    const moveY = playerStore.vy * deltaTime

    // Move and collide horizontally first
    this.moveHorizontal(playerStore, levelStore, moveX)
    
    // Then move and collide vertically
    this.moveVertical(playerStore, levelStore, moveY, prevY)

    // Check for hazard collision
    this.checkHazards(playerStore, levelStore, gameStore)

    // Check for falling off the map
    this.checkBoundaries(playerStore, levelStore, gameStore)

    // Check for pickups (coins, powerups)
    this.checkPickups(playerStore, levelStore, gameStore)

    // Check for triggers (goal, checkpoint)
    this.checkTriggers(playerStore, levelStore, gameStore)
  }

  /**
   * Move player horizontally with shape-based collision detection
   */
  private moveHorizontal(
    player: PlayerStore,
    level: LevelStore,
    moveX: number
  ): void {
    if (moveX === 0) return

    const newX = player.x + moveX
    const aabb = {
      x: newX,
      y: player.y,
      width: player.width,
      height: player.height,
    }

    const getTile = (col: number, row: number) => level.getTileAt(col, row)

    // Check collision at new position
    if (checkSolidCollision(aabb, getTile, level.width, level.height)) {
      // Hit a wall - snap to tile edge
      if (moveX > 0) {
        // Moving right - find the leftmost collision and snap to its left edge
        const collisions = checkTileCollisions(aabb, getTile, level.width, level.height, isTileTypeSolid)
        if (collisions.length > 0) {
          let minX = Infinity
          for (const col of collisions) {
            const tileType = getTileType(col.tileId)
            if (tileType.collision.type === 'rect' && tileType.collision.rect) {
              const shapeLeft = col.tileX + tileType.collision.rect.x * TILE_SIZE
              minX = Math.min(minX, shapeLeft)
            } else {
              minX = Math.min(minX, col.tileX)
            }
          }
          player.x = minX - player.width
        }
      } else {
        // Moving left - find the rightmost collision and snap to its right edge
        const collisions = checkTileCollisions(aabb, getTile, level.width, level.height, isTileTypeSolid)
        if (collisions.length > 0) {
          let maxX = -Infinity
          for (const col of collisions) {
            const tileType = getTileType(col.tileId)
            if (tileType.collision.type === 'rect' && tileType.collision.rect) {
              const shapeRight = col.tileX + (tileType.collision.rect.x + tileType.collision.rect.w) * TILE_SIZE
              maxX = Math.max(maxX, shapeRight)
            } else {
              maxX = Math.max(maxX, col.tileX + TILE_SIZE)
            }
          }
          player.x = maxX
        }
      }
      player.vx = 0
    } else {
      player.x = newX
    }
  }

  /**
   * Move player vertically with shape-based collision detection
   */
  private moveVertical(
    player: PlayerStore,
    level: LevelStore,
    moveY: number,
    prevY: number
  ): void {
    if (moveY === 0) return

    const newY = player.y + moveY
    const aabb = {
      x: player.x,
      y: newY,
      width: player.width,
      height: player.height,
    }

    const getTile = (col: number, row: number) => level.getTileAt(col, row)

    // Check solid collision
    const solidCollision = checkSolidCollision(aabb, getTile, level.width, level.height)
    
    // Check one-way platform collision (only when falling)
    const platformAabb = { ...aabb, y: prevY + moveY }
    const platformCollision = checkPlatformCollision(
      platformAabb, 
      prevY, 
      getTile, 
      level.width, 
      level.height
    )

    if (solidCollision || platformCollision) {
      if (moveY > 0) {
        // Falling - land on ground or platform
        const collisions = checkTileCollisions(aabb, getTile, level.width, level.height, 
          (id) => isTileTypeSolid(id) || isTileTypePlatform(id))
        
        if (collisions.length > 0) {
          let minY = Infinity
          for (const col of collisions) {
            const tileType = getTileType(col.tileId)
            
            // Skip platforms if we were below them
            if (isTileTypePlatform(col.tileId)) {
              const platformTop = col.tileY + (tileType.collision.rect?.y || 0) * TILE_SIZE
              const prevBottom = prevY + player.height
              if (prevBottom > platformTop + 1) continue
            }
            
            if (tileType.collision.type === 'rect' && tileType.collision.rect) {
              const shapeTop = col.tileY + tileType.collision.rect.y * TILE_SIZE
              minY = Math.min(minY, shapeTop)
            } else if (tileType.collision.type === 'polygon') {
              // For slopes, calculate the surface Y at player's position
              const surfaceY = getSlopeSurfaceY(
                tileType.collision,
                col.tileX,
                col.tileY,
                player.x,
                player.width
              )
              minY = Math.min(minY, surfaceY)
            } else {
              minY = Math.min(minY, col.tileY)
            }
          }
          if (minY !== Infinity) {
            player.y = minY - player.height
            // Don't set isGrounded here - let updateGroundedState handle it
            // so that onLand() is called properly to reset jumpsRemaining
          }
        }
      } else {
        // Jumping up - hit ceiling
        const collisions = checkTileCollisions(aabb, getTile, level.width, level.height, isTileTypeSolid)
        if (collisions.length > 0) {
          let maxY = -Infinity
          for (const col of collisions) {
            const tileType = getTileType(col.tileId)
            if (tileType.collision.type === 'rect' && tileType.collision.rect) {
              const shapeBottom = col.tileY + (tileType.collision.rect.y + tileType.collision.rect.h) * TILE_SIZE
              maxY = Math.max(maxY, shapeBottom)
            } else {
              maxY = Math.max(maxY, col.tileY + TILE_SIZE)
            }
          }
          player.y = maxY
        }
      }
      player.vy = 0
    } else {
      player.y = newY
      // If we're moving down and not colliding, we're not grounded
      if (moveY > 0) {
        player.isGrounded = false
      }
    }

    // Double-check grounded state
    this.updateGroundedState(player, level)
  }

  /**
   * Update grounded state by checking tile directly below player
   */
  private updateGroundedState(player: PlayerStore, level: LevelStore): void {
    // Check a small distance below the player's feet
    const aabb = {
      x: player.x,
      y: player.y + player.height + 1,
      width: player.width,
      height: 2,
    }

    const getTile = (col: number, row: number) => level.getTileAt(col, row)
    
    // Check for solid or platform tiles below
    const belowCollision = checkTileCollisions(
      aabb, 
      getTile, 
      level.width, 
      level.height,
      (id) => isTileTypeSolid(id) || isTileTypePlatform(id)
    )

    const wasGrounded = player.isGrounded
    const isNowGrounded = belowCollision.length > 0

    // Call onLand() when transitioning from air to ground (resets jumpsRemaining)
    if (!wasGrounded && isNowGrounded) {
      player.onLand()
    } else {
      player.isGrounded = isNowGrounded
    }
  }

  /**
   * Check for hazard collisions
   */
  private checkHazards(
    player: PlayerStore,
    level: LevelStore,
    game: GameStore
  ): void {
    // Skip hazard damage in god mode
    if (game.isGodMode) return

    const aabb = {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height,
    }

    const getTile = (col: number, row: number) => level.getTileAt(col, row)
    const hazard = checkHazardCollision(aabb, getTile, level.width, level.height)

    if (hazard) {
      game.onPlayerDeath()
    }
  }

  /**
   * Check for falling off the map (below level bounds)
   * Treats falling off as death to respawn player at checkpoint or start
   */
  private checkBoundaries(
    player: PlayerStore,
    level: LevelStore,
    game: GameStore
  ): void {
    // Skip boundary death in god mode
    if (game.isGodMode) return

    // Level height in pixels (bottom edge of level)
    const levelBottomY = level.height * TILE_SIZE
    
    // If player's top edge is below the level, they've fallen off
    if (player.y > levelBottomY) {
      game.onPlayerDeath()
    }
  }

  /**
   * Check for pickup collisions (coins, powerups)
   */
  private checkPickups(
    player: PlayerStore,
    level: LevelStore,
    game: GameStore
  ): void {
    const aabb = {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height,
    }

    const getTile = (col: number, row: number) => level.getTileAt(col, row)
    const pickups = checkPickupCollision(aabb, getTile, level.width, level.height)

    for (const pickup of pickups) {
      if (pickup.tileId === TileTypeId.COIN) {
        game.collectCoin(pickup.col, pickup.row)
        level.setTileAt(pickup.col, pickup.row, TileTypeId.EMPTY)
      } else if (pickup.tileId === TileTypeId.POWERUP_DOUBLE_JUMP) {
        player.grantDoubleJump()
        level.setTileAt(pickup.col, pickup.row, TileTypeId.EMPTY)
      }
    }
  }

  /**
   * Check for trigger collisions (goal, checkpoint)
   */
  private checkTriggers(
    player: PlayerStore,
    level: LevelStore,
    game: GameStore
  ): void {
    const aabb = {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height,
    }

    const getTile = (col: number, row: number) => level.getTileAt(col, row)
    
    // Check all tiles player overlaps for triggers
    const triggers = checkTileCollisions(
      aabb,
      getTile,
      level.width,
      level.height,
      (id) => id === TileTypeId.GOAL || id === TileTypeId.CHECKPOINT
    )

    for (const trigger of triggers) {
      if (trigger.tileId === TileTypeId.GOAL) {
        game.completeLevel()
      } else if (trigger.tileId === TileTypeId.CHECKPOINT) {
        game.setCheckpoint(trigger.col, trigger.row)
      }
    }
  }
}

/**
 * Get the Y position on a slope surface at a given X position
 * Returns the Y in world coordinates where the player should land
 */
function getSlopeSurfaceY(
  shape: CollisionShape,
  tileX: number,
  tileY: number,
  playerX: number,
  playerWidth: number
): number {
  if (shape.type !== 'polygon' || !shape.vertices) {
    return tileY
  }

  // Find the player's center X relative to the tile (0-1)
  const playerCenterX = playerX + playerWidth / 2
  const relX = Math.max(0, Math.min(1, (playerCenterX - tileX) / TILE_SIZE))
  
  // For slopes, find the surface Y at this X position
  // We need to find which edge of the polygon forms the "top" surface
  const verts = shape.vertices
  
  // Check if this is a slope we recognize
  if (verts.length === 3) {
    // SLOPE_UP_RIGHT: bottom-left (0,1), bottom-right (1,1), top-right (1,0)
    // Surface goes from (0,1) to (1,0) - Y decreases as X increases
    if (isShapeMatch(verts, SHAPES.SLOPE_UP_RIGHT.vertices!)) {
      const surfaceY = 1 - relX  // Y = 1 at x=0, Y = 0 at x=1
      return tileY + surfaceY * TILE_SIZE
    }
    
    // SLOPE_UP_LEFT: top-left (0,0), bottom-left (0,1), bottom-right (1,1)
    // Surface goes from (0,0) to (1,1) - Y increases as X increases
    if (isShapeMatch(verts, SHAPES.SLOPE_UP_LEFT.vertices!)) {
      const surfaceY = relX  // Y = 0 at x=0, Y = 1 at x=1
      return tileY + surfaceY * TILE_SIZE
    }
    
    // SLOPE_DOWN_RIGHT: top-left (0,0), top-right (1,0), bottom-right (1,1)
    // Surface goes from (0,0) to (1,1) on the right side
    if (isShapeMatch(verts, SHAPES.SLOPE_DOWN_RIGHT.vertices!)) {
      const surfaceY = relX  // Y = 0 at x=0, Y = 1 at x=1
      return tileY + surfaceY * TILE_SIZE
    }
    
    // SLOPE_DOWN_LEFT: top-left (0,0), top-right (1,0), bottom-left (0,1)
    // Surface goes from (1,0) to (0,1)
    if (isShapeMatch(verts, SHAPES.SLOPE_DOWN_LEFT.vertices!)) {
      const surfaceY = 1 - relX  // Y = 1 at x=0, Y = 0 at x=1
      return tileY + surfaceY * TILE_SIZE
    }
  }
  
  // Default fallback: use tile top
  return tileY
}

/**
 * Check if two vertex arrays represent the same shape
 */
function isShapeMatch(a: NormalizedPoint[], b: NormalizedPoint[]): boolean {
  if (a.length !== b.length) return false
  
  // Check if all vertices match (allowing for floating point tolerance)
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i].x - b[i].x) > 0.001 || Math.abs(a[i].y - b[i].y) > 0.001) {
      return false
    }
  }
  return true
}

// Singleton instance
export const physicsService = new PhysicsService()
