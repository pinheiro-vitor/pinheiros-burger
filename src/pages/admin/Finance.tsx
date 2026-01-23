import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyClosing } from "@/components/admin/finance/DailyClosing";
import { SalesAnalytics } from "@/components/admin/finance/SalesAnalytics";

export default function AdminFinance() {
    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="font-display text-4xl font-bold tracking-tight">Painel Financeiro</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestão completa de fechamento de caixa e análise de vendas.
                    </p>
                </div>

                <Tabs defaultValue="closing" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="closing">Fechamento de Caixa</TabsTrigger>
                        <TabsTrigger value="analytics">Análise de Vendas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="closing" className="outline-none focus-visible:ring-0">
                        <DailyClosing />
                    </TabsContent>

                    <TabsContent value="analytics" className="outline-none focus-visible:ring-0">
                        <SalesAnalytics />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
