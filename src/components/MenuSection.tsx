import { MenuItem, Category } from "@/types/menu";
import { MenuCard } from "./MenuCard";


interface MenuSectionProps {
  category: Category;
  items: MenuItem[];
}

export function MenuSection({ category, items }: MenuSectionProps) {

  if (items.length === 0) return null;

  return (
    <section id={category.id} className="scroll-mt-20">
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
