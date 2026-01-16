import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, ShoppingBag, TrendingUp, Clock } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HourlyChart } from "@/components/admin/dashboard/HourlyChart";
import { SalesChannelsChart } from "@/components/admin/dashboard/SalesChannelsChart";
import { SalesChart } from "@/components/admin/dashboard/SalesChart";
import { TopProductsTable } from "@/components/admin/dashboard/TopProductsTable";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  averageTicket: number;
  pendingOrders: number;
  previousRevenue: number;
  previousOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageTicket: 0,
    pendingOrders: 0,
    previousRevenue: 0,
    previousOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = subDays(today, 1);

        // Today's orders
        const { data: todayOrders, error: todayError } = await supabase
          .from("orders")
          .select("total, status")
          .gte("created_at", today.toISOString());

        if (todayError) throw todayError;

        // Yesterday's orders for comparison
        const { data: yesterdayOrders, error: yesterdayError } = await supabase
          .from("orders")
          .select("total, status")
          .gte("created_at", yesterday.toISOString())
          .lt("created_at", today.toISOString());

        if (yesterdayError) throw yesterdayError;

        const totalOrders = todayOrders?.length || 0;
        const totalRevenue = todayOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
        const pendingOrders = todayOrders?.filter((o) => o.status === "pending").length || 0;
        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const previousOrders = yesterdayOrders?.length || 0;
        const previousRevenue = yesterdayOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

        setStats({
          totalOrders,
          totalRevenue,
          averageTicket,
          pendingOrders,
          previousRevenue,
          previousOrders,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return "--";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(0)}%`;
  };

  const currentDate = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm text-muted-foreground">{currentDate}</p>
          <h1 className="font-display text-3xl">Boas vindas!</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {calculateChange(stats.totalRevenue, stats.previousRevenue)} vs dia anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats.totalOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                {calculateChange(stats.totalOrders, stats.previousOrders)} vs dia anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : formatCurrency(stats.averageTicket)}
              </div>
              <p className="text-xs text-muted-foreground">
                -- vs dia anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats.pendingOrders}
              </div>
              <p className="text-xs text-muted-foreground">Aguardando</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <HourlyChart />
          <SalesChannelsChart />
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SalesChart />
          <TopProductsTable />
        </div>
      </div>
    </AdminLayout>
  );
}
