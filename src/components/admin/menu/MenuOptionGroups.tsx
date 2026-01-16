import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Option {
  id: string;
  name: string;
  price: number;
  active: boolean;
  option_group_id: string;
}

interface OptionGroup {
  id: string;
  name: string;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  active: boolean;
  options: Option[];
}

export function MenuOptionGroups() {
  const queryClient = useQueryClient();
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [groupFormData, setGroupFormData] = useState({
    name: "",
    min_selections: "0",
    max_selections: "1",
    is_required: false,
  });

  const [optionFormData, setOptionFormData] = useState({
    name: "",
    price: "0",
  });

  const { data: optionGroups = [], isLoading } = useQuery({
    queryKey: ["admin-option-groups"],
    queryFn: async () => {
      const { data: groups, error: groupsError } = await supabase
        .from("option_groups")
        .select("*")
        .order("display_order");
      if (groupsError) throw groupsError;

      const groupsWithOptions: OptionGroup[] = [];
      for (const group of groups) {
        const { data: options, error: optionsError } = await supabase
          .from("options")
          .select("*")
          .eq("option_group_id", group.id)
          .order("display_order");
        if (optionsError) throw optionsError;

        groupsWithOptions.push({
          ...group,
          options: options || [],
        });
      }

      return groupsWithOptions;
    },
  });

  const saveGroupMutation = useMutation({
    mutationFn: async (data: typeof groupFormData & { id?: string }) => {
      const payload = {
        name: data.name,
        min_selections: parseInt(data.min_selections),
        max_selections: parseInt(data.max_selections),
        is_required: data.is_required,
      };

      if (data.id) {
        const { error } = await supabase
          .from("option_groups")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const maxOrder = Math.max(...optionGroups.map((g) => g.min_selections), 0);
        const { error } = await supabase
          .from("option_groups")
          .insert({ ...payload, display_order: maxOrder + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-option-groups"] });
      toast.success("Grupo salvo com sucesso");
      handleCloseGroupDialog();
    },
    onError: () => {
      toast.error("Erro ao salvar grupo");
    },
  });

  const saveOptionMutation = useMutation({
    mutationFn: async (data: typeof optionFormData & { id?: string; option_group_id: string }) => {
      const payload = {
        name: data.name,
        price: parseFloat(data.price),
        option_group_id: data.option_group_id,
      };

      if (data.id) {
        const { error } = await supabase
          .from("options")
          .update({ name: payload.name, price: payload.price })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("options").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-option-groups"] });
      toast.success("Opção salva com sucesso");
      handleCloseOptionDialog();
    },
    onError: () => {
      toast.error("Erro ao salvar opção");
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("option_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-option-groups"] });
      toast.success("Grupo excluído");
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-option-groups"] });
      toast.success("Opção excluída");
    },
  });

  const toggleGroupMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("option_groups").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-option-groups"] });
    },
  });

  const handleCloseGroupDialog = () => {
    setIsGroupDialogOpen(false);
    setEditingGroup(null);
    setGroupFormData({ name: "", min_selections: "0", max_selections: "1", is_required: false });
  };

  const handleCloseOptionDialog = () => {
    setIsOptionDialogOpen(false);
    setEditingOption(null);
    setSelectedGroupId(null);
    setOptionFormData({ name: "", price: "0" });
  };

  const handleEditGroup = (group: OptionGroup) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name,
      min_selections: group.min_selections.toString(),
      max_selections: group.max_selections.toString(),
      is_required: group.is_required,
    });
    setIsGroupDialogOpen(true);
  };

  const handleEditOption = (option: Option) => {
    setEditingOption(option);
    setSelectedGroupId(option.option_group_id);
    setOptionFormData({
      name: option.name,
      price: option.price.toString(),
    });
    setIsOptionDialogOpen(true);
  };

  const handleAddOption = (groupId: string) => {
    setSelectedGroupId(groupId);
    setOptionFormData({ name: "", price: "0" });
    setIsOptionDialogOpen(true);
  };

  const toggleExpanded = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setGroupFormData({ name: "", min_selections: "0", max_selections: "1", is_required: false })}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "Editar Grupo" : "Novo Grupo de Opcionais"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveGroupMutation.mutate({ ...groupFormData, id: editingGroup?.id });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Grupo</Label>
                <Input
                  id="name"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  placeholder="Ex: Adicionais"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min">Mín. seleções</Label>
                  <Input
                    id="min"
                    type="number"
                    value={groupFormData.min_selections}
                    onChange={(e) => setGroupFormData({ ...groupFormData, min_selections: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Máx. seleções</Label>
                  <Input
                    id="max"
                    type="number"
                    value={groupFormData.max_selections}
                    onChange={(e) => setGroupFormData({ ...groupFormData, max_selections: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="required"
                  checked={groupFormData.is_required}
                  onCheckedChange={(checked) =>
                    setGroupFormData({ ...groupFormData, is_required: checked as boolean })
                  }
                />
                <Label htmlFor="required">Obrigatório</Label>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleCloseGroupDialog} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={saveGroupMutation.isPending}>
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Option Dialog */}
      <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOption ? "Editar Opção" : "Nova Opção"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedGroupId) {
                saveOptionMutation.mutate({
                  ...optionFormData,
                  id: editingOption?.id,
                  option_group_id: selectedGroupId,
                });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="optionName">Nome</Label>
              <Input
                id="optionName"
                value={optionFormData.name}
                onChange={(e) => setOptionFormData({ ...optionFormData, name: e.target.value })}
                placeholder="Ex: Bacon Crocante"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optionPrice">Preço adicional</Label>
              <Input
                id="optionPrice"
                type="number"
                step="0.01"
                value={optionFormData.price}
                onChange={(e) => setOptionFormData({ ...optionFormData, price: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCloseOptionDialog} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={saveOptionMutation.isPending}>
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="space-y-4">
          {optionGroups.map((group) => (
            <Collapsible
              key={group.id}
              open={expandedGroups.has(group.id)}
              onOpenChange={() => toggleExpanded(group.id)}
            >
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70">
                      {expandedGroups.has(group.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      {group.is_required && (
                        <Badge variant="secondary" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {group.options.length} opções
                      </span>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={group.active}
                        onCheckedChange={(checked) =>
                          toggleGroupMutation.mutate({ id: group.id, active: checked })
                        }
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleEditGroup(group)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Excluir este grupo e todas as opções?")) {
                            deleteGroupMutation.mutate(group.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-2 border-t pt-3">
                      {group.options.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <span className="font-medium">{option.name}</span>
                            {option.price > 0 && (
                              <span className="text-primary ml-2">+{formatPrice(option.price)}</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditOption(option)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Excluir esta opção?")) {
                                  deleteOptionMutation.mutate(option.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleAddOption(group.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Opção
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
