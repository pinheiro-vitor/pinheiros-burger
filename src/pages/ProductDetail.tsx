import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Minus, Check } from "lucide-react";
import { useProduct, useProductOptionGroups, useProductIngredients, OptionGroup, Option } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CartProvider } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface SelectedOption {
  optionId: string;
  optionName: string;
  price: number;
  groupId: string;
}

function ProductDetailContent() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const { data: product, isLoading: productLoading } = useProduct(productId);
  const { data: optionGroups = [], isLoading: groupsLoading } = useProductOptionGroups(productId);
  const { data: ingredients = [] } = useProductIngredients(productId);

  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const totalExtras = useMemo(() => {
    return selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
  }, [selectedOptions]);

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    return (product.price + totalExtras) * quantity;
  }, [product, totalExtras, quantity]);

  const handleOptionToggle = (group: OptionGroup, option: Option) => {
    setSelectedOptions((prev) => {
      const existingInGroup = prev.filter((o) => o.groupId === group.id);
      const isSelected = existingInGroup.some((o) => o.optionId === option.id);

      if (isSelected) {
        // Remove the option
        return prev.filter((o) => o.optionId !== option.id);
      }

      // For single selection groups (radio), replace existing
      if (group.max_selections === 1) {
        const filtered = prev.filter((o) => o.groupId !== group.id);
        return [
          ...filtered,
          {
            optionId: option.id,
            optionName: option.name,
            price: option.price,
            groupId: group.id,
          },
        ];
      }

      // For multi-selection, check if max is reached
      if (existingInGroup.length >= group.max_selections) {
        return prev;
      }

      return [
        ...prev,
        {
          optionId: option.id,
          optionName: option.name,
          price: option.price,
          groupId: group.id,
        },
      ];
    });
  };

  const isOptionSelected = (optionId: string) => {
    return selectedOptions.some((o) => o.optionId === optionId);
  };

  const toggleIngredient = (ingredientId: string) => {
    setRemovedIngredients((prev) =>
      prev.includes(ingredientId)
        ? prev.filter((id) => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const isValid = useMemo(() => {
    for (const group of optionGroups) {
      if (group.is_required) {
        const selectedInGroup = selectedOptions.filter((o) => o.groupId === group.id);
        if (selectedInGroup.length < group.min_selections) {
          return false;
        }
      }
    }
    return true;
  }, [optionGroups, selectedOptions]);

  const handleAddToCart = () => {
    if (!product || !isValid) return;

    const customizations = {
      selectedOptions,
      removedIngredients,
      observations,
    };

    addItem(
      {
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: product.price + totalExtras,
        category: product.category_id || "",
        image: product.image_url || undefined,
      },
      quantity,
      JSON.stringify(customizations)
    );

    navigate("/");
  };

  if (productLoading || groupsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto">
          <Skeleton className="h-64 w-full" />
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Produto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-center font-semibold">Detalhe do produto</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Product Image */}
      {product.image_url && (
        <div className="relative">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Product Info */}
      <div className="px-4 py-4 border-b border-border">
        <h2 className="font-display text-2xl tracking-wide">{product.name}</h2>
        {product.description && (
          <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
        )}
        <p className="mt-2 font-display text-2xl text-primary">
          {formatPrice(product.price)}
        </p>
      </div>

      {/* Option Groups */}
      <div className="divide-y divide-border">
        {optionGroups.map((group) => (
          <motion.section
            key={group.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold uppercase text-sm">
                  {group.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {group.max_selections === 1
                    ? "Escolha 1 opção"
                    : `Escolha até ${group.max_selections} opções`}
                </p>
              </div>
              {group.is_required && (
                <Badge variant="secondary" className="text-xs">
                  Obrigatório
                </Badge>
              )}
            </div>

            {group.max_selections === 1 ? (
              <RadioGroup
                value={
                  selectedOptions.find((o) => o.groupId === group.id)?.optionId || ""
                }
                onValueChange={(value) => {
                  const option = group.options.find((o) => o.id === value);
                  if (option) handleOptionToggle(group, option);
                }}
              >
                {group.options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label
                        htmlFor={option.id}
                        className="cursor-pointer flex-1"
                      >
                        <span className="block text-sm">{option.name}</span>
                        {option.price > 0 && (
                          <span className="text-xs text-primary">
                            +{formatPrice(option.price)}
                          </span>
                        )}
                      </Label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-0">
                {group.options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm">{option.name}</p>
                      {option.price > 0 && (
                        <p className="text-xs text-primary">
                          +{formatPrice(option.price)}
                        </p>
                      )}
                    </div>
                    <Checkbox
                      checked={isOptionSelected(option.id)}
                      onCheckedChange={() => handleOptionToggle(group, option)}
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        ))}

        {/* Remove Ingredients */}
        {ingredients.filter((i) => i.removable).length > 0 && (
          <section className="px-4 py-4">
            <h3 className="font-semibold uppercase text-sm mb-3">
              Remover ingredientes
            </h3>
            <div className="space-y-0">
              {ingredients
                .filter((i) => i.removable)
                .map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <span className="text-sm">{ingredient.name}</span>
                    <Checkbox
                      checked={removedIngredients.includes(ingredient.id)}
                      onCheckedChange={() => toggleIngredient(ingredient.id)}
                    />
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Observations */}
        <section className="px-4 py-4">
          <h3 className="font-semibold uppercase text-sm mb-3">Observações</h3>
          <Textarea
            placeholder="Digite as observações aqui..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            maxLength={180}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">
            {observations.length}/180
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Converse diretamente com o estabelecimento caso queira modificar
            algum item. Neste campo não são aceitas modificações que podem gerar
            cobrança adicional.
          </p>
        </section>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="flex items-center gap-3 bg-secondary rounded-full px-3 py-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-1 hover:bg-accent rounded-full transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="font-semibold w-6 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1 hover:bg-accent rounded-full transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!isValid}
            className="flex-1 h-12 text-base font-semibold"
          >
            Adicionar {formatPrice(totalPrice)}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  return (
    <CartProvider>
      <ProductDetailContent />
    </CartProvider>
  );
}
