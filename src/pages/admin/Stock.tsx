import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryList } from "@/components/admin/stock/InventoryList";
import { InventoryTransactions } from "../../components/admin/stock/InventoryTransactions";
import { ExpensesList } from "../../components/admin/stock/ExpensesList";

export default function AdminStock() {
    const [activeTab, setActiveTab] = useState("inventory");

    return (
        <AdminLayout>
            <div className="space-y-6">
                <h1 className="font-display text-3xl">Gestão de Estoque e Despesas</h1>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="inventory">Estoque Atual</TabsTrigger>
                        <TabsTrigger value="transactions">Compras / Movimentações</TabsTrigger>
                        <TabsTrigger value="expenses">Despesas Gerais</TabsTrigger>
                    </TabsList>

                    <TabsContent value="inventory" className="mt-6">
                        <InventoryList />
                    </TabsContent>

                    <TabsContent value="transactions" className="mt-6">
                        <InventoryTransactions />
                    </TabsContent>

                    <TabsContent value="expenses" className="mt-6">
                        <ExpensesList />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
