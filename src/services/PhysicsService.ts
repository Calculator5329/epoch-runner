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
  type AABB,
} from './CollisionUtils'
import type { PlayerStore } from '../stores/PlayerStore'
import type { LevelStore } from '../stores/LevelStore'
import type { GameStore } from '../stores/GameStore'
import type { EntityStore } from '../stores/EntityStore'
import type { Entity } from '../core/types/entities'
import { getEntityDefinition } from '../core/types/entities'

/** Bounce velocity when stomping an enemy */
const STOMP_BOUNCE_VELOCITY = -300

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
   * @param entityStore - Optional entity store for enemy collisions
   */
  update(
    deltaTime: number,
    playerStore: PlayerStore,
    levelStore: LevelStore,
    gameStore: GameStore,
    input?: InputState,
    entityStore?: EntityStore
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

    // Check for entity collision (enemies)
    if (entityStore) {
      this.checkEntityCollisions(playerStore, gameStore, entityStore)
    }

    // Check for falling off the map
    this.checkBoundaries(playerStore, levelStore, gameStore)

    // Check for pickups (coins, powerups)
    this.checkPickups(playerStore, levelStore, gameStore)

    // Check for triggers (goal, checkpoint)
    this.checkTriggers(playerStore, levelStore, gameStore)
  }

  /**
   * Create player AABB at given position
   */
  private createPlayerAABB(player: PlayerStore, x: number, y: number): AABB {
    return {
      x,
      y,
      width: player.currentWidth,
      height: player.currentHeight,
    }
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
    const aabb = this.createPlayerAABB(player, newX, player.y)

    const getTile = (col: number, row: number) => level.getTileAt(col, row)

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
          // Snap player so right edge touches the wall
          player.x = minX - player.currentWidth
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
          // Snap player so left edge touches the wall
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
    const aabb = this.createPlayerAABB(player, player.x, newY)

    const getTile = (col: number, row: number) => level.getTileAt(col, row)

    // Check solid collision
    const solidCollision = checkSolidCollision(aabb, getTile, level.width, level.height)
    
    // Check one-way platform collision (only when falling)
    const platformCollision = checkPlatformCollision(
      aabb, 
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
              const prevBottom = prevY + player.currentHeight
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
                player.currentWidth
              )
              minY = Math.min(minY, surfaceY)
            } else {
              minY = Math.min(minY, col.tileY)
            }
          }
          if (minY !== Infinity) {
            // Snap player so bottom touches the ground
            player.y = minY - player.currentHeight
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
          // Snap player so top touches the ceiling
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
    const aabb: AABB = {
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
    // Only do this when falling (vy >= 0), not when jumping up
    if (!wasGrounded && isNowGrounded && player.vy >= 0) {
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
    // Skip hazard damage in god mode or with invincibility
    if (game.isGodMode || player.hasInvincibility) return

    const aabb = this.createPlayerAABB(player, player.x, player.y)
    const getTile = (col: number, row: number) => level.getTileAt(col, row)
    const hazard = checkHazardCollision(aabb, getTile, level.width, level.height)

    if (hazard) {
      game.onPlayerDeath()
    }
  }

  /**
   * Check for falling off the map (below level bounds)
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
    const aabb = this.createPlayerAABB(player, player.x, player.y)
    const getTile = (col: number, row: number) => level.getTileAt(col, row)
    const pickups = checkPickupCollision(aabb, getTile, level.width, level.height)

    for (const pickup of pickups) {
      if (pickup.tileId === TileTypeId.COIN) {
        game.collectCoin(pickup.col, pickup.row)
        level.setTileAt(pickup.col, pickup.row, TileTypeId.EMPTY)
      } else if (pickup.tileId === TileTypeId.POWERUP_TRIPLE_JUMP) {
        player.grantTripleJump()
        level.setTileAt(pickup.col, pickup.row, TileTypeId.EMPTY)
      } else if (pickup.tileId === TileTypeId.POWERUP_SPEED) {
        player.grantSpeedBoost()
        level.setTileAt(pickup.col, pickup.row, TileTypeId.EMPTY)
      } else if (pickup.tileId === TileTypeId.POWERUP_SUPER_JUMP) {
        player.grantSuperJump()
        level.setTileAt(pickup.col, pickup.row, TileTypeId.EMPTY)
      } else if (pickup.tileId === TileTypeId.POWERUP_INVINCIBILITY) {
        player.grantInvincibility()
        level.setTileAt(pickup.col, pickup.row, TileTypeId.EMPTY)
      } else if (pickup.tileId === TileTypeId.POWERUP_MINI_SIZE) {
        player.grantMiniSize()
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
    const aabb = this.createPlayerAABB(player, player.x, player.y)

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

  /**
   * Check for collisions between player and entities (enemies)
   * Handles stomp kills and damage to player
   */
  private checkEntityCollisions(
    player: PlayerStore,
    game: GameStore,
    entityStore: EntityStore
  ): void {
    // Skip in god mode
    if (game.isGodMode) return

    const playerAABB = this.createPlayerAABB(player, player.x, player.y)
    const enemies = entityStore.getActiveEnemies()

    for (const enemy of enemies) {
      // Check AABB overlap
      if (!this.aabbOverlap(playerAABB, enemy)) continue

      // If player has invincibility, kill enemy on any contact
      if (player.hasInvincibility) {
        entityStore.despawn(enemy.id)
        continue
      }

      // Determine if this is a stomp (player landing on enemy from above)
      const isStomping = this.isStompingEnemy(player, enemy)

      if (isStomping) {
        // Stomp the enemy - kill it and bounce player
        this.stompEnemy(player, enemy, entityStore)
      } else {
        // Player takes damage
        this.damageFromEnemy(player, enemy, game)
      }
    }
  }

  /**
   * Check if two AABBs overlap
   */
  private aabbOverlap(a: AABB, b: { x: number; y: number; width: number; height: number }): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    )
  }

  /**
   * Check if player is stomping an enemy (landing on it from above)
   * Stomp conditions:
   * - Player is falling (vy > 0)
   * - Player's bottom is near the enemy's top (within threshold)
   */
  private isStompingEnemy(player: PlayerStore, enemy: Entity): boolean {
    // Must be falling (or at least not rising)
    if (player.vy < 0) return false

    // Player's bottom edge
    const playerBottom = player.y + player.height
    // Enemy's top edge
    const enemyTop = enemy.y
    // How much overlap is allowed to count as a stomp
    const stompThreshold = enemy.height * 0.4

    // Player's bottom should be near the enemy's top
    // (within the threshold from above)
    return playerBottom <= enemyTop + stompThreshold && playerBottom > enemyTop - 10
  }

  /**
   * Handle stomping an enemy
   */
  private stompEnemy(
    player: PlayerStore,
    enemy: Entity,
    entityStore: EntityStore
  ): void {
    // Reduce enemy health
    enemy.health -= 1

    if (enemy.health <= 0) {
      // Enemy dies
      entityStore.despawn(enemy.id)
    }

    // Bounce the player up
    player.vy = STOMP_BOUNCE_VELOCITY
    player.isGrounded = false
  }

  /**
   * Handle player taking damage from enemy
   */
  private damageFromEnemy(
    _player: PlayerStore,
    enemy: Entity,
    game: GameStore
  ): void {
    const definition = getEntityDefinition(enemy.definitionId)
    const damage = definition?.damage ?? 1

    // For now, any enemy contact kills the player (like spikes)
    // In future, could implement knockback + invincibility frames
    if (damage > 0) {
      game.onPlayerDeath()
    }
  }
}

/**
 * Get the Y position on a slope surface at a given X position
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
  
  const verts = shape.vertices
  
  // Check if this is a slope we recognize
  if (verts.length === 3) {
    if (isShapeMatch(verts, SHAPES.SLOPE_UP_RIGHT.vertices!)) {
      const surfaceY = 1 - relX
      return tileY + surfaceY * TILE_SIZE
    }
    
    if (isShapeMatch(verts, SHAPES.SLOPE_UP_LEFT.vertices!)) {
      const surfaceY = relX
      return tileY + surfaceY * TILE_SIZE
    }
    
    if (isShapeMatch(verts, SHAPES.SLOPE_DOWN_RIGHT.vertices!)) {
      const surfaceY = relX
      return tileY + surfaceY * TILE_SIZE
    }
    
    if (isShapeMatch(verts, SHAPES.SLOPE_DOWN_LEFT.vertices!)) {
      const surfaceY = 1 - relX
      return tileY + surfaceY * TILE_SIZE
    }
  }
  
  return tileY
}

/**
 * Check if two vertex arrays represent the same shape
 */
function isShapeMatch(a: NormalizedPoint[], b: NormalizedPoint[]): boolean {
  if (a.length !== b.length) return false
  
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i].x - b[i].x) > 0.001 || Math.abs(a[i].y - b[i].y) > 0.001) {
      return false
    }
  }
  return true
}

// Singleton instance
export const physicsService = new PhysicsService()
