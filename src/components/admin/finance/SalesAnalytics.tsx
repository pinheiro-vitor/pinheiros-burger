import { useState, useMemo } from "react";
import { CustomerRanking } from "@/components/admin/CustomerRanking";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

type Period = "today" | "week" | "month" | "custom";

interface AnalyticsItem {
    name: string;
    quantity: number;
    price: number;
}

export function SalesAnalytics() {
    const [period, setPeriod] = useState<Period>("week");

    const dateRange = useMemo(() => {
        const end = endOfDay(new Date());
        let start: Date;

        switch (period) {
            case "today":
                start = startOfDay(new Date());
                break;
            case "week":
                start = startOfDay(subDays(new Date(), 7));
                break;
            case "month":
                start = startOfDay(subDays(new Date(), 30));
                break;
            default:
                start = startOfDay(subDays(new Date(), 7));
        }

        return { start, end };
    }, [period]);

    const { data: orders = [] } = useQuery({
        queryKey: ["report-orders", dateRange],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .gte("created_at", dateRange.start.toISOString())
                .lte("created_at", dateRange.end.toISOString())
                .neq("status", "cancelled");

            if (error) throw error;
            return data;
        },
    });

    const stats = useMemo(() => {
        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
        const totalOrders = orders.length;
        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Group by day
        const dailyData: Record<string, { date: string; revenue: number; orders: number }> = {};
        orders.forEach((order) => {
            const date = format(new Date(order.created_at), "dd/MM");
            if (!dailyData[date]) {
                dailyData[date] = { date, revenue: 0, orders: 0 };
            }
            dailyData[date].revenue += Number(order.total);
            dailyData[date].orders += 1;
        });

        const chartData = Object.values(dailyData).sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        // Popular products
        const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
        orders.forEach((order) => {
            const items = (Array.isArray(order.items) ? order.items : []) as unknown as AnalyticsItem[];
            items.forEach((item) => {
                if (!productCounts[item.name]) {
                    productCounts[item.name] = { name: item.name, count: 0, revenue: 0 };
                }
                productCounts[item.name].count += item.quantity || 1;
                productCounts[item.name].revenue += (item.price || 0) * (item.quantity || 1);
            });
        });

        const topProducts = Object.values(productCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalRevenue,
            totalOrders,
            averageTicket,
            chartData,
            topProducts,
        };
    }, [orders]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Análise de Vendas</h2>
                <div className="flex gap-2">
                    <Button
                        variant={period === "today" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPeriod("today")}
                    >
                        Hoje
                    </Button>
                    <Button
                        variant={period === "week" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPeriod("week")}
                    >
                        7 dias
                    </Button>
                    <Button
                        variant={period === "month" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPeriod("month")}
                    >
                        30 dias
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.averageTicket)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Faturamento por Dia</CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.chartData.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            Nenhum dado no período selecionado
                        </p>
                    ) : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis
                                        tickFormatter={(value) =>
                                            `R$${(value / 1).toFixed(0)}`
                                        }
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
                <CardHeader>
                    <CardTitle>Produtos Mais Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.topProducts.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            Nenhum dado no período selecionado
                        </p>
                    ) : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.topProducts} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={150}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip
                                        formatter={(value: number, name: string) => [
                                            name === "count" ? value : formatCurrency(value),
                                            name === "count" ? "Quantidade" : "Receita",
                                        ]}
                                    />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Customer Ranking */}
            <CustomerRanking />
        </div>
    );
}
