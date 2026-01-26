import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ChefHat, CheckCircle, AlertTriangle } from "lucide-react";
import { format, differenceInMinutes, differenceInSeconds } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type OrderStatus = "pending" | "preparing" | "ready";

interface OrderItem {
    name: string;
    quantity: number;
    observations?: string;
}

interface Order {
    id: string;
    customer_name: string;
    items: OrderItem[];
    status: OrderStatus;
    notes: string | null;
    created_at: string;
}

const Timer = ({ startTime }: { startTime: string }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const start = new Date(startTime);
    const diffSeconds = differenceInSeconds(now, start);
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    const isLate = minutes >= 20;

    return (
        <div className={`flex items-center gap-2 font-mono text-xl font-bold ${isLate ? "text-red-500 animate-pulse" : "text-neutral-400"}`}>
            {isLate && <AlertTriangle className="h-5 w-5" />}
            <Clock className="h-5 w-5" />
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
    );
};

export default function KitchenDisplay() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Fetch only active kitchen orders
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["kds-orders"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .in("status", ["pending", "preparing"])
                .order("created_at", { ascending: true }); // Oldest first
            if (error) throw error;
            return data as unknown as Order[];
        },
    });

    // Real-time updates
    useEffect(() => {
        const channel = supabase
            .channel("kds-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["kds-orders"] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
            const { error } = await supabase.from("orders").update({ status }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Pedido atualizado!");
            queryClient.invalidateQueries({ queryKey: ["kds-orders"] });
        },
    });

    const advanceStatus = (order: Order) => {
        if (order.status === "pending") {
            updateStatusMutation.mutate({ id: order.id, status: "preparing" });
        } else if (order.status === "preparing") {
            updateStatusMutation.mutate({ id: order.id, status: "ready" });
        }
    };

    if (isLoading) return <div className="p-8 text-white">Carregando KDS...</div>;

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-4xl font-black tracking-tighter text-yellow-500 flex items-center gap-3">
                    <ChefHat className="h-10 w-10" />
                    COZINHA (KDS)
                </h1>
                <Button variant="outline" className="text-black" onClick={() => navigate("/admin/orders")}>
                    Voltar para Admin
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {orders.length === 0 ? (
                    <div className="col-span-full h-96 flex items-center justify-center flex-col text-neutral-500">
                        <CheckCircle className="h-24 w-24 mb-4 opacity-20" />
                        <p className="text-2xl font-bold">Tudo limpo por aqui chef!</p>
                    </div>
                ) : (
                    orders.map((order) => {
                        const isLate = differenceInMinutes(new Date(), new Date(order.created_at)) >= 20;

                        return (
                            <Card
                                key={order.id}
                                className={`border-4 shadow-xl flex flex-col ${order.status === "pending"
                                    ? "border-yellow-500 bg-neutral-800"
                                    : "border-orange-600 bg-neutral-800"
                                    } ${isLate ? "animate-pulse border-red-600" : ""}`}
                            >
                                <CardHeader className="pb-2 bg-black/20">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-2xl font-black text-white">
                                                #{order.id.slice(0, 5).toUpperCase()}
                                            </CardTitle>
                                            <div className="mt-2">
                                                <Timer startTime={order.created_at} />
                                            </div>
                                        </div>
                                        <Badge
                                            className={`text-lg px-3 py-1 ${order.status === "pending"
                                                ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                                                : "bg-orange-600 hover:bg-orange-700 text-white"
                                                }`}
                                        >
                                            {order.status === "pending" ? "NOVO" : "PREPARO"}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-neutral-400 mt-1 font-medium truncate">
                                        {order.customer_name}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4 flex-1 flex flex-col">
                                    <div className="space-y-4 flex-1">
                                        {/* Items List - Large Text for Kitchen */}
                                        {Array.isArray(order.items) && order.items.map((item: OrderItem, idx: number) => (
                                            <div key={idx} className="border-b border-neutral-700 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-start gap-3">
                                                    <span className="font-black text-2xl text-yellow-400 min-w-[2rem]">
                                                        {item.quantity}x
                                                    </span>
                                                    <div>
                                                        <span className="font-bold text-xl text-white leading-tight block">
                                                            {item.name}
                                                        </span>
                                                        {item.observations && (
                                                            <p className="text-red-400 font-bold text-lg mt-1 bg-red-900/30 p-1 rounded">
                                                                ⚠️ {item.observations}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {order.notes && (
                                        <div className="bg-blue-900/30 border border-blue-800 p-2 rounded text-blue-200 font-medium">
                                            📝 Note: {order.notes}
                                        </div>
                                    )}

                                    <Button
                                        className="w-full h-16 text-xl font-bold mt-4"
                                        size="lg"
                                        variant={order.status === 'pending' ? 'default' : 'secondary'}
                                        onClick={() => advanceStatus(order)}
                                    >
                                        {order.status === 'pending' ? 'INICIAR PREPARO 🔥' : 'PRONTO PARA ENTREGA ✅'}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
