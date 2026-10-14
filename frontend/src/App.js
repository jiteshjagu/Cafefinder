import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import CafeDetail from "@/pages/CafeDetail";
import Favorites from "@/pages/Favorites";
import AuthPage from "@/pages/AuthPage";
import Admin from "@/pages/Admin";
import ReviewsDashboard from "@/pages/ReviewsDashboard";
import ScanQR from "@/pages/ScanQR";

function Protected({ children, admin }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (user === null) return <div className="p-20 text-center text-[#6E5E55]">Brewing...</div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <div className="App bg-white">
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/cafe/:id" element={<CafeDetail />} />
              <Route path="/reviews" element={<ReviewsDashboard />} />
              <Route path="/scan" element={<ScanQR />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route path="/favorites" element={<Protected><Favorites /></Protected>} />
              <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
