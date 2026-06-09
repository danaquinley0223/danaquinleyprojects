import { Routes, Route } from 'react-router-dom'
import { PantryProvider } from './context/PantryContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { CustomRecipesProvider } from './context/CustomRecipesContext'
import Nav from './components/Nav'
import Home from './pages/Home'
import RecipeDetail from './pages/RecipeDetail'
import Pantry from './pages/Pantry'
import Favorites from './pages/Favorites'
import AddRecipe from './pages/AddRecipe'

export default function App() {
  return (
    <PantryProvider>
      <FavoritesProvider>
        <CustomRecipesProvider>
          <div className="app">
            <Nav />
            <main className="app-main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/recipe/:id" element={<RecipeDetail />} />
                <Route path="/pantry" element={<Pantry />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/add-recipe" element={<AddRecipe />} />
              </Routes>
            </main>
          </div>
        </CustomRecipesProvider>
      </FavoritesProvider>
    </PantryProvider>
  )
}
