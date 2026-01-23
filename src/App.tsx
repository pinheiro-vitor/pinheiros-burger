import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import Auth from "./pages/Auth";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMenu from "./pages/admin/Menu";
import AdminOrders from "./pages/admin/Orders";
import AdminCoupons from "./pages/admin/Coupons";

import AdminSettings from "./pages/admin/Settings";
import KitchenDisplay from "./pages/admin/KitchenDisplay";
import AdminStock from "./pages/admin/Stock";
import AdminFinance from "./pages/admin/Finance";

// Customer App Pages
import CustomerOrders from "./pages/app/Orders";
import CustomerProfile from "./pages/app/Profile";

import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/cardapio" element={<Index />} />
          <Route path="/produto/:productId" element={<ProductDetail />} />
          <Route path="/auth" element={<Auth />} />

          {/* Customer Routes */}
          <Route path="/app/pedidos" element={<ProtectedRoute><CustomerOrders /></ProtectedRoute>} />
          <Route path="/app/perfil" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/cardapio" element={<ProtectedRoute requireAdmin><AdminMenu /></ProtectedRoute>} />
          <Route path="/admin/pedidos" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/cupons" element={<ProtectedRoute requireAdmin><AdminCoupons /></ProtectedRoute>} />

          <Route path="/admin/configuracoes" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/kds" element={<ProtectedRoute requireAdmin><KitchenDisplay /></ProtectedRoute>} />
          <Route path="/admin/estoque" element={<ProtectedRoute requireAdmin><AdminStock /></ProtectedRoute>} />
          <Route path="/admin/financeiro" element={<ProtectedRoute requireAdmin><AdminFinance /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
