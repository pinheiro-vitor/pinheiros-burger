import { Link, useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Store, User, Clock, ChevronDown } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const navigate = useNavigate();
  const { status, toggleStatus, isLoading } = useStoreStatus();

  const isWithinSchedule = status.schedule && !status.nextOpen && status.closeTime;
  // Simplified check. Real hook logic:
  // if isOpen=true, it's within schedule AND manual is open.
  // if isManualClose=true, it's within schedule BUT manual is closed.
  // if both false, it's outside schedule.

  // Correction based on my hook implementation:
  // getStatus returns { isOpen, isManualClose, schedule ... }
  // - isOpen=true: Open now.
  // - isManualClose=true: Within hours, but manually closed.
  // - Both false: Outside hours.

  const isOutsideSchedule = !status.isOpen && !status.isManualClose;

  const handleToggle = (checked: boolean) => {
    if (isOutsideSchedule) {
      // Should not happen if UI is correct, but just in case
      return;
    }
    toggleStatus.mutate(checked);
  };

  return (
    <div className="bg-card border-b border-border px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and Store Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
            {/* Use fallback if logo missing/broken, though import seems correct */}
            <img
              src={logo}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg leading-none hidden sm:block">
              Pinheiro's Burger
            </span>
            {isLoading ? (
              <span className="text-xs text-muted-foreground">Carregando...</span>
            ) : (
              <span className="text-xs text-muted-foreground hidden sm:block">
                {status.isOpen ? "Loja Aberta" : "Loja Fechada"}
              </span>
            )}
          </div>
        </div>

        {/* Store Status and User */}
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${status.isOpen
                    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                    : "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                  }`}
              >
                <Store className="h-4 w-4" />
                <span>{status.isOpen ? "Aberta" : "Fechada"}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium">Status da Loja</h4>
                  <Link
                    to="/admin/configuracoes"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Configurar horários
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  Gerencie a disponibilidade da sua loja.
                </p>
              </div>

              <div className="p-4 space-y-4">
                {isOutsideSchedule ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100 text-orange-800">
                      <Clock className="h-5 w-5 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold mb-1">Fora do Horário</p>
                        <p>
                          Sua loja está fechada de acordo com o quadro de horários.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/admin/configuracoes")}
                    >
                      Alterar Horários de Abertura
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <div className="space-y-0.5">
                      <label
                        htmlFor="store-status"
                        className="text-sm font-medium cursor-pointer"
                      >
                        {status.isOpen ? "Loja Aberta" : "Fechada Temporariamente"}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {status.isOpen
                          ? "Recebendo pedidos normalmente"
                          : "Interromper funcionamento da loja"}
                      </p>
                    </div>
                    <Switch
                      id="store-status"
                      checked={status.isOpen}
                      onCheckedChange={handleToggle}
                      disabled={toggleStatus.isPending || isLoading}
                    />
                  </div>
                )}

                {/* Info about schedule */}
                {status.nextOpen && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                    <Clock className="h-3 w-3" />
                    <span>
                      Horário hoje: {status.nextOpen} às {status.closeTime}
                    </span>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <div className="h-6 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              A
            </div>
            <span className="hidden sm:block">Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
