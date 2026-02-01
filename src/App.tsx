import { observer } from 'mobx-react-lite'
import { GameCanvas } from './features/game/GameCanvas'
import { RootStoreProvider, rootStore } from './stores/RootStore'
import './App.css'

const AppContent = observer(function AppContent() {
  const showHeader = false
  return (
    <div className="app">
      {showHeader && (
        <header className="app-header">
          <h1>Epoch Runner</h1>
          <p className="subtitle">The Chronological Odyssey</p>
        </header>
      )}
      <main className="app-main">
        <GameCanvas />
      </main>
    </div>
  )
})

function App() {
  return (
    <RootStoreProvider value={rootStore}>
      <AppContent />
    </RootStoreProvider>
  )
}

export default App
