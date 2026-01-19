import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function CustomerOrders() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["my-orders", user?.id],
        enabled: !!user,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("user_id", user?.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
            case "preparing": return "text-orange-500 border-orange-500/30 bg-orange-500/10";
            case "ready": return "text-green-500 border-green-500/30 bg-green-500/10";
            case "delivered": return "text-blue-500 border-blue-500/30 bg-blue-500/10";
            case "cancelled": return "text-red-500 border-red-500/30 bg-red-500/10";
            default: return "text-muted-foreground";
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case "pending": return "Aguardando";
            case "confirmed": return "Confirmado";
            case "preparing": return "Preparando";
            case "ready": return "Saiu para Entrega"; // Simplifying for user view
            case "delivered": return "Entregue";
            case "cancelled": return "Cancelado";
            default: return status;
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/cardapio")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-display text-2xl">Meus Pedidos</h1>
                </div>

                {isLoading ? (
                    <p>Carregando...</p>
                ) : orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <Clock className="h-12 w-12 mb-4 opacity-50" />
                            <p>Você ainda não fez nenhum pedido.</p>
                            <Button onClick={() => navigate("/cardapio")} className="mt-4" variant="outline">
                                Ver Cardápio
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Card key={order.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-medium">Order #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                                        <Badge variant="outline" className={getStatusColor(order.status)}>
                                            {statusLabel(order.status)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString()} às {new Date(order.created_at).toLocaleTimeString()}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1">
                                        {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span>{item.quantity}x {item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 border-t pt-4 flex justify-between font-bold">
                                        <span>Total</span>
                                        <span>{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
