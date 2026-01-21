import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "sonner";

interface Transaction {
    id: string;
    type: string;
    quantity: number;
    cost: number;
    notes: string;
    created_at: string;
    item: { name: string; unit: string };
}

interface InventoryItem {
    id: string;
    name: string;
    unit: string;
}

export function InventoryTransactions() {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        item_id: "",
        type: "purchase",
        quantity: "",
        cost: "0",
        notes: "",
    });

    const { data: items = [] } = useQuery({
        queryKey: ["inventory-items-select"],
        queryFn: async () => {
            const { data } = await supabase.from("inventory_items").select("id, name, unit").order("name");
            return data as InventoryItem[];
        },
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ["inventory-transactions"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("inventory_transactions")
                .select(`*, item:inventory_items(name, unit)`)
                .order("created_at", { ascending: false })
                .limit(20);
            if (error) throw error;
            return data as Transaction[];
        },
    });

    const transactionMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            if (!data.item_id) throw new Error("Selecione um item");

            const qty = parseFloat(data.quantity);
            const cost = parseFloat(data.cost);

            // 1. Create Transaction List
            const { error: transError } = await supabase.from("inventory_transactions").insert({
                item_id: data.item_id,
                type: data.type,
                quantity: qty, // Store raw quantity entered
                cost: cost,
                notes: data.notes
            });

            if (transError) throw transError;

            // 2. Update Inventory Item (RPC or simple query if reliable concurrency isn't critical for this scale)
            // For simplicity/robustness, we fetch current, then update. 
            // Ideally a supabase RPC 'adjust_stock' is better but keeping it simple JS based for now.

            const { data: currentItem } = await supabase.from("inventory_items").select("quantity").eq("id", data.item_id).single();

            let newQty = (currentItem?.quantity || 0);
            if (data.type === 'purchase') {
                newQty += qty;
                // Update last cost only on purchase
                if (qty > 0) {
                    const unitCost = cost / qty;
                    await supabase.from("inventory_items").update({ last_cost: unitCost }).eq("id", data.item_id);
                }
            } else if (data.type === 'usage' || data.type === 'loss') {
                newQty -= qty;
            } else if (data.type === 'adjustment') {
                // If adjustment, we assume the entered quantity IS the new diff or absolute? 
                // Let's assume adjustment implies adding/removing a correction.
                // Or let's imply "Adjustment" adds the value (so user can put negative).
                newQty += qty;
            }

            const { error: updateError } = await supabase
                .from("inventory_items")
                .update({ quantity: newQty })
                .eq("id", data.item_id);

            if (updateError) throw updateError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
            toast.success("Movimentação registrada!");
            setFormData({ item_id: "", type: "purchase", quantity: "", cost: "0", notes: "" });
        },
        onError: (e) => toast.error("Erro: " + e.message)
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transactionMutation.mutate(formData);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 h-fit">
                <CardHeader>
                    <CardTitle>Registrar Movimentação</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Item</Label>
                            <Select value={formData.item_id} onValueChange={(val) => setFormData({ ...formData, item_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {items.map(item => (
                                        <SelectItem key={item.id} value={item.id}>{item.name} ({item.unit})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="purchase">Entrada / Compra</SelectItem>
                                    <SelectItem value="usage">Saída / Uso</SelectItem>
                                    <SelectItem value="loss">Perda / Desperdício</SelectItem>
                                    <SelectItem value="adjustment">Ajuste Manual (+/-)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Quantidade</Label>
                            <Input
                                type="number"
                                step="0.001"
                                required
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Custo Total (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                disabled={formData.type === 'usage' || formData.type === 'loss'} // Usually 0 for internal usage unless tracking cost of loss
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Observação</Label>
                            <Input
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={transactionMutation.isPending}>
                            {transactionMutation.isPending ? "Processando..." : "Confirmar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Histórico Recente</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Qtd</TableHead>
                                <TableHead>Custo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>{format(new Date(t.created_at), "dd/MM HH:mm")}</TableCell>
                                    <TableCell className="font-medium">{t.item?.name}</TableCell>
                                    <TableCell>
                                        {t.type === 'purchase' && <span className="text-green-600 font-bold">Compra</span>}
                                        {t.type === 'usage' && <span className="text-blue-600">Uso</span>}
                                        {t.type === 'loss' && <span className="text-red-600 font-bold">Perda</span>}
                                        {t.type === 'adjustment' && <span className="text-orange-600">Ajuste</span>}
                                    </TableCell>
                                    <TableCell>{t.quantity} {t.item?.unit}</TableCell>
                                    <TableCell>
                                        {t.cost > 0 ? t.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {transactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma movimentação.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
