import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Printer, TrendingUp, TrendingDown, DollarSign, CreditCard, Banknote, Landmark } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function DailyClosing() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Query for Orders
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ["finance-orders", date],
        queryFn: async () => {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .neq("status", "cancelled")
                .gte("created_at", startOfDay.toISOString())
                .lte("created_at", endOfDay.toISOString());

            if (error) throw error;
            return data;
        }
    });

    // Query for Expenses
    const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
        queryKey: ["finance-expenses", date],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("expenses")
                .select("*")
                .eq("date", date);

            if (error) throw error;
            return data;
        }
    });

    const calculateStats = () => {
        const stats = {
            revenue: {
                total: 0,
                pix: 0,
                card: 0,
                cash: 0,
                count: orders.length
            },
            expenses: {
                total: 0,
                count: expenses.length,
                byCategory: {} as Record<string, number>
            },
            netProfit: 0
        };

        orders.forEach(order => {
            stats.revenue.total += order.total;
            const notes = (order.notes || "").toLowerCase();
            if (notes.includes("pix")) stats.revenue.pix += order.total;
            else if (notes.includes("cartão") || notes.includes("cartao")) stats.revenue.card += order.total;
            else if (notes.includes("dinheiro")) stats.revenue.cash += order.total;
        });

        expenses.forEach(expense => {
            stats.expenses.total += expense.amount;
            stats.expenses.byCategory[expense.category] = (stats.expenses.byCategory[expense.category] || 0) + expense.amount;
        });

        stats.netProfit = stats.revenue.total - stats.expenses.total;

        return stats;
    };

    const stats = calculateStats();

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-8 print:space-y-4 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Fechamento de Caixa</h2>
                    <p className="text-muted-foreground mt-1">
                        Consolidação diária de entradas e saídas.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-card p-2 rounded-lg border shadow-sm">
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-auto border-0 focus-visible:ring-0 bg-transparent font-medium"
                    />
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="ghost" size="sm" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                </div>
            </div>

            {/* Print Header Only */}
            <div className="hidden print:block text-center mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold uppercase">Fechamento de Caixa</h1>
                <p className="text-xl mt-2">{format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-green-500 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                        <TrendingUp className="w-24 h-24 text-green-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Entradas (Vendas)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-600">
                            {stats.revenue.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            {stats.revenue.count} pedidos realizados
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                        <TrendingDown className="w-24 h-24 text-red-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" /> Saídas (Despesas)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-red-600">
                            {stats.expenses.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            {stats.expenses.count} lançamentos
                        </p>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 shadow-sm relative overflow-hidden ${stats.netProfit >= 0 ? 'border-l-blue-600' : 'border-l-orange-500'}`}>
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                        <Landmark className="w-24 h-24 text-foreground" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Landmark className="w-4 h-4" /> Lucro Líquido
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-4xl font-bold ${stats.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {stats.netProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            Resultado final do dia
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Detalhamento de Receita</CardTitle>
                        <CardDescription>Valores por forma de pagamento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 text-green-700 rounded-full">
                                    <Banknote className="w-5 h-5" />
                                </div>
                                <span className="font-medium">PIX</span>
                            </div>
                            <span className="font-bold text-green-700">
                                {stats.revenue.pix.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-full">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <span className="font-medium">Cartão</span>
                            </div>
                            <span className="font-bold text-blue-700">
                                {stats.revenue.card.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 text-amber-700 rounded-full">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <span className="font-medium">Dinheiro</span>
                            </div>
                            <span className="font-bold text-amber-700">
                                {stats.revenue.cash.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Detalhamento de Despesas</CardTitle>
                        <CardDescription>Valores por categoria</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(stats.expenses.byCategory).map(([category, amount]) => (
                                    <TableRow key={category}>
                                        <TableCell className="font-medium">{category}</TableCell>
                                        <TableCell className="text-right text-red-600 font-bold">
                                            {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {Object.keys(stats.expenses.byCategory).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                            Nenhuma despesa registrada hoje.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Histórico de Vendas</span>
                        <Badge variant="secondary">{stats.revenue.count} pedidos</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Horário</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Pagamento</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                                        Nenhum pedido encontrado nesta data.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order: any) => {
                                    const notes = (order.notes || "").toLowerCase();
                                    let method = "Não Identificado";
                                    let badgeColor = "bg-gray-100 text-gray-800";

                                    if (notes.includes("pix")) { method = "PIX"; badgeColor = "bg-green-100 text-green-800 hover:bg-green-200"; }
                                    else if (notes.includes("cartão") || notes.includes("cartao")) { method = "Cartão"; badgeColor = "bg-blue-100 text-blue-800 hover:bg-blue-200"; }
                                    else if (notes.includes("dinheiro")) { method = "Dinheiro"; badgeColor = "bg-amber-100 text-amber-800 hover:bg-amber-200"; }

                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-muted-foreground">
                                                {format(new Date(order.created_at), 'HH:mm')}
                                            </TableCell>
                                            <TableCell className="font-medium">{order.customer_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${badgeColor} border-0`}>{method}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
