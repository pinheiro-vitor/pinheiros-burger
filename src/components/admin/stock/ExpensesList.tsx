import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
}

export function ExpensesList() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "Geral",
        date: new Date().toISOString().split('T')[0],
    });

    const { data: expenses = [], isLoading } = useQuery({
        queryKey: ["expenses"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("expenses")
                .select("*")
                .order("date", { ascending: false });
            if (error) throw error;
            return data as Expense[];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const { error } = await supabase.from("expenses").insert({
                description: data.description,
                amount: parseFloat(data.amount),
                category: data.category,
                date: data.date,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            toast.success("Despesa registrada com sucesso");
            setIsDialogOpen(false);
            setFormData({
                description: "",
                amount: "",
                category: "Geral",
                date: new Date().toISOString().split('T')[0]
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const calculateTotalExpenses = () => {
        return expenses.reduce((acc, expense) => acc + expense.amount, 0);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">Despesas Gerais</h2>
                    <div className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg text-sm font-medium">
                        Total: {calculateTotalExpenses().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="destructive">
                            <Plus className="h-4 w-4 mr-2" /> Nova Despesa
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar Despesa</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ex: Conta de Luz"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Valor (R$)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Categoria</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Geral">Geral</SelectItem>
                                        <SelectItem value="Utilidades">Utilidades (Água, Luz, Internet)</SelectItem>
                                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                                        <SelectItem value="Salários">Salários</SelectItem>
                                        <SelectItem value="Marketing">Marketing</SelectItem>
                                        <SelectItem value="Impostos">Impostos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Data</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" variant="destructive" disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Salvando..." : "Registrar Despesa"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell>
                                    {format(new Date(expense.date), "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell className="font-medium">{expense.description}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {expense.category}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right text-red-600 font-medium">
                                    - {expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                            </TableRow>
                        ))}
                        {expenses.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    Nenhuma despesa registrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
