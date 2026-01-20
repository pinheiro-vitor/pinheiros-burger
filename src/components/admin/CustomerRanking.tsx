import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type CustomerStats = {
    phone: string;
    name: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
};

type SortConfig = {
    key: keyof CustomerStats;
    direction: "asc" | "desc";
};

export function CustomerRanking() {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: "totalSpent",
        direction: "desc",
    });

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["all-orders-ranking"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("orders")
                .select("customer_name, customer_phone, total, created_at, status")
                .neq("status", "cancelled");

            if (error) throw error;
            return data;
        },
    });

    const customers = useMemo(() => {
        const stats: Record<string, CustomerStats> = {};

        orders.forEach((order) => {
            const phone = order.customer_phone;
            if (!phone) return;

            if (!stats[phone]) {
                stats[phone] = {
                    phone,
                    name: order.customer_name,
                    totalOrders: 0,
                    totalSpent: 0,
                    lastOrderDate: order.created_at,
                };
            }

            stats[phone].totalOrders += 1;
            stats[phone].totalSpent += Number(order.total);

            // Update name if it changed (take the latest one basically, or just keep one)
            // Update last order date
            if (new Date(order.created_at) > new Date(stats[phone].lastOrderDate)) {
                stats[phone].lastOrderDate = order.created_at;
                stats[phone].name = order.customer_name; // Update name to most recent used
            }
        });

        return Object.values(stats);
    }, [orders]);

    const filteredAndSortedCustomers = useMemo(() => {
        let result = [...customers];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(
                (c) =>
                    c.name.toLowerCase().includes(lowerSearch) ||
                    c.phone.includes(searchTerm)
            );
        }

        result.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    }, [customers, searchTerm, sortConfig]);

    const handleSort = (key: keyof CustomerStats) => {
        setSortConfig((current) => ({
            key,
            direction:
                current.key === key && current.direction === "desc" ? "asc" : "desc",
        }));
    };

    const SortIcon = ({ column }: { column: keyof CustomerStats }) => {
        if (sortConfig.key !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />;
        return sortConfig.direction === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4 text-primary" />
        ) : (
            <ArrowDown className="ml-2 h-4 w-4 text-primary" />
        );
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    };

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <User className="h-6 w-6 text-primary" />
                        Ranking de Clientes
                    </CardTitle>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou telefone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("name")}
                                        className="flex items-center font-bold hover:text-primary pl-0"
                                    >
                                        Cliente
                                        <SortIcon column="name" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("totalOrders")}
                                        className="flex items-center font-bold hover:text-primary px-0"
                                    >
                                        Pedidos
                                        <SortIcon column="totalOrders" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("totalSpent")}
                                        className="flex items-center font-bold hover:text-primary px-0"
                                    >
                                        Total Gasto
                                        <SortIcon column="totalSpent" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("lastOrderDate")}
                                        className="flex items-center font-bold hover:text-primary px-0"
                                    >
                                        Último Pedido
                                        <SortIcon column="lastOrderDate" />
                                    </Button>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredAndSortedCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Nenhum cliente encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAndSortedCustomers.slice(0, 50).map((customer) => (
                                    <TableRow key={customer.phone}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{customer.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {customer.phone}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {customer.totalOrders}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold text-green-600">
                                                {formatCurrency(customer.totalSpent)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                {format(new Date(customer.lastOrderDate), "dd MMM yyyy", {
                                                    locale: ptBR,
                                                })}
                                                <br />
                                                {format(new Date(customer.lastOrderDate), "HH:mm")}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-4 text-xs text-muted-foreground text-center">
                    Mostrando os top 50 resultados de {filteredAndSortedCustomers.length} clientes encontrados.
                </div>
            </CardContent>
        </Card>
    );
}
