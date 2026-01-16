import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Store, User } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.jpeg";

interface StoreSettings {
  id: string;
  store_name: string;
  is_open: boolean;
}

export function AdminHeader() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("id, store_name, is_open")
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as StoreSettings | null;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (isOpen: boolean) => {
      if (!settings?.id) return;
      const { error } = await supabase
        .from("store_settings")
        .update({ is_open: isOpen })
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success(settings?.is_open ? "Loja fechada" : "Loja aberta");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and Store Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
            <img
              src={logo}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-display text-lg hidden sm:block">
            {settings?.store_name || "Pinheiro's Burger"}
          </span>
        </div>

        {/* Store Status and User */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleMutation.mutate(!settings?.is_open)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                settings?.is_open
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              <Store className="h-4 w-4" />
              {settings?.is_open ? "Aberta" : "Fechada"}
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="hidden sm:block">Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
