import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OpeningHours {
    open: string | null;
    close: string | null;
}

export type WeeklySchedule = Record<string, OpeningHours>;

export interface StoreStatus {
    isOpen: boolean;
    nextOpen?: string;
    closeTime?: string;
    isManualClose: boolean;
    schedule: WeeklySchedule | null;
}

import { useEffect } from "react";

export function useStoreStatus() {
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ["store_settings"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("store_settings")
                .select("*")
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        // Refresh every minute to ensure open/close status is current
        refetchInterval: 60000,
    });

    useEffect(() => {
        const channel = supabase
            .channel("store_settings_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "store_settings",
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["store_settings"] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const toggleStatus = useMutation({
        mutationFn: async (isOpen: boolean) => {
            // If we only have one store, we can update without ID or get ID from settings
            if (!settings?.id) throw new Error("Store settings not found");

            const { error } = await supabase
                .from("store_settings")
                .update({ is_open: isOpen })
                .eq("id", settings.id);

            if (error) throw error;
            return isOpen;
        },
        onSuccess: (newState) => {
            queryClient.setQueryData(["store_settings"], (old: any) => ({
                ...old,
                is_open: newState,
            }));
            toast.success(newState ? "Loja aberta com sucesso!" : "Loja fechada temporariamente.");
        },
        onError: () => {
            toast.error("Erro ao atualizar status da loja.");
        },
    });

    // Calculate generic "Is Open" status based on schedule + manual override
    const getStatus = (): StoreStatus => {
        if (!settings) return { isOpen: false, isManualClose: false, schedule: null };

        // 1. Manual Override: If is_open is false in DB, store is forcefully closed
        if (settings.is_open === false) {
            return {
                isOpen: false,
                isManualClose: true,
                schedule: settings.opening_hours as unknown as WeeklySchedule
            };
        }

        // 2. Schedule Check
        const now = new Date();
        const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const dayName = days[now.getDay()];

        const schedule = settings.opening_hours as unknown as WeeklySchedule;
        if (!schedule || !schedule[dayName]) {
            // No schedule found, default to closed logic
            return { isOpen: false, isManualClose: false, schedule };
        }

        const todayHours = schedule[dayName];
        if (!todayHours.open || !todayHours.close) {
            return { isOpen: false, isManualClose: false, schedule };
        }

        const formatTime = (date: Date) =>
            `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        const currentTime = formatTime(now);

        // Compare strings "18:00" vs "20:30" - Lexicographical comparison works for 24h format
        const isOpenBySchedule =
            currentTime >= todayHours.open &&
            (todayHours.close === "00:00" ? true : currentTime < todayHours.close);

        return {
            isOpen: isOpenBySchedule,
            isManualClose: false,
            schedule,
            nextOpen: todayHours.open,
            closeTime: todayHours.close
        };
    };


    return {
        settings,
        isLoading,
        status: getStatus(),
        toggleStatus,
    };
}
