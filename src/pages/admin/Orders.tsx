import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Clock, CheckCircle, ChefHat, Truck, XCircle } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: any;
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "bg-yellow-500", icon: Clock },
  confirmed: { label: "Aceito", color: "bg-blue-500", icon: CheckCircle },
  preparing: { label: "Preparo", color: "bg-orange-500", icon: ChefHat },
  ready: { label: "Entrega", color: "bg-purple-500", icon: Truck },
  delivered: { label: "Concluído", color: "bg-green-500", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: XCircle },
};

const statusOrder: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "delivered"];

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<OrderStatus>("pending");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders", activeStatus],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", activeStatus)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Status atualizado");
    },
  });

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    const idx = statusOrder.indexOf(current);
    if (idx === -1 || idx >= statusOrder.length - 1) return null;
    return statusOrder[idx + 1];
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-3xl">Pedidos</h1>

        <Tabs value={activeStatus} onValueChange={(v) => setActiveStatus(v as OrderStatus)}>
          <TabsList className="flex-wrap h-auto gap-2">
            {statusOrder.map((status) => {
              const config = statusConfig[status];
              const Icon = config.icon;
              return (
                <TabsTrigger key={status} value={status} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {config.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <p>Carregando...</p>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum pedido neste status</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              const items = Array.isArray(order.items) ? order.items : [];

              return (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <Badge className={statusConfig[order.status].color}>
                        {statusConfig[order.status].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                    </div>

                    <div className="space-y-1">
                      {items.slice(0, 3).map((item: any, idx: number) => (
                        <p key={idx} className="text-sm">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                      {items.length > 3 && (
                        <p className="text-sm text-muted-foreground">
                          +{items.length - 3} itens
                        </p>
                      )}
                    </div>

                    {order.notes && (
                      <p className="text-sm italic text-muted-foreground">
                        Obs: {order.notes}
                      </p>
                    )}

                    <div className="pt-2 border-t">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(order.total)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {order.status === "pending" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            updateStatusMutation.mutate({ id: order.id, status: "cancelled" })
                          }
                        >
                          Cancelar
                        </Button>
                      )}
                      {nextStatus && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            updateStatusMutation.mutate({ id: order.id, status: nextStatus })
                          }
                        >
                          {statusConfig[nextStatus].label}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
