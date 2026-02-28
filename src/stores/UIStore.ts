import { makeAutoObservable } from 'mobx'
import { getAllLevels } from '../levels'

/**
 * Bounds for hit testing UI elements
 */
export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Bounds for admin menu items
 */
export interface AdminMenuBounds {
  x: number
  y: number
  width: number
  itemHeight: number
  levelCount: number
}

/**
 * Bounds for roadmap phase cards
 */
export interface RoadmapPhaseBounds {
  cardX: number
  startY: number
  cardWidth: number
  cardHeight: number
  cardGap: number
  phaseCount: number
}

/**
 * UIStore - Manages UI interaction state for canvas-based screens
 * 
 * Handles hover states, selection states, and bounds for hit testing.
 * This keeps UI interaction state in MobX where it belongs, separate
 * from the stateless rendering services.
 */
export class UIStore {
  // ============================================
  // Admin Menu State
  // ============================================
  
  /** Currently hovered level in admin menu (null if none) */
  hoveredLevelIndex: number | null = null
  
  /** Bounds for admin menu hit testing */
  adminMenuBounds: AdminMenuBounds | null = null

  // ============================================
  // Intro Screen Terminal State
  // ============================================
  
  /** Whether the terminal is being hovered */
  isTerminalHovered = false
  
  /** Bounds for terminal hit testing */
  terminalBounds: Bounds | null = null

  // ============================================
  // Roadmap Screen State
  // ============================================
  
  /** Currently selected phase for detail view (null = list view) */
  selectedRoadmapPhase: number | null = null
  
  /** Currently hovered phase index */
  hoveredRoadmapPhase: number | null = null
  
  /** Bounds for phase cards hit testing */
  roadmapPhaseBounds: RoadmapPhaseBounds | null = null

  constructor() {
    makeAutoObservable(this)
  }

  // ============================================
  // Admin Menu Methods
  // ============================================

  /**
   * Update hover position for admin menu
   */
  updateAdminMenuHover(mouseX: number, mouseY: number): void {
    if (!this.adminMenuBounds) {
      this.hoveredLevelIndex = null
      return
    }
    
    const { x, y, width, itemHeight, levelCount } = this.adminMenuBounds
    
    // Check if mouse is within menu item bounds
    if (mouseX < x || mouseX > x + width) {
      this.hoveredLevelIndex = null
      return
    }
    if (mouseY < y || mouseY > y + levelCount * itemHeight) {
      this.hoveredLevelIndex = null
      return
    }
    
    // Calculate which level is hovered
    const index = Math.floor((mouseY - y) / itemHeight)
    if (index >= 0 && index < levelCount) {
      this.hoveredLevelIndex = index
    } else {
      this.hoveredLevelIndex = null
    }
  }

  /**
   * Set admin menu bounds (called during rendering)
   */
  setAdminMenuBounds(bounds: AdminMenuBounds): void {
    this.adminMenuBounds = bounds
  }

  /**
   * Clear admin menu hover state
   */
  clearAdminMenuHover(): void {
    this.hoveredLevelIndex = null
  }

  /**
   * Get level ID from click position in admin menu
   */
  getLevelAtPosition(clickX: number, clickY: number): string | null {
    if (!this.adminMenuBounds) return null
    
    const { x, y, width, itemHeight, levelCount } = this.adminMenuBounds
    
    // Check if click is within menu bounds
    if (clickX < x || clickX > x + width) return null
    if (clickY < y || clickY > y + levelCount * itemHeight) return null
    
    // Calculate which level was clicked
    const index = Math.floor((clickY - y) / itemHeight)
    if (index < 0 || index >= levelCount) return null
    
    const levels = getAllLevels()
    return levels[index]?.id || null
  }

  // ============================================
  // Terminal Methods (Intro Screen)
  // ============================================

  /**
   * Update terminal hover state
   */
  updateTerminalHover(mouseX: number, mouseY: number): void {
    if (!this.terminalBounds) {
      this.isTerminalHovered = false
      return
    }

    const { x, y, width, height } = this.terminalBounds
    this.isTerminalHovered = mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height
  }

  /**
   * Set terminal bounds (called during rendering)
   */
  setTerminalBounds(bounds: Bounds): void {
    this.terminalBounds = bounds
  }

  /**
   * Check if click is on terminal
   */
  isTerminalClicked(clickX: number, clickY: number): boolean {
    if (!this.terminalBounds) return false

    const { x, y, width, height } = this.terminalBounds
    return clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height
  }

  /**
   * Clear terminal state
   */
  clearTerminalState(): void {
    this.isTerminalHovered = false
    this.terminalBounds = null
  }

  // ============================================
  // Roadmap Methods
  // ============================================

  /**
   * Update hover position for roadmap phases
   */
  updateRoadmapHover(mouseX: number, mouseY: number): void {
    if (!this.roadmapPhaseBounds) {
      this.hoveredRoadmapPhase = null
      return
    }

    const { cardX, startY, cardWidth, cardHeight, cardGap, phaseCount } = this.roadmapPhaseBounds

    // Check if mouse is within card bounds horizontally
    if (mouseX < cardX || mouseX > cardX + cardWidth) {
      this.hoveredRoadmapPhase = null
      return
    }

    // Calculate which phase is hovered
    const relativeY = mouseY - startY
    if (relativeY < 0) {
      this.hoveredRoadmapPhase = null
      return
    }

    const totalCardHeight = cardHeight + cardGap
    const index = Math.floor(relativeY / totalCardHeight)
    const withinCard = (relativeY % totalCardHeight) < cardHeight

    if (index >= 0 && index < phaseCount && withinCard) {
      this.hoveredRoadmapPhase = index
    } else {
      this.hoveredRoadmapPhase = null
    }
  }

  /**
   * Set roadmap phase bounds (called during rendering)
   */
  setRoadmapPhaseBounds(bounds: RoadmapPhaseBounds): void {
    this.roadmapPhaseBounds = bounds
  }

  /**
   * Handle click on roadmap - returns true if a phase was clicked
   */
  handleRoadmapClick(clickX: number, clickY: number): boolean {
    // If already viewing a phase detail, check for back button
    if (this.selectedRoadmapPhase !== null) {
      // Back button area (approximate - top left area)
      if (clickX < 150 && clickY < 100) {
        this.selectedRoadmapPhase = null
        return true
      }
      return false
    }

    // Check if clicking on a phase card
    if (!this.roadmapPhaseBounds) return false

    const { cardX, startY, cardWidth, cardHeight, cardGap, phaseCount } = this.roadmapPhaseBounds

    if (clickX < cardX || clickX > cardX + cardWidth) return false

    const relativeY = clickY - startY
    if (relativeY < 0) return false

    const totalCardHeight = cardHeight + cardGap
    const index = Math.floor(relativeY / totalCardHeight)
    const withinCard = (relativeY % totalCardHeight) < cardHeight

    if (index >= 0 && index < phaseCount && withinCard) {
      this.selectedRoadmapPhase = index
      return true
    }

    return false
  }

  /**
   * Clear roadmap selection state
   */
  clearRoadmapSelection(): void {
    this.selectedRoadmapPhase = null
    this.hoveredRoadmapPhase = null
    this.roadmapPhaseBounds = null
  }

  // ============================================
  // Computed Properties
  // ============================================

  /**
   * Check if any interactive element is hovered (for cursor style)
   */
  get isClickable(): boolean {
    return this.isTerminalHovered || 
           this.hoveredRoadmapPhase !== null ||
           this.hoveredLevelIndex !== null
  }
}
