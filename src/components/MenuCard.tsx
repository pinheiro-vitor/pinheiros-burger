import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { MenuItem } from "@/types/menu";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface MenuCardProps {
  item: MenuItem;
  index: number;
}

export function MenuCard({ item, index }: MenuCardProps) {
  const navigate = useNavigate();
  const { addItem, items, updateQuantity, removeItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  
  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    // Navigate to product detail for customization
    navigate(`/produto/${item.id}`);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative overflow-hidden rounded-xl bg-card border border-border p-4 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="flex justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-display text-xl tracking-wide text-card-foreground">
            {item.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
          <p className="mt-3 font-display text-2xl text-primary">
            {formatPrice(item.price)}
          </p>
        </div>

        <div className="flex flex-col items-end justify-between">
          {quantity === 0 ? (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={isAdding ? { scale: [1, 1.2, 1] } : {}}
              onClick={handleAdd}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform"
            >
              <Plus className="h-5 w-5" />
            </motion.button>
          ) : (
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
              >
                <Minus className="h-4 w-4" />
              </motion.button>
              <span className="w-6 text-center font-display text-lg">
                {quantity}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAdd}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Fire decoration on hover */}
      <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-gradient-to-br from-fire to-fire-glow opacity-0 blur-2xl transition-opacity group-hover:opacity-30" />
    </motion.article>
  );
}
