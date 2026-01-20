import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeliveryZone {
    id: string;
    min_distance: number;
    max_distance: number;
    fee: number;
}

interface StoreCoordinates {
    lat: number;
    lng: number;
}

export function useDelivery() {
    const [userLocation, setUserLocation] = useState<StoreCoordinates | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
    const [calculating, setCalculating] = useState(false);
    const [isFixedFee, setIsFixedFee] = useState(false);

    // 1. Fetch Store Settings (for Coordinates and Fixed Fee)
    const { data: storeSettings } = useQuery({
        queryKey: ["store-location"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("store_settings")
                .select("store_lat, store_lng, delivery_fee")
                .limit(1)
                .single();

            if (error) throw error;
            return data;
        },
    });

    // 2. Fetch Delivery Zones
    const { data: zones } = useQuery({
        queryKey: ["delivery-zones"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("delivery_zones")
                .select("*")
                .eq("active", true)
                .order("min_distance", { ascending: true });

            if (error) throw error;
            return data as DeliveryZone[];
        },
    });

    // Effect to handle Fixed Fee
    useEffect(() => {
        if (storeSettings?.delivery_fee !== null && storeSettings?.delivery_fee !== undefined) {
            setDeliveryFee(storeSettings.delivery_fee);
            setIsFixedFee(true);
        } else {
            setIsFixedFee(false);
            setDeliveryFee(null); // Reset if switching back to distance mode
        }
    }, [storeSettings]);

    // Haversine Formula to calculate distance in km
    const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180);
    };

    const calculateFee = () => {
        // If Fixed Fee is active, we don't need to calculate anything, maybe just get location for address filling?
        // But for now, if fixed fee, this function shouldn't necessarily change the fee.
        if (isFixedFee) {
            toast.info("A loja possui uma taxa de entrega fixa.");
            return;
        }

        if (!storeSettings?.store_lat || !storeSettings?.store_lng) {
            toast.error("Configuração da loja incompleta (sem coordenadas).");
            return;
        }

        if (!navigator.geolocation) {
            toast.error("Geolocalização não suportada pelo seu navegador.");
            return;
        }

        setCalculating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });

                // Calculate distance
                const dist = calculateDistanceKm(
                    storeSettings.store_lat,
                    storeSettings.store_lng,
                    latitude,
                    longitude
                );

                setDistance(dist);

                let feeFound = null;
                if (zones) {
                    const zone = zones.find(z => dist >= z.min_distance && dist < z.max_distance);
                    if (zone) {
                        feeFound = zone.fee;
                    } else {
                        // Check if it's within the LAST zone's range
                        const maxZone = zones[zones.length - 1];
                        if (maxZone && dist <= maxZone.max_distance && dist >= maxZone.min_distance) {
                            feeFound = maxZone.fee;
                        }
                    }
                }

                if (feeFound !== null) {
                    setDeliveryFee(feeFound);
                    toast.success(`Frete calculado: R$ ${feeFound.toFixed(2)} (${dist.toFixed(1)}km)`);
                } else {
                    setDeliveryFee(null);
                    toast.error(`Desculpe, não entregamos nessa distância (${dist.toFixed(1)}km).`);
                }

                setCalculating(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast.error("Erro ao obter localização. Verifique as permissões.");
                setCalculating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    return {
        calculateFee,
        deliveryFee,
        setDeliveryFee,
        distance,
        calculating,
        userLocation,
        isFixedFee,
        setIsFixedFee
    };
}
