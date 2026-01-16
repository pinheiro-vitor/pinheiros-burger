import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Settings2, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface OptionGroup {
  id: string;
  name: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
}

interface ProductOptionGroup {
  id: string;
  option_group_id: string;
  display_order: number;
}

interface ProductOptionGroupsManagerProps {
  productId: string;
  productName: string;
}

export function ProductOptionGroupsManager({ productId, productName }: ProductOptionGroupsManagerProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: allOptionGroups = [] } = useQuery({
    queryKey: ["all-option-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("option_groups")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as OptionGroup[];
    },
  });

  const { data: productOptionGroups = [] } = useQuery({
    queryKey: ["product-option-groups", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_option_groups")
        .select("*")
        .eq("product_id", productId)
        .order("display_order");
      if (error) throw error;
      return data as ProductOptionGroup[];
    },
    enabled: isOpen,
  });

  const linkedGroupIds = productOptionGroups.map((pog) => pog.option_group_id);

  const linkMutation = useMutation({
    mutationFn: async (optionGroupId: string) => {
      const maxOrder = productOptionGroups.length > 0
        ? Math.max(...productOptionGroups.map((p) => p.display_order))
        : 0;

      const { error } = await supabase.from("product_option_groups").insert({
        product_id: productId,
        option_group_id: optionGroupId,
        display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-option-groups", productId] });
      toast.success("Grupo de opcionais vinculado");
    },
    onError: () => {
      toast.error("Erro ao vincular grupo");
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (optionGroupId: string) => {
      const { error } = await supabase
        .from("product_option_groups")
        .delete()
        .eq("product_id", productId)
        .eq("option_group_id", optionGroupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-option-groups", productId] });
      toast.success("Grupo de opcionais removido");
    },
    onError: () => {
      toast.error("Erro ao remover grupo");
    },
  });

  const handleToggle = (optionGroupId: string, isLinked: boolean) => {
    if (isLinked) {
      unlinkMutation.mutate(optionGroupId);
    } else {
      linkMutation.mutate(optionGroupId);
    }
  };

  const linkedGroups = allOptionGroups.filter((g) => linkedGroupIds.includes(g.id));

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        title="Gerenciar opcionais"
      >
        <Settings2 className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Opcionais de {productName}</DialogTitle>
          </DialogHeader>

          {/* Currently linked groups */}
          {linkedGroups.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Vinculados:</p>
              <div className="flex flex-wrap gap-2">
                {linkedGroups.map((group) => (
                  <Badge
                    key={group.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {group.name}
                    {group.is_required && (
                      <span className="text-xs text-destructive">*</span>
                    )}
                    <button
                      onClick={() => handleToggle(group.id, true)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Available groups */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Grupos disponíveis:
            </p>
            <ScrollArea className="h-64 rounded-md border p-2">
              {allOptionGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum grupo de opcionais cadastrado
                </p>
              ) : (
                <div className="space-y-2">
                  {allOptionGroups.map((group) => {
                    const isLinked = linkedGroupIds.includes(group.id);
                    return (
                      <div
                        key={group.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => handleToggle(group.id, isLinked)}
                      >
                        <Checkbox checked={isLinked} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {group.name}
                            {group.is_required && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {group.min_selections === group.max_selections
                              ? `Escolha ${group.min_selections}`
                              : `${group.min_selections} a ${group.max_selections} opções`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <p className="text-xs text-muted-foreground">
            * Grupos obrigatórios
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
