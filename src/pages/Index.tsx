import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { CategoryNav } from "@/components/CategoryNav";
import { MenuSection } from "@/components/MenuSection";
import { Cart } from "@/components/Cart";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";
import { menuItems, categories } from "@/data/menu";

function MenuContent() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Update active category based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = categories.map((cat) => ({
        id: cat.id,
        element: document.getElementById(cat.id),
      }));

      for (const section of sections) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom > 150) {
            setActiveCategory(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <CategoryNav
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-12">
          {categories.map((category) => (
            <MenuSection
              key={category.id}
              categoryId={category.id}
              items={menuItems.filter((item) => item.category === category.id)}
            />
          ))}
        </div>
      </main>

      <Cart />
      <Footer />
    </div>
  );
}

export default function Index() {
  return (
    <CartProvider>
      <MenuContent />
    </CartProvider>
  );
}
