import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DeliveryZonesManager } from "@/components/admin/DeliveryZonesManager";

interface StoreSettings {
  id: string;
  store_name: string;
  whatsapp_number: string;
  is_open: boolean;
  min_order_value: number | null;
  delivery_fee: number | null;
  opening_hours: any;
  store_address: string | null;
  store_lat: number | null;
  store_lng: number | null;
}

const defaultHours = {
  mon: { open: "18:00", close: "23:00" },
  tue: { open: "18:00", close: "23:00" },
  wed: { open: "18:00", close: "23:00" },
  thu: { open: "18:00", close: "23:00" },
  fri: { open: "18:00", close: "00:00" },
  sat: { open: "18:00", close: "00:00" },
  sun: { open: "18:00", close: "23:00" },
};

const dayLabels: Record<string, string> = {
  mon: "Segunda",
  tue: "Terça",
  wed: "Quarta",
  thu: "Quinta",
  fri: "Sexta",
  sat: "Sábado",
  sun: "Domingo",
};

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    store_name: "",
    whatsapp_number: "",
    is_open: true,
    min_order_value: "",
    delivery_fee: "",
    opening_hours: defaultHours,
    store_address: "",
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as StoreSettings | null;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        store_name: settings.store_name,
        whatsapp_number: settings.whatsapp_number,
        is_open: settings.is_open,
        min_order_value: settings.min_order_value?.toString() || "",
        delivery_fee: settings.delivery_fee?.toString() || "",
        opening_hours: settings.opening_hours || defaultHours,
        store_address: settings.store_address || "",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        store_name: data.store_name,
        whatsapp_number: data.whatsapp_number,
        is_open: data.is_open,
        min_order_value: data.min_order_value ? parseFloat(data.min_order_value) : null,
        delivery_fee: data.delivery_fee ? parseFloat(data.delivery_fee) : null,
        opening_hours: data.opening_hours,
        store_address: data.store_address || null,
      };

      if (settings?.id) {
        const { error } = await supabase
          .from("store_settings")
          .update(payload)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_settings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success("Configurações salvas com sucesso");
    },
    onError: () => {
      toast.error("Erro ao salvar configurações");
    },
  });

  const updateHour = (day: string, field: "open" | "close", value: string) => {
    setFormData((prev) => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <p>Carregando...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="font-display text-3xl">Configurações</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Loja</CardTitle>
              <CardDescription>Dados gerais do estabelecimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store_name">Nome da Loja</Label>
                <Input
                  id="store_name"
                  value={formData.store_name}
                  onChange={(e) =>
                    setFormData({ ...formData, store_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp_number}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp_number: e.target.value })
                  }
                  placeholder="5511999999999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_address">Endereço da Loja</Label>
                <Input
                  id="store_address"
                  value={formData.store_address}
                  onChange={(e) =>
                    setFormData({ ...formData, store_address: e.target.value })
                  }
                  placeholder="Rua, Número - Bairro, Cidade - UF"
                />
                <p className="text-xs text-muted-foreground">
                  Endereço usado como base para cálculo de frete por distância
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Loja Aberta</Label>
                  <p className="text-sm text-muted-foreground">
                    Clientes podem fazer pedidos
                  </p>
                </div>
                <Switch
                  checked={formData.is_open}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_open: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
              <CardDescription>Configurações de entrega (taxa fixa)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_order">Pedido Mínimo (R$)</Label>
                  <Input
                    id="min_order"
                    type="number"
                    step="0.01"
                    value={formData.min_order_value}
                    onChange={(e) =>
                      setFormData({ ...formData, min_order_value: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_fee">Taxa de Entrega Fixa (R$)</Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    step="0.01"
                    value={formData.delivery_fee}
                    onChange={(e) =>
                      setFormData({ ...formData, delivery_fee: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opening Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Horário de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(dayLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-4">
                  <span className="w-20 text-sm font-medium">{label}</span>
                  <Input
                    type="time"
                    value={formData.opening_hours[key]?.open || ""}
                    onChange={(e) => updateHour(key, "open", e.target.value)}
                    className="w-28"
                  />
                  <span className="text-muted-foreground">às</span>
                  <Input
                    type="time"
                    value={formData.opening_hours[key]?.close || ""}
                    onChange={(e) => updateHour(key, "close", e.target.value)}
                    className="w-28"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </form>

        {/* Delivery Zones - Separate from form */}
        <DeliveryZonesManager />
      </div>
    </AdminLayout>
  );
}
