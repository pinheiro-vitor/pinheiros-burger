import { motion } from "framer-motion";
import { Category } from "@/types/menu";

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export function CategoryNav({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryNavProps) {
  return (
    <nav className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(category.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </nav>
  );
}
