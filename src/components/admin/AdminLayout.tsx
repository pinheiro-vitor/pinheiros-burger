import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  MenuSquare,
  ListOrdered,
  Settings,
  BarChart3,
  Tag,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  ChefHat,
  Box,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { AdminHeader } from "./AdminHeader";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Início", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/admin/cardapio", label: "Cardápio", icon: <MenuSquare className="h-5 w-5" /> },
  { href: "/admin/pedidos", label: "Pedidos", icon: <ListOrdered className="h-5 w-5" /> },
  { href: "/admin/cupons", label: "Cupons", icon: <Tag className="h-5 w-5" /> },
  { href: "/admin/kds", label: "Modo Cozinha", icon: <ChefHat className="h-5 w-5" /> },
  { href: "/admin/estoque", label: "Estoque/Desp.", icon: <Box className="h-5 w-5" /> },
  { href: "/admin/financeiro", label: "Financeiro", icon: <DollarSign className="h-5 w-5" /> },
  { href: "/admin/relatorios", label: "Relatórios", icon: <BarChart3 className="h-5 w-5" /> },
  { href: "/admin/configuracoes", label: "Configurações", icon: <Settings className="h-5 w-5" /> },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      navigate("/auth");
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className={cn("font-display text-xl transition-all", collapsed && "text-center")}>
          {collapsed ? "🍔" : "Painel Admin"}
        </h2>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              location.pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent text-foreground"
            )}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full hover:bg-destructive/10 text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header with Store Status */}
      <AdminHeader />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 relative",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <SidebarContent />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute bottom-4 -right-3 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors z-10"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-[57px] left-0 right-0 h-14 bg-card border-b border-border z-40 flex items-center px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <h2 className="font-display text-lg ml-2">Menu</h2>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:p-6 p-4 pt-20 lg:pt-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
