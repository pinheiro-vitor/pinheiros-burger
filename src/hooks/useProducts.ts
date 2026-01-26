import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  active: boolean;
  display_order: number;
  category?: {
    id: string;
    name: string;
    icon: string | null;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  display_order: number;
  active: boolean;
}

export interface OptionGroup {
  id: string;
  name: string;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  display_order: number;
  options: Option[];
}

export interface Option {
  id: string;
  name: string;
  price: number;
  option_group_id: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("display_order");

      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useProducts(categoryId?: string) {
  return useQuery({
    queryKey: ["products", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name, icon)
        `)
        .eq("active", true)
        .order("display_order");

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!productId) return null;

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name, icon)
        `)
        .eq("id", productId)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId,
  });
}

export function useProductOptionGroups(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-option-groups", productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data: productGroups, error: groupsError } = await supabase
        .from("product_option_groups")
        .select(`
          option_group_id,
          display_order,
          option_group:option_groups(*)
        `)
        .eq("product_id", productId)
        .order("display_order");

      if (groupsError) throw groupsError;

      const optionGroups: OptionGroup[] = [];

      for (const pg of productGroups || []) {
        const group = pg.option_group as unknown as Tables<"option_groups">;
        if (!group || !group.active) continue;

        const { data: options, error: optionsError } = await supabase
          .from("options")
          .select("*")
          .eq("option_group_id", group.id)
          .eq("active", true)
          .order("display_order");

        if (optionsError) throw optionsError;

        optionGroups.push({
          id: group.id,
          name: group.name,
          min_selections: group.min_selections,
          max_selections: group.max_selections,
          is_required: group.is_required,
          display_order: group.display_order,
          options: options || [],
        });
      }

      return optionGroups;
    },
    enabled: !!productId,
  });
}

export function useProductIngredients(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-ingredients", productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from("product_ingredients")
        .select("*")
        .eq("product_id", productId);

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}
