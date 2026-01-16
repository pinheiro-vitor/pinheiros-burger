import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfMonth, endOfMonth, subMonths, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChartData {
  day: string;
  currentMonth: number;
  previousMonth: number;
}

export function SalesChart() {
  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ["sales-chart"],
    queryFn: async () => {
      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());
      const previousMonthStart = startOfMonth(subMonths(new Date(), 1));
      const previousMonthEnd = endOfMonth(subMonths(new Date(), 1));

      // Get current month orders
      const { data: currentOrders, error: currentError } = await supabase
        .from("orders")
        .select("total, created_at")
        .gte("created_at", currentMonthStart.toISOString())
        .lte("created_at", currentMonthEnd.toISOString())
        .neq("status", "cancelled");

      if (currentError) throw currentError;

      // Get previous month orders
      const { data: previousOrders, error: previousError } = await supabase
        .from("orders")
        .select("total, created_at")
        .gte("created_at", previousMonthStart.toISOString())
        .lte("created_at", previousMonthEnd.toISOString())
        .neq("status", "cancelled");

      if (previousError) throw previousError;

      // Group by day and calculate cumulative
      const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
      
      let currentCumulative = 0;
      let previousCumulative = 0;

      const data: ChartData[] = daysInMonth.map((date) => {
        const dayNum = date.getDate();
        
        // Current month
        const currentDayOrders = currentOrders?.filter((o) => {
          const orderDate = new Date(o.created_at);
          return orderDate.getDate() === dayNum;
        }) || [];
        currentCumulative += currentDayOrders.reduce((sum, o) => sum + Number(o.total), 0);

        // Previous month (same day number)
        const previousDayOrders = previousOrders?.filter((o) => {
          const orderDate = new Date(o.created_at);
          return orderDate.getDate() === dayNum;
        }) || [];
        previousCumulative += previousDayOrders.reduce((sum, o) => sum + Number(o.total), 0);

        return {
          day: dayNum.toString().padStart(2, "0"),
          currentMonth: currentCumulative,
          previousMonth: previousCumulative,
        };
      });

      return data;
    },
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Faturamento acumulado</CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Mês Anterior</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Mês Atual</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="day"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Dia ${label}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="previousMonth"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="Mês Anterior"
              />
              <Line
                type="monotone"
                dataKey="currentMonth"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Mês Atual"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
