import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Plus, Minus, Send, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

// Substitua pelo número de WhatsApp da hamburgueria (com código do país)
const WHATSAPP_NUMBER = "5511999999999";

export function Cart() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } =
    useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleSendOrder = () => {
    if (items.length === 0) return;
    
    const orderItems = items
      .map(
        (item) =>
          `• ${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}${
            item.observations ? `\n   _Obs: ${item.observations}_` : ""
          }`
      )
      .join("\n");

    const message = `🍔 *NOVO PEDIDO - PINHEIRO'S BURGER* 🎸

${customerName ? `*Cliente:* ${customerName}\n` : ""}${customerAddress ? `*Endereço:* ${customerAddress}\n` : ""}
*ITENS:*
${orderItems}

*TOTAL: ${formatPrice(totalPrice)}*

*Pagamento:* ${paymentMethod === "pix" ? "PIX" : paymentMethod === "cartao" ? "Cartão" : "Dinheiro"}

Obrigado pela preferência! 🤘`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, "_blank");
    
    clearCart();
    setIsOpen(false);
    setCustomerName("");
    setCustomerAddress("");
  };

  return (
    <>
      {/* Floating cart button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40"
      >
        <ShoppingBag className="h-6 w-6" />
        {totalItems > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-accent-foreground"
          >
            {totalItems}
          </motion.span>
        )}
      </motion.button>

      {/* Cart drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col bg-background border-l border-border"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="font-display text-2xl tracking-wider">
                  SEU PEDIDO
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                    <ShoppingBag className="h-16 w-16 opacity-30" />
                    <p className="mt-4 text-center">
                      Seu carrinho está vazio.
                      <br />
                      Adicione alguns lanches!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="rounded-lg bg-card border border-border p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(item.price)} cada
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-6 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <span className="font-display text-lg text-primary">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </motion.div>
                    ))}

                    {/* Customer info */}
                    <div className="space-y-3 border-t border-border pt-4">
                      <input
                        type="text"
                        placeholder="Seu nome"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full rounded-lg bg-input border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Endereço de entrega"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full rounded-lg bg-input border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                      />
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full rounded-lg bg-input border border-border px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="pix">PIX</option>
                        <option value="cartao">Cartão</option>
                        <option value="dinheiro">Dinheiro</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-border p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-display text-3xl text-primary">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendOrder}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 font-display text-lg tracking-wider text-white shadow-lg shadow-green-600/30"
                  >
                    <Send className="h-5 w-5" />
                    ENVIAR PEDIDO VIA WHATSAPP
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
