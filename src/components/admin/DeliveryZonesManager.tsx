import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
    if (value === 0) return "Grátis";
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-base">Faixas de Distância</Label>
          <p className="text-sm text-muted-foreground">
            Configure as taxas baseadas na distância (km)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-primary hover:text-primary border-primary/20 hover:bg-primary/5"
              onClick={() => setFormData({ min_distance: "", max_distance: "", fee: "" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova taxa por distância
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
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                  <Input
                    id="fee"
                    type="number"
                    step="0.01"
                    className="pl-9"
                    value={formData.fee}
                    onChange={(e) =>
                      setFormData({ ...formData, fee: e.target.value })
                    }
                    placeholder="0,00"
                    required
                  />
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  Use 0,00 para frete grátis nesta faixa.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseDialog}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Distância (km)</TableHead>
              <TableHead>Taxa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Info className="h-8 w-8 opacity-50" />
                    <p>Nenhuma faixa configurada.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">
                    {zone.max_distance >= 999
                      ? `Acima de ${zone.min_distance} km`
                      : zone.min_distance === 0
                        ? `Até ${zone.max_distance} km`
                        : `${zone.min_distance} km a ${zone.max_distance} km`
                    }
                  </TableCell>
                  <TableCell>
                    {zone.fee === 0 ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                        Entrega Grátis
                      </Badge>
                    ) : (
                      formatCurrency(zone.fee)
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={zone.active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: zone.id, active: checked })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {zone.active ? "Ligado" : "Desligado"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(zone)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm("Excluir esta faixa de frete?")) {
                            deleteMutation.mutate(zone.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
