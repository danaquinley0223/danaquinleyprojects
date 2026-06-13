import { Routes, Route } from 'react-router-dom'
import { CampDataProvider } from './context/CampDataContext'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Crews from './pages/Crews'
import Library from './pages/Library'
import Campsites from './pages/Campsites'
import TripLayout from './pages/TripLayout'
import TripSetup from './pages/TripSetup'
import Meals from './pages/Meals'
import Shopping from './pages/Shopping'
import Packing from './pages/Packing'

export default function App() {
  return (
    <CampDataProvider>
      <div className="app">
        <Nav />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crews" element={<Crews />} />
            <Route path="/library" element={<Library />} />
            <Route path="/campsites" element={<Campsites />} />
            <Route path="/trip/:id" element={<TripLayout />}>
              <Route index element={<TripSetup />} />
              <Route path="meals" element={<Meals />} />
              <Route path="shopping" element={<Shopping />} />
              <Route path="packing" element={<Packing />} />
            </Route>
          </Routes>
        </main>
      </div>
    </CampDataProvider>
  )
}
