import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { CategoryNav } from "@/components/CategoryNav";
import { MenuSection } from "@/components/MenuSection";
import { Cart } from "@/components/Cart";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";
import { useCategories, useProducts } from "@/hooks/useProducts";

function MenuContent() {
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

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
  }, [categories]);

  if (loadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <CategoryNav
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-12">
          {categories.map((category) => (
            <MenuSection
              key={category.id}
              category={category}
              items={products.filter((item) => item.category_id === category.id)}
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
