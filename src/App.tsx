import { GameCanvas } from './features/game/GameCanvas'
import { RootStoreProvider, rootStore } from './stores/RootStore'
import './App.css'

function App() {
  return (
    <RootStoreProvider value={rootStore}>
      <div className="app">
        <header className="app-header">
          <h1>Epoch Runner</h1>
          <p className="subtitle">The Chronological Odyssey</p>
        </header>
        <main className="app-main">
          <GameCanvas />
        </main>
      </div>
    </RootStoreProvider>
  )
}

export default App
