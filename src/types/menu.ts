export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  active?: boolean;
  display_order?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  observations?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  display_order?: number;
  active?: boolean;
}
