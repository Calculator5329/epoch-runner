import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../../core/constants'
import { getAllLevels } from '../../../levels'
import type { UIStore } from '../../../stores/UIStore'
import { drawOverlay } from '../DrawingUtils'

/**
 * AdminMenuRenderer - Renders the admin level select overlay
 * 
 * Shows list of all available levels for quick jumping during development.
 */
export class AdminMenuRenderer {
  /**
   * Draw the admin level selector overlay
   */
  draw(
    ctx: CanvasRenderingContext2D, 
    currentLevelId: string | null,
    uiStore: UIStore
  ): void {
    const levels = getAllLevels()
    
    // Menu dimensions
    const menuWidth = 500
    const menuHeight = 60 + levels.length * 40 + 60  // title + items + footer
    const menuX = (VIEWPORT_WIDTH - menuWidth) / 2
    const menuY = (VIEWPORT_HEIGHT - menuHeight) / 2
    const itemHeight = 40
    const startY = menuY + 60  // After title
    
    // Dark overlay
    drawOverlay(ctx, 0.85)
    
    // Menu background
    ctx.fillStyle = 'rgba(30, 30, 50, 0.95)'
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight)
    
    // Menu border
    ctx.strokeStyle = '#4299e1'
    ctx.lineWidth = 2
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight)
    
    // Title
    ctx.fillStyle = '#4299e1'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('ADMIN: LEVEL SELECT', VIEWPORT_WIDTH / 2, menuY + 35)
    
    // Level list
    ctx.font = '18px Arial'
    ctx.textAlign = 'left'
    
    levels.forEach((level, index) => {
      const itemY = startY + index * itemHeight
      const isCurrentLevel = level.id === currentLevelId
      const isHovered = uiStore.hoveredLevelIndex === index
      
      // Highlight hovered level
      if (isHovered && !isCurrentLevel) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(menuX + 10, itemY, menuWidth - 20, itemHeight - 5)
      }
      
      // Highlight current level
      if (isCurrentLevel) {
        ctx.fillStyle = 'rgba(66, 153, 225, 0.3)'
        ctx.fillRect(menuX + 10, itemY, menuWidth - 20, itemHeight - 5)
      }
      
      // Text color based on state
      const textColor = isCurrentLevel ? '#4299e1' : (isHovered ? '#63b3ed' : '#ffffff')
      ctx.fillStyle = textColor
      
      // Level indicator
      const indicator = isCurrentLevel ? '>' : (isHovered ? '>' : ' ')
      ctx.fillText(`[${indicator}]`, menuX + 20, itemY + itemHeight / 2)
      
      // Level ID
      ctx.fillStyle = isHovered ? '#aaa' : '#888'
      ctx.fillText(level.id, menuX + 60, itemY + itemHeight / 2)
      
      // Level name
      ctx.fillStyle = textColor
      ctx.fillText(`- ${level.name}`, menuX + 220, itemY + itemHeight / 2)
    })
    
    // Footer instructions
    const footerY = startY + levels.length * itemHeight + 20
    ctx.fillStyle = '#666'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Click to load  |  ` or ESC to close', VIEWPORT_WIDTH / 2, footerY)
    
    // Store menu bounds for click detection
    uiStore.setAdminMenuBounds({
      x: menuX,
      y: startY,
      width: menuWidth,
      itemHeight,
      levelCount: levels.length,
    })
  }
}
