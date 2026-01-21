import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";

export default function AdminFinance() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["finance-orders", date],
        queryFn: async () => {
            // Fetch orders for the selected date (ignoring cancelled)
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

    const calculateTotals = () => {
        const summary = {
            total: 0,
            pix: 0,
            card: 0,
            cash: 0,
            count: orders.length
        };

        orders.forEach(order => {
            summary.total += order.total;
            // Parse payment method from notes (Simplistic but effective per current pattern)
            // Current pattern in Cart.tsx: "... - Pagamento: PIX ..."
            const notes = (order.notes || "").toLowerCase();
            if (notes.includes("pix")) {
                summary.pix += order.total;
            } else if (notes.includes("cartão") || notes.includes("cartao")) {
                summary.card += order.total;
            } else if (notes.includes("dinheiro")) {
                summary.cash += order.total;
            } else {
                // Default fallback if parsing fails, assign to 'Other' or just dont add to split
                // For now, let's assume valid data or just leave out of split
            }
        });

        return summary;
    };

    const stats = calculateTotals();

    const handlePrint = () => {
        window.print();
    };

    return (
        <AdminLayout>
            <div className="space-y-6 print:space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <h1 className="font-display text-3xl">Fechamento de Caixa</h1>
                    <div className="flex items-center gap-4">
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-40"
                        />
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" /> Imprimir
                        </Button>
                    </div>
                </div>

                {/* Print Header Only */}
                <div className="hidden print:block text-center mb-8">
                    <h1 className="text-2xl font-bold">FECHAMENTO DE CAIXA</h1>
                    <p>Data: {format(new Date(date), 'dd/MM/yyyy')}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {stats.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">PIX</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-teal-600">
                                {stats.pix.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Cartão</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.card.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Dinheiro</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">
                                {stats.cash.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pedidos do Dia ({stats.count})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Hora</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Pagamento (Identificado)</TableHead>
                                    <TableHead>Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                            Nenhum pedido encontrado nesta data.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order: any) => {
                                        const notes = (order.notes || "").toLowerCase();
                                        let method = "Outro";
                                        if (notes.includes("pix")) method = "PIX";
                                        else if (notes.includes("cartão") || notes.includes("cartao")) method = "Cartão";
                                        else if (notes.includes("dinheiro")) method = "Dinheiro";

                                        return (
                                            <TableRow key={order.id}>
                                                <TableCell>{format(new Date(order.created_at), 'HH:mm')}</TableCell>
                                                <TableCell>{order.customer_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{method}</Badge>
                                                </TableCell>
                                                <TableCell>{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
