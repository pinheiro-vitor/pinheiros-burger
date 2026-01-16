import { MenuItem, Category } from "@/types/menu";

export const categories: Category[] = [
  { id: "burgers", name: "Burgers", icon: "🍔" },
  { id: "combos", name: "Combos", icon: "🎸" },
  { id: "porcoes", name: "Porções", icon: "🍟" },
  { id: "bebidas", name: "Bebidas", icon: "🥤" },
];

export const menuItems: MenuItem[] = [
  // Burgers
  {
    id: "1",
    name: "Classic Rock Burger",
    description: "Pão brioche, blend 180g, queijo cheddar, alface, tomate e molho especial",
    price: 28.90,
    category: "burgers",
  },
  {
    id: "2",
    name: "Heavy Metal",
    description: "Pão brioche, duplo blend 360g, queijo cheddar duplo, bacon crocante e cebola caramelizada",
    price: 42.90,
    category: "burgers",
  },
  {
    id: "3",
    name: "Punk Rock",
    description: "Pão brioche, blend 180g, queijo cheddar, jalapeño, bacon e molho de pimenta",
    price: 34.90,
    category: "burgers",
  },
  {
    id: "4",
    name: "Acoustic",
    description: "Pão brioche, blend 180g, queijo mussarela, cogumelos salteados e rúcula",
    price: 32.90,
    category: "burgers",
  },
  {
    id: "5",
    name: "Grunge Bacon",
    description: "Pão brioche, blend 180g, queijo cheddar, muito bacon, ovo e maionese defumada",
    price: 36.90,
    category: "burgers",
  },
  {
    id: "6",
    name: "Blues Burger",
    description: "Pão brioche, blend 180g, queijo gorgonzola, cebola crispy e mel",
    price: 38.90,
    category: "burgers",
  },
  // Combos
  {
    id: "7",
    name: "Combo Rock Star",
    description: "Classic Rock Burger + Batata Frita + Refrigerante",
    price: 45.90,
    category: "combos",
  },
  {
    id: "8",
    name: "Combo Headbanger",
    description: "Heavy Metal + Onion Rings + Milk Shake",
    price: 62.90,
    category: "combos",
  },
  {
    id: "9",
    name: "Combo Roadie",
    description: "Punk Rock + Batata Frita + Refrigerante",
    price: 52.90,
    category: "combos",
  },
  // Porções
  {
    id: "10",
    name: "Batata Frita",
    description: "Porção de batatas fritas crocantes com sal e páprica",
    price: 18.90,
    category: "porcoes",
  },
  {
    id: "11",
    name: "Onion Rings",
    description: "Anéis de cebola empanados e fritos",
    price: 22.90,
    category: "porcoes",
  },
  {
    id: "12",
    name: "Nuggets Rock",
    description: "10 nuggets de frango empanados com molho especial",
    price: 24.90,
    category: "porcoes",
  },
  // Bebidas
  {
    id: "13",
    name: "Refrigerante",
    description: "Coca-Cola, Guaraná ou Sprite - 350ml",
    price: 6.90,
    category: "bebidas",
  },
  {
    id: "14",
    name: "Suco Natural",
    description: "Laranja, Limão ou Abacaxi - 400ml",
    price: 9.90,
    category: "bebidas",
  },
  {
    id: "15",
    name: "Milk Shake",
    description: "Chocolate, Morango ou Ovomaltine - 400ml",
    price: 16.90,
    category: "bebidas",
  },
  {
    id: "16",
    name: "Água Mineral",
    description: "Com ou sem gás - 500ml",
    price: 4.90,
    category: "bebidas",
  },
];
