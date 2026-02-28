import { TILE_SIZE, GRAVITY, MAX_FALL_SPEED } from '../core/constants'
import type { Entity } from '../core/types/entities'
import { getEntityDefinition } from '../core/types/entities'
import type { EntityStore } from '../stores/EntityStore'
import type { LevelStore } from '../stores/LevelStore'

/**
 * EntityService - Handles entity behavior and physics
 * 
 * Updates all entities each frame: AI behavior, movement, gravity.
 * Stateless service that receives stores as parameters.
 */
class EntityService {
  /**
   * Update all active entities
   */
  update(
    deltaTime: number,
    entityStore: EntityStore,
    levelStore: LevelStore
  ): void {
    const entities = entityStore.getActive()
    
    for (const entity of entities) {
      this.updateEntity(entity, deltaTime, levelStore)
    }
  }

  /**
   * Update a single entity based on its type
   */
  private updateEntity(
    entity: Entity,
    deltaTime: number,
    levelStore: LevelStore
  ): void {
    switch (entity.type) {
      case 'enemy_patrol':
        this.updatePatrolEnemy(entity, deltaTime, levelStore)
        break
      case 'enemy_static':
        // Static enemies don't move, just apply gravity if needed
        this.applyGravity(entity, deltaTime, levelStore)
        break
      default:
        // Unknown type, just apply gravity
        this.applyGravity(entity, deltaTime, levelStore)
    }
  }

  /**
   * Update patrol enemy - walks back and forth
   */
  private updatePatrolEnemy(
    entity: Entity,
    deltaTime: number,
    levelStore: LevelStore
  ): void {
    const definition = getEntityDefinition(entity.definitionId)
    if (!definition) return
    
    // Set velocity based on direction
    entity.vx = entity.direction === 'right' ? definition.speed : -definition.speed
    
    // Check if should turn around
    if (this.shouldTurnAround(entity, levelStore)) {
      entity.direction = entity.direction === 'right' ? 'left' : 'right'
      entity.vx = -entity.vx
    }
    
    // Apply gravity
    this.applyGravity(entity, deltaTime, levelStore)
    
    // Move horizontally
    this.moveHorizontal(entity, deltaTime, levelStore)
  }

  /**
   * Check if patrol enemy should turn around
   * Returns true if hitting a wall or about to walk off ledge
   */
  private shouldTurnAround(entity: Entity, levelStore: LevelStore): boolean {
    const movingRight = entity.direction === 'right'
    
    // Check for wall ahead
    const checkX = movingRight 
      ? entity.x + entity.width + 2  // Right edge + small buffer
      : entity.x - 2                  // Left edge - small buffer
    const checkY = entity.y + entity.height / 2  // Middle height
    
    const col = Math.floor(checkX / TILE_SIZE)
    const row = Math.floor(checkY / TILE_SIZE)
    
    if (levelStore.isSolidAt(col, row)) {
      return true  // Wall ahead
    }
    
    // Check for ledge (no ground ahead)
    // Only check if grounded to avoid turning in mid-air
    if (entity.isGrounded) {
      const groundCheckX = movingRight
        ? entity.x + entity.width + 4  // Slightly ahead
        : entity.x - 4
      const groundCheckY = entity.y + entity.height + 4  // Below feet
      
      const groundCol = Math.floor(groundCheckX / TILE_SIZE)
      const groundRow = Math.floor(groundCheckY / TILE_SIZE)
      
      // If no solid ground ahead, turn around
      if (!levelStore.isSolidAt(groundCol, groundRow)) {
        return true  // Ledge ahead
      }
    }
    
    return false
  }

  /**
   * Apply gravity to entity
   */
  private applyGravity(
    entity: Entity,
    deltaTime: number,
    levelStore: LevelStore
  ): void {
    // Apply gravity
    entity.vy += GRAVITY * deltaTime
    
    // Cap fall speed
    if (entity.vy > MAX_FALL_SPEED) {
      entity.vy = MAX_FALL_SPEED
    }
    
    // Move vertically
    const newY = entity.y + entity.vy * deltaTime
    
    // Check ground collision
    if (entity.vy >= 0) {
      // Falling - check for ground
      const bottomY = newY + entity.height
      const leftCol = Math.floor(entity.x / TILE_SIZE)
      const rightCol = Math.floor((entity.x + entity.width - 1) / TILE_SIZE)
      const bottomRow = Math.floor(bottomY / TILE_SIZE)
      
      let hitGround = false
      for (let col = leftCol; col <= rightCol; col++) {
        if (levelStore.isSolidAt(col, bottomRow)) {
          hitGround = true
          break
        }
      }
      
      if (hitGround) {
        // Snap to ground
        entity.y = bottomRow * TILE_SIZE - entity.height
        entity.vy = 0
        entity.isGrounded = true
      } else {
        entity.y = newY
        entity.isGrounded = false
      }
    } else {
      // Rising - check for ceiling
      const topRow = Math.floor(newY / TILE_SIZE)
      const leftCol = Math.floor(entity.x / TILE_SIZE)
      const rightCol = Math.floor((entity.x + entity.width - 1) / TILE_SIZE)
      
      let hitCeiling = false
      for (let col = leftCol; col <= rightCol; col++) {
        if (levelStore.isSolidAt(col, topRow)) {
          hitCeiling = true
          break
        }
      }
      
      if (hitCeiling) {
        entity.y = (topRow + 1) * TILE_SIZE
        entity.vy = 0
      } else {
        entity.y = newY
      }
      entity.isGrounded = false
    }
  }

  /**
   * Move entity horizontally with collision
   */
  private moveHorizontal(
    entity: Entity,
    deltaTime: number,
    levelStore: LevelStore
  ): void {
    if (entity.vx === 0) return
    
    const newX = entity.x + entity.vx * deltaTime
    
    // Check collision
    const topRow = Math.floor(entity.y / TILE_SIZE)
    const bottomRow = Math.floor((entity.y + entity.height - 1) / TILE_SIZE)
    
    if (entity.vx > 0) {
      // Moving right
      const rightCol = Math.floor((newX + entity.width) / TILE_SIZE)
      
      let hitWall = false
      for (let row = topRow; row <= bottomRow; row++) {
        if (levelStore.isSolidAt(rightCol, row)) {
          hitWall = true
          break
        }
      }
      
      if (hitWall) {
        entity.x = rightCol * TILE_SIZE - entity.width
      } else {
        entity.x = newX
      }
    } else {
      // Moving left
      const leftCol = Math.floor(newX / TILE_SIZE)
      
      let hitWall = false
      for (let row = topRow; row <= bottomRow; row++) {
        if (levelStore.isSolidAt(leftCol, row)) {
          hitWall = true
          break
        }
      }
      
      if (hitWall) {
        entity.x = (leftCol + 1) * TILE_SIZE
      } else {
        entity.x = newX
      }
    }
  }
}

// Export singleton
export const entityService = new EntityService()
