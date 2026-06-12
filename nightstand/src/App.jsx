import { Routes, Route } from 'react-router-dom'
import { SettingsProvider } from './context/SettingsContext'
import { LibraryProvider } from './context/LibraryContext'
import { FollowsProvider } from './context/FollowsContext'
import Nav from './components/Nav'
import Library from './pages/Library'
import Import from './pages/Import'
import BookDetail from './pages/BookDetail'
import Matcher from './pages/Matcher'
import Roulette from './pages/Roulette'
import Insights from './pages/Insights'
import Releases from './pages/Releases'

export default function App() {
  return (
    <SettingsProvider>
      <LibraryProvider>
        <FollowsProvider>
          <div className="app">
            <Nav />
            <main className="app-main">
              <Routes>
                <Route path="/" element={<Library />} />
                <Route path="/match" element={<Matcher />} />
                <Route path="/roulette" element={<Roulette />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/releases" element={<Releases />} />
                <Route path="/import" element={<Import />} />
                <Route path="/book/:id" element={<BookDetail />} />
              </Routes>
            </main>
          </div>
        </FollowsProvider>
      </LibraryProvider>
    </SettingsProvider>
  )
}
