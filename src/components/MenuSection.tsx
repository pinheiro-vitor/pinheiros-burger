import { MenuItem } from "@/types/menu";
import { MenuCard } from "./MenuCard";
import { categories } from "@/data/menu";

interface MenuSectionProps {
  categoryId: string;
  items: MenuItem[];
}

export function MenuSection({ categoryId, items }: MenuSectionProps) {
  const category = categories.find((c) => c.id === categoryId);
  
  if (!category || items.length === 0) return null;

  return (
    <section id={categoryId} className="scroll-mt-20">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">{category.icon}</span>
        <h2 className="font-display text-3xl tracking-wider text-foreground">
          {category.name.toUpperCase()}
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item, index) => (
          <MenuCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}
