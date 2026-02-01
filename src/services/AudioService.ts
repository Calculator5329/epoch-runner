/**
 * AudioService - Handles background music and sound effects
 * 
 * Features:
 * - Background music with looping
 * - Sound effect pool for concurrent playback
 * - Volume control for music and SFX separately
 * - Master mute toggle
 * 
 * Usage:
 * - Load audio from blob URLs (from AssetStore)
 * - Call playSfx() from game events (jump, coin, death, goal)
 * - Music auto-loops when playing
 */
class AudioService {
  // Music
  private musicElement: HTMLAudioElement | null = null
  private musicVolume = 0.5
  private musicUrl: string | null = null

  // Sound effects - pool multiple elements per sound for overlapping playback
  private sfxPool: Map<string, HTMLAudioElement[]> = new Map()
  private sfxVolume = 0.7
  private sfxPoolSize = 3 // Number of audio elements per SFX for concurrent plays

  // Global state
  private isMuted = false
  private isInitialized = false

  /**
   * Initialize the audio service
   * Call this after user interaction to enable audio (browser autoplay policy)
   */
  init(): void {
    if (this.isInitialized) return
    this.isInitialized = true
  }

  // ============================================
  // Music Methods
  // ============================================

  /**
   * Load background music from a blob URL
   */
  loadMusic(url: string): void {
    // Clean up previous music
    if (this.musicElement) {
      this.musicElement.pause()
      this.musicElement.src = ''
      this.musicElement = null
    }

    this.musicUrl = url
    this.musicElement = new Audio(url)
    this.musicElement.loop = true
    this.musicElement.volume = this.isMuted ? 0 : this.musicVolume
  }

  /**
   * Play background music (loops automatically)
   */
  playMusic(): void {
    if (!this.musicElement) return

    this.musicElement.play().catch((e) => {
      // Autoplay may be blocked until user interaction
      console.warn('Music autoplay blocked:', e.message)
    })
  }

  /**
   * Pause background music
   */
  pauseMusic(): void {
    if (!this.musicElement) return
    this.musicElement.pause()
  }

  /**
   * Stop music and reset to beginning
   */
  stopMusic(): void {
    if (!this.musicElement) return
    this.musicElement.pause()
    this.musicElement.currentTime = 0
  }

  /**
   * Check if music is currently playing
   */
  isMusicPlaying(): boolean {
    return this.musicElement ? !this.musicElement.paused : false
  }

  /**
   * Set music volume (0-1)
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.musicElement && !this.isMuted) {
      this.musicElement.volume = this.musicVolume
    }
  }

  /**
   * Get current music volume
   */
  getMusicVolume(): number {
    return this.musicVolume
  }

  // ============================================
  // Sound Effect Methods
  // ============================================

  /**
   * Load a sound effect from a blob URL
   * Creates a pool of audio elements for concurrent playback
   */
  loadSfx(name: string, url: string): void {
    // Clean up existing pool for this sound
    const existing = this.sfxPool.get(name)
    if (existing) {
      existing.forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
    }

    // Create pool of audio elements
    const pool: HTMLAudioElement[] = []
    for (let i = 0; i < this.sfxPoolSize; i++) {
      const audio = new Audio(url)
      audio.volume = this.isMuted ? 0 : this.sfxVolume
      pool.push(audio)
    }

    this.sfxPool.set(name, pool)
  }

  /**
   * Play a sound effect by name
   * Uses round-robin through the pool for overlapping sounds
   */
  playSfx(name: string): void {
    const pool = this.sfxPool.get(name)
    if (!pool || pool.length === 0) return

    // Find an audio element that's not playing, or use the first one
    let audio = pool.find((a) => a.paused || a.ended)
    if (!audio) {
      // All are playing - restart the first one
      audio = pool[0]
    }

    audio.currentTime = 0
    audio.play().catch((e) => {
      // Autoplay may be blocked until user interaction
      console.warn(`SFX "${name}" autoplay blocked:`, e.message)
    })
  }

  /**
   * Set SFX volume (0-1)
   */
  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    
    if (!this.isMuted) {
      // Update all pooled audio elements
      for (const pool of this.sfxPool.values()) {
        for (const audio of pool) {
          audio.volume = this.sfxVolume
        }
      }
    }
  }

  /**
   * Get current SFX volume
   */
  getSfxVolume(): number {
    return this.sfxVolume
  }

  /**
   * Check if a sound effect is loaded
   */
  hasSfx(name: string): boolean {
    return this.sfxPool.has(name)
  }

  // ============================================
  // Global Control Methods
  // ============================================

  /**
   * Mute all audio
   */
  mute(): void {
    this.isMuted = true

    if (this.musicElement) {
      this.musicElement.volume = 0
    }

    for (const pool of this.sfxPool.values()) {
      for (const audio of pool) {
        audio.volume = 0
      }
    }
  }

  /**
   * Unmute all audio
   */
  unmute(): void {
    this.isMuted = false

    if (this.musicElement) {
      this.musicElement.volume = this.musicVolume
    }

    for (const pool of this.sfxPool.values()) {
      for (const audio of pool) {
        audio.volume = this.sfxVolume
      }
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute(): void {
    if (this.isMuted) {
      this.unmute()
    } else {
      this.mute()
    }
  }

  /**
   * Check if audio is muted
   */
  getIsMuted(): boolean {
    return this.isMuted
  }

  /**
   * Set master volume (affects both music and SFX)
   */
  setMasterVolume(volume: number): void {
    this.setMusicVolume(volume)
    this.setSfxVolume(volume)
  }

  // ============================================
  // Cleanup Methods
  // ============================================

  /**
   * Clear all loaded audio
   */
  clear(): void {
    // Stop and clear music
    if (this.musicElement) {
      this.musicElement.pause()
      this.musicElement.src = ''
      this.musicElement = null
    }
    this.musicUrl = null

    // Clear all SFX pools
    for (const pool of this.sfxPool.values()) {
      for (const audio of pool) {
        audio.pause()
        audio.src = ''
      }
    }
    this.sfxPool.clear()
  }

  /**
   * Load audio from AssetStore
   */
  loadFromAssetStore(music?: string, sfx?: Map<string, string>): void {
    // Load music if provided
    if (music) {
      this.loadMusic(music)
    }

    // Load sound effects if provided
    if (sfx) {
      for (const [name, url] of sfx) {
        this.loadSfx(name, url)
      }
    }
  }
}

// Export singleton
export const audioService = new AudioService()
