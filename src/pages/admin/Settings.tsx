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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type DailyHours = { open: string; close: string };
type WeeklyHours = Record<string, DailyHours>;

interface StoreSettings {
  id: string;
  store_name: string;
  whatsapp_number: string;
  is_open: boolean;
  min_order_value: number | null;
  delivery_fee: number | null;
  opening_hours: WeeklyHours;
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
  const [deliveryMode, setDeliveryMode] = useState<"fixed" | "distance">("distance");
  const [formData, setFormData] = useState({
    store_name: "",
    whatsapp_number: "",
    is_open: true,
    min_order_value: "",
    delivery_fee: "",
    opening_hours: defaultHours as WeeklyHours,
    store_address: "",
    store_lat: "",
    store_lng: "",
  });

  const [isLoadingCoords, setIsLoadingCoords] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["store_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as unknown as StoreSettings | null;
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
        opening_hours: settings.opening_hours || (defaultHours as WeeklyHours),
        store_address: settings.store_address || "",
        store_lat: settings.store_lat?.toString() || "",
        store_lng: settings.store_lng?.toString() || "",
      });

      if (settings.delivery_fee !== null) {
        setDeliveryMode("fixed");
      } else {
        setDeliveryMode("distance");
      }
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        store_name: data.store_name,
        whatsapp_number: data.whatsapp_number,
        is_open: data.is_open,
        min_order_value: data.min_order_value ? parseFloat(data.min_order_value) : null,
        // If mode is distance, force delivery_fee to null
        delivery_fee: deliveryMode === "fixed" && data.delivery_fee ? parseFloat(data.delivery_fee) : null,
        opening_hours: data.opening_hours,
        store_address: data.store_address || null,
        store_lat: data.store_lat ? parseFloat(data.store_lat) : null,
        store_lng: data.store_lng ? parseFloat(data.store_lng) : null,
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
      queryClient.invalidateQueries({ queryKey: ["store_settings"] });
      toast.success("Configurações salvas com sucesso");
    },
    onError: () => {
      toast.error("Erro ao salvar configurações");
    },
  });

  const handleSearchLocation = async () => {
    if (!formData.store_address) {
      toast.error("Digite um endereço primeiro.");
      return;
    }

    setIsLoadingCoords(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          formData.store_address
        )}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData((prev) => ({
          ...prev,
          store_lat: lat,
          store_lng: lon,
        }));
        toast.success("Coordenadas encontradas!");
      } else {
        toast.error("Endereço não encontrado. Tente ser mais específico.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao buscar coordenadas.");
    } finally {
      setIsLoadingCoords(false);
    }
  };

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
      <div className="space-y-6 max-w-4xl">
        <h1 className="font-display text-3xl">Configurações</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Loja</CardTitle>
              <CardDescription>Dados gerais do estabelecimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="flex items-center justify-between border p-3 rounded-lg bg-muted/20">
                <div>
                  <Label className="text-base">Status da Loja</Label>
                  <p className="text-sm text-muted-foreground">
                    Define se a loja está aceitando pedidos agora
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${(() => {
                    if (!formData.is_open) return "text-red-500";

                    // Check schedule logic locally to show accurate status preview
                    const now = new Date();
                    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
                    const dayName = days[now.getDay()];
                    const todayHours = formData.opening_hours?.[dayName];

                    if (!todayHours?.open || !todayHours?.close) return "text-red-500";

                    const formatTime = (date: Date) =>
                      `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                    const currentTime = formatTime(now);

                    const isOpenBySchedule = currentTime >= todayHours.open &&
                      (todayHours.close === "00:00" ? true : currentTime < todayHours.close);

                    return isOpenBySchedule ? "text-green-600" : "text-orange-500";
                  })()}`}>
                    {(() => {
                      if (!formData.is_open) return "FECHADA";

                      const now = new Date();
                      const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
                      const dayName = days[now.getDay()];
                      const todayHours = formData.opening_hours?.[dayName];

                      if (!todayHours?.open || !todayHours?.close) return "FECHADA (Sem Horário)";

                      const formatTime = (date: Date) =>
                        `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                      const currentTime = formatTime(now);

                      const isOpenBySchedule = currentTime >= todayHours.open &&
                        (todayHours.close === "00:00" ? true : currentTime < todayHours.close);

                      return isOpenBySchedule ? "ABERTA" : "FECHADA (Horário)";
                    })()}
                  </span>
                  <Switch
                    checked={formData.is_open}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_open: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Áreas e Taxas de Entrega</CardTitle>
              <CardDescription>Defina como será cobrado o frete</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="space-y-4">
                <RadioGroup
                  defaultValue="distance"
                  value={deliveryMode}
                  onValueChange={(val) => setDeliveryMode(val as "fixed" | "distance")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors flex-1">
                    <RadioGroupItem value="fixed" id="mode-fixed" />
                    <Label htmlFor="mode-fixed" className="cursor-pointer flex-1">Taxa Única</Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors flex-1">
                    <RadioGroupItem value="distance" id="mode-distance" />
                    <Label htmlFor="mode-distance" className="cursor-pointer flex-1">Taxa por Distância</Label>
                  </div>
                </RadioGroup>
              </div>

              {deliveryMode === "fixed" ? (
                <div className="p-4 border rounded-lg bg-muted/10 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_fee">Valor da Taxa Fixa (R$)</Label>
                    <Input
                      id="delivery_fee"
                      type="number"
                      step="0.01"
                      className="max-w-[200px]"
                      value={formData.delivery_fee}
                      onChange={(e) =>
                        setFormData({ ...formData, delivery_fee: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Este valor será cobrado para todos os pedidos de entrega, independente da distância.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="store_address">Endereço Base da Loja</Label>
                    <div className="flex gap-2">
                      <Input
                        id="store_address"
                        value={formData.store_address}
                        onChange={(e) =>
                          setFormData({ ...formData, store_address: e.target.value })
                        }
                        placeholder="Rua, Número - Bairro, Cidade - UF"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSearchLocation}
                        disabled={isLoadingCoords}
                      >
                        {isLoadingCoords ? "Buscando..." : "Buscar Coordenadas"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Digite o endereço e clique em "Buscar Coordenadas" para ativar o cálculo de frete.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <Label htmlFor="lat" className="text-xs">Latitude</Label>
                        <Input
                          id="lat"
                          value={formData.store_lat}
                          onChange={(e) => setFormData({ ...formData, store_lat: e.target.value })}
                          placeholder="-23.5505"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="lng" className="text-xs">Longitude</Label>
                        <Input
                          id="lng"
                          value={formData.store_lng}
                          onChange={(e) => setFormData({ ...formData, store_lng: e.target.value })}
                          placeholder="-46.6333"
                        />
                      </div>
                    </div>
                  </div>

                  <DeliveryZonesManager />
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="space-y-2 max-w-[200px]">
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

          <div className="fixed bottom-6 right-6">
            <Button size="lg" type="submit" className="shadow-xl" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
