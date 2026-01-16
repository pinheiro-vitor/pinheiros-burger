import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeliveryZone {
  id: string;
  min_distance: number;
  max_distance: number;
  fee: number;
  active: boolean;
}

export function DeliveryZonesManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [formData, setFormData] = useState({
    min_distance: "",
    max_distance: "",
    fee: "",
  });

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("min_distance");
      if (error) throw error;
      return data as DeliveryZone[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        min_distance: parseFloat(data.min_distance),
        max_distance: parseFloat(data.max_distance),
        fee: parseFloat(data.fee),
      };

      if (data.id) {
        const { error } = await supabase
          .from("delivery_zones")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("delivery_zones").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
      toast.success("Faixa de frete salva");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao salvar faixa");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("delivery_zones")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
      toast.success("Faixa excluída");
    },
    onError: () => {
      toast.error("Erro ao excluir faixa");
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingZone(null);
    setFormData({ min_distance: "", max_distance: "", fee: "" });
  };

  const handleEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      min_distance: zone.min_distance.toString(),
      max_distance: zone.max_distance.toString(),
      fee: zone.fee.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, id: editingZone?.id });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Faixas de Frete por Distância</CardTitle>
          <CardDescription>
            Configure o valor do frete baseado na distância até o cliente
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() => setFormData({ min_distance: "", max_distance: "", fee: "" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Faixa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingZone ? "Editar Faixa" : "Nova Faixa de Frete"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_distance">Distância Mínima (km)</Label>
                  <Input
                    id="min_distance"
                    type="number"
                    step="0.1"
                    value={formData.min_distance}
                    onChange={(e) =>
                      setFormData({ ...formData, min_distance: e.target.value })
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_distance">Distância Máxima (km)</Label>
                  <Input
                    id="max_distance"
                    type="number"
                    step="0.1"
                    value={formData.max_distance}
                    onChange={(e) =>
                      setFormData({ ...formData, max_distance: e.target.value })
                    }
                    placeholder="1"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">Valor do Frete (R$)</Label>
                <Input
                  id="fee"
                  type="number"
                  step="0.01"
                  value={formData.fee}
                  onChange={(e) =>
                    setFormData({ ...formData, fee: e.target.value })
                  }
                  placeholder="5.00"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : zones.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma faixa de frete configurada
          </p>
        ) : (
          <div className="space-y-2">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center gap-4 p-3 rounded-lg border bg-card"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {zone.min_distance} km - {zone.max_distance} km
                  </p>
                  <p className="text-sm text-primary font-semibold">
                    {formatCurrency(zone.fee)}
                  </p>
                </div>
                <Switch
                  checked={zone.active}
                  onCheckedChange={(checked) =>
                    toggleMutation.mutate({ id: zone.id, active: checked })
                  }
                />
                <Button variant="ghost" size="icon" onClick={() => handleEdit(zone)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Excluir esta faixa de frete?")) {
                      deleteMutation.mutate(zone.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
