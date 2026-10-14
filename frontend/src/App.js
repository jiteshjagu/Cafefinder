import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CompareProvider } from "@/context/CompareContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BaristaChat from "@/components/BaristaChat";
import CompareBar from "@/components/CompareBar";
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import CafeDetail from "@/pages/CafeDetail";
import Favorites from "@/pages/Favorites";
import AuthPage from "@/pages/AuthPage";
import Admin from "@/pages/Admin";
import Compare from "@/pages/Compare";

function Protected({ children, admin }) {
  const { user } = useAuth();
  if (user === null) return <div className="p-20 text-center text-[#6E5E55]">Brewing...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <div className="App grain">
      <BrowserRouter>
        <AuthProvider>
          <CompareProvider>
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/cafe/:id" element={<CafeDetail />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="/favorites" element={<Protected><Favorites /></Protected>} />
                <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
              </Routes>
            </main>
            <Footer />
            <CompareBar />
            <BaristaChat />
            <Toaster position="top-center" richColors />
          </CompareProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
