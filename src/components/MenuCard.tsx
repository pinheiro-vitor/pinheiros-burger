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
  const { items, updateQuantity } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking add button
    navigate(`/produto/${item.id}`);
  };

  const handleUpdateQuantity = (e: React.MouseEvent, qty: number) => {
    e.stopPropagation();
    updateQuantity(item.id, qty);
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
      onClick={() => navigate(`/produto/${item.id}`)}
      className="group relative overflow-hidden rounded-xl bg-card border border-border p-4 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 cursor-pointer flex gap-4"
    >
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-lg sm:text-xl tracking-wide text-card-foreground">
            {item.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="font-display text-xl text-primary">
            {formatPrice(item.price)}
          </p>

          {/* Mobile Layout: Controls often better placed here or near price if space permits */}
        </div>
      </div>

      <div className="flex flex-col items-end gap-3">
        {item.image_url ? (
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-lg">
            <img
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 rounded-lg bg-secondary/30 flex items-center justify-center">
            <span className="text-2xl opacity-20">🍔</span>
          </div>
        )}

        <div className="z-10" onClick={(e) => e.stopPropagation()}>
          {quantity === 0 ? (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={isAdding ? { scale: [1, 1.2, 1] } : {}}
              onClick={handleAdd}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform"
            >
              <Plus className="h-5 w-5" />
            </motion.button>
          ) : (
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-sm border border-border">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleUpdateQuantity(e, quantity - 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
              >
                <Minus className="h-3 w-3" />
              </motion.button>
              <span className="w-4 text-center font-display text-sm font-bold">
                {quantity}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAdd}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Plus className="h-3 w-3" />
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
