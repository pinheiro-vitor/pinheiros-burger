import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { subDays } from "date-fns";

interface ChannelData {
  name: string;
  value: number;
  color: string;
}

export function SalesChannelsChart() {
  const { data: channelData = [], isLoading } = useQuery({
    queryKey: ["sales-channels"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data: orders, error } = await supabase
        .from("orders")
        .select("total")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .neq("status", "cancelled");

      if (error) throw error;

      const total = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

      // For now, all orders are from delivery (web)
      // This can be expanded when multiple channels are implemented
      const data: ChannelData[] = [
        { name: "Delivery", value: total, color: "#3b82f6" },
        { name: "QR Code", value: 0, color: "#a855f7" },
        { name: "Tablet", value: 0, color: "#6b7280" },
        { name: "Totem", value: 0, color: "#f59e0b" },
      ].filter((d) => d.value > 0);

      // If no data, show placeholder
      if (data.length === 0) {
        return [{ name: "Delivery", value: 100, color: "#3b82f6" }];
      }

      return data;
    },
  });

  const total = channelData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Canais de venda</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `${((value / total) * 100).toFixed(0)}%`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {[
                { name: "Delivery", color: "#3b82f6" },
                { name: "QR Code", color: "#a855f7" },
                { name: "Tablet", color: "#6b7280" },
                { name: "Totem", color: "#f59e0b" },
              ].map((channel) => (
                <div key={channel.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: channel.color }}
                  />
                  <span className="text-muted-foreground">{channel.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
