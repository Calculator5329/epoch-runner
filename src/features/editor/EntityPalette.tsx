import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useEditorStore, useAssetStore } from '../../stores/RootStore'
import { entityRegistry } from '../../core/registry'
import { getEntityDefinition } from '../../core/types/entities'

/**
 * EntityPalette - Entity selection panel for the editor
 * 
 * Shows available entity types (enemies) for placement in levels.
 */
export const EntityPalette = observer(function EntityPalette() {
  const editorStore = useEditorStore()
  const assetStore = useAssetStore()
  
  // Track registry changes to trigger re-render when entities are registered/unregistered
  const [, setRegistryVersion] = useState(0)
  
  useEffect(() => {
    return entityRegistry.subscribe(() => {
      setRegistryVersion(v => v + 1)
    })
  }, [])
  
  // Get all entity definitions from registry (re-fetched on registry changes)
  const allEntities = entityRegistry.getAll()

  return (
    <div className="entity-palette">
      <div className="palette-section">
        <h3>Entities</h3>
        <div className="entity-grid">
          {allEntities.map((entity) => {
            const isSelected = editorStore.selectedEntityType === entity.id
            const customSprite = assetStore.getEntitySprite(entity.id)
            
            return (
              <button
                key={entity.id}
                className={`entity-button ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  editorStore.setSelectedEntityType(entity.id)
                }}
                title={entity.displayName}
              >
                <div
                  className="entity-preview"
                  style={{
                    backgroundColor: customSprite ? 'transparent' : entity.color,
                    backgroundImage: customSprite ? `url(${customSprite.src})` : 'none',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <span className="entity-name">{entity.displayName}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Entity Info */}
      {editorStore.selectedEntityType && (
        <div className="palette-section">
          <h3>Selected Entity</h3>
          <div className="selected-entity-info">
            {(() => {
              const entity = getEntityDefinition(editorStore.selectedEntityType)
              if (!entity) return null
              const customSprite = assetStore.getEntitySprite(entity.id)
              
              return (
                <>
                  <div
                    className="selected-entity-preview"
                    style={{
                      backgroundColor: customSprite ? 'transparent' : entity.color,
                      backgroundImage: customSprite ? `url(${customSprite.src})` : 'none',
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <div className="selected-entity-details">
                    <span className="entity-detail-name">{entity.displayName}</span>
                    <span className="entity-detail-type">{entity.type}</span>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Entity in Level Info */}
      {editorStore.selectedEntity && (
        <div className="palette-section">
          <h3>Selected Instance</h3>
          <div className="entity-instance-info">
            <div className="entity-instance-row">
              <span>Position:</span>
              <span>({editorStore.selectedEntity.position.col}, {editorStore.selectedEntity.position.row})</span>
            </div>
            <div className="entity-instance-row">
              <span>Direction:</span>
              <span>{editorStore.selectedEntity.properties?.startDirection || 'right'}</span>
            </div>
            <button
              className="action-button danger"
              onClick={() => editorStore.removeSelectedEntity()}
              title="Remove this entity (Delete)"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="palette-section">
        <h3>Entity Tool</h3>
        <div className="entity-instructions">
          <p>Click to place selected entity</p>
          <p>Click entity to select it</p>
          <p>Press Delete to remove</p>
        </div>
      </div>
    </div>
  )
})
