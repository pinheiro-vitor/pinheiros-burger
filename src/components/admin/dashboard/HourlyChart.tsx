import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subDays, startOfDay, format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface HourlyData {
  hour: string;
  value: number;
}

export function HourlyChart() {
  const [period, setPeriod] = useState<"yesterday" | "today" | "15days" | "month">("today");

  const { data: hourlyData = [], isLoading } = useQuery({
    queryKey: ["hourly-sales", period],
    queryFn: async () => {
      let startDate: Date;
      let endDate = new Date();

      switch (period) {
        case "yesterday":
          startDate = startOfDay(subDays(new Date(), 1));
          endDate = startOfDay(new Date());
          break;
        case "today":
          startDate = startOfDay(new Date());
          break;
        case "15days":
          startDate = startOfDay(subDays(new Date(), 15));
          break;
        case "month":
          startDate = startOfDay(subDays(new Date(), 30));
          break;
        default:
          startDate = startOfDay(new Date());
      }

      const { data: orders, error } = await supabase
        .from("orders")
        .select("total, created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .neq("status", "cancelled");

      if (error) throw error;

      // Group by hour
      const hourMap = new Map<number, number>();
      for (let i = 0; i < 24; i++) {
        hourMap.set(i, 0);
      }

      orders?.forEach((order) => {
        const hour = new Date(order.created_at).getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + Number(order.total));
      });

      const data: HourlyData[] = Array.from(hourMap.entries()).map(([hour, value]) => ({
        hour: `${hour.toString().padStart(2, "0")}h`,
        value,
      }));

      return data;
    },
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="text-base">Visão Geral</CardTitle>
        <div className="flex gap-1 flex-wrap">
          {[
            { key: "yesterday", label: "Ontem" },
            { key: "today", label: "Hoje" },
            { key: "15days", label: "15 dias" },
            { key: "month", label: "Este mês" },
          ].map((p) => (
            <Button
              key={p.key}
              variant={period === p.key ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.key as typeof period)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="hour"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                interval={1}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorValue)"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <Button variant="outline" size="sm">
            Hora
          </Button>
          <Link
            to="/admin/relatorios"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Ver relatórios
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
