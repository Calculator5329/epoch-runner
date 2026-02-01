import { useRef, useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useAssetStore } from '../../stores/RootStore'
import { TileTypeId, getTileType } from '../../core/types/shapes'
import { audioService } from '../../services/AudioService'

/**
 * Tile groups for organized customization
 */
interface TileGroup {
  name: string
  tiles: TileTypeId[]
}

/**
 * Organized tile groups for sprite customization
 */
const TILE_GROUPS: TileGroup[] = [
  {
    name: 'Base Tiles',
    tiles: [
      TileTypeId.SOLID_FULL,
      TileTypeId.PLATFORM_FULL,
      TileTypeId.HAZARD_FULL,
      TileTypeId.HAZARD_SPIKE_UP,
      TileTypeId.COIN,
      TileTypeId.POWERUP_TRIPLE_JUMP,
      TileTypeId.GOAL,
      TileTypeId.CHECKPOINT,
    ],
  },
  {
    name: 'Materials',
    tiles: [
      TileTypeId.SOLID_BRICK,
      TileTypeId.SOLID_STONE,
      TileTypeId.SOLID_METAL,
      TileTypeId.SOLID_WOOD,
      TileTypeId.SOLID_ICE,
      TileTypeId.SOLID_GRASS,
      TileTypeId.SOLID_SAND,
      TileTypeId.SOLID_DIRT,
      TileTypeId.SOLID_CRYSTAL,
      TileTypeId.SOLID_LAVA_ROCK,
    ],
  },
]

/**
 * SFX names that can be customized
 */
const SFX_NAMES = ['jump', 'coin', 'death', 'goal', 'checkpoint'] as const
type SfxName = typeof SFX_NAMES[number]

/**
 * AssetUploadPanel - Panel for uploading custom sprites and audio
 * 
 * Allows users to customize tile sprites, player sprites, background,
 * and sound effects for their level pack.
 */
export const AssetUploadPanel = observer(function AssetUploadPanel() {
  const assetStore = useAssetStore()
  
  // Track which section is expanded
  const [expandedSection, setExpandedSection] = useState<string | null>('tiles')
  
  // File input refs
  const tileInputRefs = useRef<Map<TileTypeId, HTMLInputElement>>(new Map())
  const playerIdleRef = useRef<HTMLInputElement>(null)
  const playerRunRef = useRef<HTMLInputElement>(null)
  const playerRun1Ref = useRef<HTMLInputElement>(null)
  const playerRun2Ref = useRef<HTMLInputElement>(null)
  const playerJumpRef = useRef<HTMLInputElement>(null)
  const backgroundRef = useRef<HTMLInputElement>(null)
  const musicRef = useRef<HTMLInputElement>(null)
  const sfxInputRefs = useRef<Map<SfxName, HTMLInputElement>>(new Map())

  /**
   * Toggle section expansion
   */
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  /**
   * Handle tile sprite upload
   */
  const handleTileSpriteUpload = useCallback(async (
    tileTypeId: TileTypeId,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const image = await loadImageFromFile(file)
      assetStore.addTileSprite(tileTypeId, image)
    } catch (error) {
      console.error('Failed to load tile sprite:', error)
      alert('Failed to load image. Please use PNG or JPG format.')
    }
    
    e.target.value = ''
  }, [assetStore])

  /**
   * Handle player sprite upload
   */
  const handlePlayerSpriteUpload = useCallback(async (
    variant: 'idle' | 'run' | 'run1' | 'run2' | 'jump',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const image = await loadImageFromFile(file)
      const currentSprites = { ...assetStore.playerSprites }
      currentSprites[variant] = image
      assetStore.setPlayerSprites(currentSprites)
    } catch (error) {
      console.error('Failed to load player sprite:', error)
      alert('Failed to load image. Please use PNG or JPG format.')
    }
    
    e.target.value = ''
  }, [assetStore])

  /**
   * Handle background upload
   */
  const handleBackgroundUpload = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const image = await loadImageFromFile(file)
      assetStore.setBackground(image)
    } catch (error) {
      console.error('Failed to load background:', error)
      alert('Failed to load image. Please use PNG or JPG format.')
    }
    
    e.target.value = ''
  }, [assetStore])

  /**
   * Handle music upload
   */
  const handleMusicUpload = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    assetStore.setMusic(url)
    
    // Also load into audio service for preview
    audioService.loadMusic(url)
    
    e.target.value = ''
  }, [assetStore])

  /**
   * Handle SFX upload
   */
  const handleSfxUpload = useCallback(async (
    sfxName: SfxName,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    assetStore.addSfx(sfxName, url)
    
    // Also load into audio service for preview
    audioService.loadSfx(sfxName, url)
    
    e.target.value = ''
  }, [assetStore])

  /**
   * Clear a tile sprite
   */
  const clearTileSprite = useCallback((tileTypeId: TileTypeId) => {
    assetStore.tileSprites.delete(tileTypeId)
  }, [assetStore])

  /**
   * Clear a player sprite variant
   */
  const clearPlayerSprite = useCallback((variant: 'idle' | 'run' | 'run1' | 'run2' | 'jump') => {
    const currentSprites = { ...assetStore.playerSprites }
    delete currentSprites[variant]
    assetStore.setPlayerSprites(currentSprites)
  }, [assetStore])

  /**
   * Clear all assets
   */
  const clearAllAssets = useCallback(() => {
    if (confirm('Clear all custom assets? This cannot be undone.')) {
      assetStore.clear()
      audioService.clear()
    }
  }, [assetStore])

  /**
   * Preview music
   */
  const previewMusic = useCallback(() => {
    if (audioService.isMusicPlaying()) {
      audioService.pauseMusic()
    } else {
      audioService.playMusic()
    }
  }, [])

  /**
   * Preview SFX
   */
  const previewSfx = useCallback((sfxName: SfxName) => {
    audioService.playSfx(sfxName)
  }, [])

  return (
    <div className="asset-upload-panel">
      <div className="asset-panel-header">
        <h2>Custom Assets</h2>
        {assetStore.hasCustomAssets && (
          <button
            className="clear-all-button"
            onClick={clearAllAssets}
            title="Clear all custom assets"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Tile Sprites Section */}
      <div className="asset-section">
        <button
          className="section-header"
          onClick={() => toggleSection('tiles')}
        >
          <span>Tile Sprites</span>
          <span className="section-toggle">{expandedSection === 'tiles' ? '▼' : '▶'}</span>
        </button>
        {expandedSection === 'tiles' && (
          <div className="section-content">
            <p className="section-hint">Upload PNG images (32x32 or 64x64 recommended)</p>
            {TILE_GROUPS.map((group) => (
              <div key={group.name} className="tile-group">
                <h4 className="tile-group-header">{group.name}</h4>
                <div className="asset-grid">
                  {group.tiles.map((tileTypeId) => {
                    const tileType = getTileType(tileTypeId)
                    const hasSprite = assetStore.hasTileSprite(tileTypeId)
                    const sprite = assetStore.getTileSprite(tileTypeId)
                    
                    return (
                      <div key={tileTypeId} className="asset-item">
                        <div
                          className={`asset-preview ${hasSprite ? 'has-asset' : ''}`}
                          style={{
                            backgroundColor: hasSprite ? 'transparent' : tileType.color,
                          }}
                          onClick={() => {
                            const ref = tileInputRefs.current.get(tileTypeId)
                            ref?.click()
                          }}
                        >
                          {sprite && (
                            <img src={sprite.src} alt={tileType.name} className="sprite-preview" />
                          )}
                          {!hasSprite && <span className="upload-icon">+</span>}
                        </div>
                        <span className="asset-label">{tileType.name}</span>
                        {hasSprite && (
                          <button
                            className="asset-clear"
                            onClick={(e) => {
                              e.stopPropagation()
                              clearTileSprite(tileTypeId)
                            }}
                          >
                            ✕
                          </button>
                        )}
                        <input
                          ref={(el) => { if (el) tileInputRefs.current.set(tileTypeId, el) }}
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={(e) => handleTileSpriteUpload(tileTypeId, e)}
                          style={{ display: 'none' }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player Sprites Section */}
      <div className="asset-section">
        <button
          className="section-header"
          onClick={() => toggleSection('player')}
        >
          <span>Player Sprites</span>
          <span className="section-toggle">{expandedSection === 'player' ? '▼' : '▶'}</span>
        </button>
        {expandedSection === 'player' && (
          <div className="section-content">
            <p className="section-hint">Upload PNG images (64x128 recommended for 1x2 tile player)</p>
            <div className="asset-grid player-grid">
              {/* Idle */}
              <div className="asset-item">
                <div
                  className={`asset-preview player-preview ${assetStore.playerSprites.idle ? 'has-asset' : ''}`}
                  onClick={() => playerIdleRef.current?.click()}
                >
                  {assetStore.playerSprites.idle ? (
                    <img src={assetStore.playerSprites.idle.src} alt="Idle" className="sprite-preview" />
                  ) : (
                    <span className="upload-icon">+</span>
                  )}
                </div>
                <span className="asset-label">Idle</span>
                {assetStore.playerSprites.idle && (
                  <button className="asset-clear" onClick={() => clearPlayerSprite('idle')}>✕</button>
                )}
                <input
                  ref={playerIdleRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => handlePlayerSpriteUpload('idle', e)}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Run (legacy single sprite) */}
              <div className="asset-item">
                <div
                  className={`asset-preview player-preview ${assetStore.playerSprites.run ? 'has-asset' : ''}`}
                  onClick={() => playerRunRef.current?.click()}
                >
                  {assetStore.playerSprites.run ? (
                    <img src={assetStore.playerSprites.run.src} alt="Run" className="sprite-preview" />
                  ) : (
                    <span className="upload-icon">+</span>
                  )}
                </div>
                <span className="asset-label">Run</span>
                {assetStore.playerSprites.run && (
                  <button className="asset-clear" onClick={() => clearPlayerSprite('run')}>✕</button>
                )}
                <input
                  ref={playerRunRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => handlePlayerSpriteUpload('run', e)}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Run Frame 1 */}
              <div className="asset-item">
                <div
                  className={`asset-preview player-preview ${assetStore.playerSprites.run1 ? 'has-asset' : ''}`}
                  onClick={() => playerRun1Ref.current?.click()}
                >
                  {assetStore.playerSprites.run1 ? (
                    <img src={assetStore.playerSprites.run1.src} alt="Run 1" className="sprite-preview" />
                  ) : (
                    <span className="upload-icon">+</span>
                  )}
                </div>
                <span className="asset-label">Run 1</span>
                {assetStore.playerSprites.run1 && (
                  <button className="asset-clear" onClick={() => clearPlayerSprite('run1')}>✕</button>
                )}
                <input
                  ref={playerRun1Ref}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => handlePlayerSpriteUpload('run1', e)}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Run Frame 2 */}
              <div className="asset-item">
                <div
                  className={`asset-preview player-preview ${assetStore.playerSprites.run2 ? 'has-asset' : ''}`}
                  onClick={() => playerRun2Ref.current?.click()}
                >
                  {assetStore.playerSprites.run2 ? (
                    <img src={assetStore.playerSprites.run2.src} alt="Run 2" className="sprite-preview" />
                  ) : (
                    <span className="upload-icon">+</span>
                  )}
                </div>
                <span className="asset-label">Run 2</span>
                {assetStore.playerSprites.run2 && (
                  <button className="asset-clear" onClick={() => clearPlayerSprite('run2')}>✕</button>
                )}
                <input
                  ref={playerRun2Ref}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => handlePlayerSpriteUpload('run2', e)}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Jump */}
              <div className="asset-item">
                <div
                  className={`asset-preview player-preview ${assetStore.playerSprites.jump ? 'has-asset' : ''}`}
                  onClick={() => playerJumpRef.current?.click()}
                >
                  {assetStore.playerSprites.jump ? (
                    <img src={assetStore.playerSprites.jump.src} alt="Jump" className="sprite-preview" />
                  ) : (
                    <span className="upload-icon">+</span>
                  )}
                </div>
                <span className="asset-label">Jump</span>
                {assetStore.playerSprites.jump && (
                  <button className="asset-clear" onClick={() => clearPlayerSprite('jump')}>✕</button>
                )}
                <input
                  ref={playerJumpRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => handlePlayerSpriteUpload('jump', e)}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            <p className="section-hint" style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
              Tip: Use "Run 1" and "Run 2" for animated running. They alternate automatically.
              "Run" is a fallback if animation frames aren't provided.
            </p>
          </div>
        )}
      </div>

      {/* Background Section */}
      <div className="asset-section">
        <button
          className="section-header"
          onClick={() => toggleSection('background')}
        >
          <span>Background</span>
          <span className="section-toggle">{expandedSection === 'background' ? '▼' : '▶'}</span>
        </button>
        {expandedSection === 'background' && (
          <div className="section-content">
            <p className="section-hint">Will tile and parallax scroll at 50% camera speed</p>
            <div
              className={`background-preview ${assetStore.background ? 'has-asset' : ''}`}
              onClick={() => backgroundRef.current?.click()}
            >
              {assetStore.background ? (
                <img src={assetStore.background.src} alt="Background" />
              ) : (
                <span className="upload-prompt">Click to upload background image</span>
              )}
            </div>
            {assetStore.background && (
              <button
                className="action-button secondary"
                onClick={() => assetStore.setBackground(undefined as unknown as HTMLImageElement)}
              >
                Remove Background
              </button>
            )}
            <input
              ref={backgroundRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleBackgroundUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>

      {/* Audio Section */}
      <div className="asset-section">
        <button
          className="section-header"
          onClick={() => toggleSection('audio')}
        >
          <span>Audio</span>
          <span className="section-toggle">{expandedSection === 'audio' ? '▼' : '▶'}</span>
        </button>
        {expandedSection === 'audio' && (
          <div className="section-content">
            {/* Music */}
            <div className="audio-item">
              <span className="audio-label">Music</span>
              <div className="audio-controls">
                <button
                  className="audio-upload-btn"
                  onClick={() => musicRef.current?.click()}
                >
                  {assetStore.music ? 'Change' : 'Upload'}
                </button>
                {assetStore.music && (
                  <>
                    <button className="audio-preview-btn" onClick={previewMusic}>
                      {audioService.isMusicPlaying() ? '⏸' : '▶'}
                    </button>
                    <button
                      className="audio-clear-btn"
                      onClick={() => {
                        audioService.stopMusic()
                        assetStore.setMusic(undefined as unknown as string)
                      }}
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
              <input
                ref={musicRef}
                type="file"
                accept="audio/mp3,audio/wav,audio/ogg"
                onChange={handleMusicUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* Sound Effects */}
            <p className="section-hint" style={{ marginTop: '12px' }}>Sound Effects</p>
            {SFX_NAMES.map((sfxName) => {
              const hasSound = assetStore.sfx.has(sfxName)
              
              return (
                <div key={sfxName} className="audio-item">
                  <span className="audio-label">{sfxName}</span>
                  <div className="audio-controls">
                    <button
                      className="audio-upload-btn"
                      onClick={() => sfxInputRefs.current.get(sfxName)?.click()}
                    >
                      {hasSound ? 'Change' : 'Upload'}
                    </button>
                    {hasSound && (
                      <>
                        <button
                          className="audio-preview-btn"
                          onClick={() => previewSfx(sfxName)}
                        >
                          ▶
                        </button>
                        <button
                          className="audio-clear-btn"
                          onClick={() => assetStore.sfx.delete(sfxName)}
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                  <input
                    ref={(el) => { if (el) sfxInputRefs.current.set(sfxName, el) }}
                    type="file"
                    accept="audio/mp3,audio/wav,audio/ogg"
                    onChange={(e) => handleSfxUpload(sfxName, e)}
                    style={{ display: 'none' }}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Asset Count Summary */}
      {assetStore.hasCustomAssets && (
        <div className="asset-summary">
          <span className="summary-label">Loaded:</span>
          <span className="summary-count">
            {assetStore.tileSprites.size} tiles,{' '}
            {Object.keys(assetStore.playerSprites).length} player,{' '}
            {assetStore.background ? '1 bg' : '0 bg'},{' '}
            {assetStore.sfx.size + (assetStore.music ? 1 : 0)} audio
          </span>
        </div>
      )}
    </div>
  )
})

/**
 * Load an image from a File object
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    
    img.onload = () => {
      resolve(img)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}
