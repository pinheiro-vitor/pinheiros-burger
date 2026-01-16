import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subDays, startOfDay } from "date-fns";
import { ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductPerformance {
  name: string;
  value: number;
  quantity: number;
}

export function TopProductsTable() {
  const [viewMode, setViewMode] = useState<"products" | "optionals">("products");
  const [period, setPeriod] = useState("30");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["top-products", period],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), parseInt(period)));

      const { data: orders, error } = await supabase
        .from("orders")
        .select("items")
        .gte("created_at", startDate.toISOString())
        .neq("status", "cancelled");

      if (error) throw error;

      // Aggregate products from orders
      const productMap = new Map<string, { value: number; quantity: number }>();

      orders?.forEach((order) => {
        const items = order.items as any[];
        items?.forEach((item) => {
          const name = item.name || "Produto";
          const current = productMap.get(name) || { value: 0, quantity: 0 };
          productMap.set(name, {
            value: current.value + (item.price || 0) * (item.quantity || 1),
            quantity: current.quantity + (item.quantity || 1),
          });
        });
      });

      const results: ProductPerformance[] = Array.from(productMap.entries())
        .map(([name, data]) => ({
          name,
          value: data.value,
          quantity: data.quantity,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      return results;
    },
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Desempenho de itens</CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="15">Últimos 15 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant={viewMode === "products" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("products")}
          >
            Produtos
          </Button>
          <Button
            variant={viewMode === "optionals" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("optionals")}
          >
            Opcionais
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum dado disponível
          </p>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
              <span>Produtos</span>
              <span className="text-right">Valor</span>
              <span className="text-right">Quant.</span>
            </div>
            {products.map((product, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-4 text-sm py-2 hover:bg-muted/50 rounded"
              >
                <span className="truncate">{product.name}</span>
                <span className="text-right">{formatCurrency(product.value)}</span>
                <span className="text-right text-primary font-medium">
                  {product.quantity}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <Link
            to="/admin/relatorios"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Ver relatórios
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
