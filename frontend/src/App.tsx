// App.tsx
import { AuthProvider } from "./context/AuthContext";
import { ShopifyCartProvider } from "./context/ShopifyCartContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Makhanas from "./pages/Makhanas";
import HeaderComponent from "./components/HeaderComponent";
import ShopifyCartSidebar from "./components/ShopifyCartSideBar";
import AnnouncementBar from "./components/AnnouncementBar";
import Millets from "./pages/Millets";
import InstantMeals from "./pages/InstantMeals";
import TrailMix from "./pages/TrailMix";
import Nuts from "./pages/Nuts";
import Combo from "./pages/Combo";
import GutHealth from "./pages/GutHealth";
import GlutenFree from "./pages/GlutenFree";
import HighProtein from "./pages/HighProtein";
import HighFibre from "./pages/HighFibre";
import ProtectedRoute from "./components/ProtectedRoute";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import Footer from "./components/FooterComponent";
import AllProduct from "./pages/AllProduct";
import ProductDetail from "./pages/ProductDetail";
import BundlePage from "./pages/BundlePage";
import Home from "./pages/Home";
import Account from "./pages/Account";
import ShopifyProductsPage from "./pages/ShopifyProductsPage";
import ShopifyTest from "./components/ShopifyTest";

const App = () => {
  return (
    <AuthProvider>
      <ShopifyCartProvider>
        <Router>
          <AnnouncementBar message="Flat 25% OFF on Orders above 999" />
          <div style={{ marginLeft: "200.4px", marginRight: "200.4px" }}>
            <HeaderComponent />
          </div>
          <ShopifyCartSidebar />
          <ShopifyTest />
          <main>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />

              {/* Shopify-powered product routes */}
              <Route path="/shop" element={<ShopifyProductsPage />} />
              <Route path="/collections/makhanas" element={<Makhanas />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/collections/millet-puffs" element={<Millets />} />
              <Route
                path="/collections/instant-meals"
                element={<InstantMeals />}
              />
              <Route path="/collections/trail-mix" element={<TrailMix />} />
              <Route path="/collections/nutritious-nuts" element={<Nuts />} />
              <Route
                path="/collections/makhana-combo-packs"
                element={<Combo />}
              />
              <Route path="/collections/probiotics" element={<GutHealth />} />
              <Route path="/collections/gluten-free" element={<GlutenFree />} />
              <Route
                path="/collections/high-protein"
                element={<HighProtein />}
              />
              <Route path="/collections/high-fibre" element={<HighFibre />} />
              <Route path="/collections/all" element={<AllProduct />} />
              <Route path="/collections/bundle" element={<BundlePage />} />

              {/* Protected routes that require authentication */}
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route path="/order-success" element={<OrderSuccessPage />} />
            </Routes>
          </main>
          <Footer />
        </Router>
      </ShopifyCartProvider>
    </AuthProvider>
  );
};

export default App;
