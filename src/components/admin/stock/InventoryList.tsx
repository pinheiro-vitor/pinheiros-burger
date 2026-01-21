import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface InventoryItem {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    min_stock_alert: number;
    last_cost: number;
}

export function InventoryList() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        unit: "un",
        min_stock_alert: "5",
    });

    const { data: items = [], isLoading } = useQuery({
        queryKey: ["inventory-items"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("inventory_items")
                .select("*")
                .order("name");
            if (error) throw error;
            return data as InventoryItem[];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const { error } = await supabase.from("inventory_items").insert({
                name: data.name,
                unit: data.unit,
                min_stock_alert: parseFloat(data.min_stock_alert),
                quantity: 0, // Starts at 0, add via Purchases
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
            toast.success("Item cadastrado com sucesso");
            setIsDialogOpen(false);
            setFormData({ name: "", unit: "un", min_stock_alert: "5" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const calculateTotalValue = () => {
        return items.reduce((acc, item) => acc + (item.quantity * item.last_cost), 0);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">Estoque Atual</h2>
                    <div className="px-3 py-1 bg-primary/10 rounded-lg text-primary text-sm font-medium">
                        Valor Total: {calculateTotalValue().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Novo Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cadastrar Insumo</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Item</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Pão de Hambúrguer"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unidade de Medida</Label>
                                <Select
                                    value={formData.unit}
                                    onValueChange={(val) => setFormData({ ...formData, unit: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="un">Unidade (un)</SelectItem>
                                        <SelectItem value="kg">Quilograma (kg)</SelectItem>
                                        <SelectItem value="l">Litro (l)</SelectItem>
                                        <SelectItem value="pct">Pacote (pct)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="alert">Alerta de Estoque Mínimo</Label>
                                <Input
                                    id="alert"
                                    type="number"
                                    value={formData.min_stock_alert}
                                    onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Salvando..." : "Cadastrar"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Qtd. Atual</TableHead>
                            <TableHead>Custo Unit. (Último)</TableHead>
                            <TableHead>Valor Total</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>
                                    {item.quantity} {item.unit}
                                </TableCell>
                                <TableCell>
                                    {item.last_cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell>
                                    {(item.quantity * item.last_cost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell>
                                    {item.quantity <= item.min_stock_alert ? (
                                        <span className="flex items-center text-red-500 text-xs font-bold">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            BAIXO
                                        </span>
                                    ) : (
                                        <span className="text-green-500 text-xs font-bold">OK</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    Nenhum item cadastrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
