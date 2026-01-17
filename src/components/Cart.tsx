import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Plus, Minus, Send, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { useDelivery } from "@/hooks/useDelivery";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Substitua pelo número de WhatsApp da hamburgueria (com código do país)
const WHATSAPP_NUMBER = "5511999999999";

export function Cart() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } =
    useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const { status } = useStoreStatus();
  const { calculateFee, deliveryFee, calculating, isFixedFee } = useDelivery();

  const finalTotal = Math.max(0, totalPrice + (deliveryFee || 0) - discountAmount);

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("active", true)
        .maybeSingle(); // Use maybeSingle to avoid 406 error on no rows

      if (error) throw error;

      if (!data) {
        toast.error("Cupom inválido ou não encontrado.");
        setAppliedCoupon(null);
        setDiscountAmount(0);
        return;
      }

      // Validation Checks
      const now = new Date();
      if (data.expires_at && new Date(data.expires_at) < now) {
        toast.error("Este cupom expirou.");
        return;
      }

      if (data.min_order_value && totalPrice < data.min_order_value) {
        toast.error(`Pedido mínimo para este cupom: ${formatPrice(data.min_order_value)}`);
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast.error("Este cupom atingiu o limite de usos.");
        return;
      }

      // Calculate Discount
      let discount = 0;
      if (data.discount_type === 'percentage') {
        discount = (totalPrice * data.discount_value) / 100;
      } else {
        discount = data.discount_value;
      }

      // Cap discount at total price (free meal but not negative)
      discount = Math.min(discount, totalPrice);

      setDiscountAmount(discount);
      setAppliedCoupon(data);
      toast.success("Voucher aplicado com sucesso! 🤘");
      // Assuming playSound is defined elsewhere or remove this line if not
      // playSound("add"); // Use the 'add' sound for positive feedback

    } catch (err) {
      console.error(err);
      toast.error("Erro ao validar cupom.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleSendOrder = async () => {
    if (items.length === 0) return;

    if (!status.isOpen) {
      toast.error("A loja está fechada no momento.");
      return;
    }

    if (deliveryFee === null) {
      toast.error("Por favor, calcule a taxa de entrega antes de enviar o pedido.");
      return;
    }

    if (!customerName || !customerPhone || !customerAddress) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Prepare Order Data
      const orderPayload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: items as any, // Cast to any to satisfy JSON type
        subtotal: totalPrice,
        discount: discountAmount,
        total: finalTotal, // Includes delivery fee and discount
        status: "pending" as const,
        notes: `${customerAddress} - Pagamento: ${paymentMethod}${appliedCoupon ? ` - CUPOM: ${appliedCoupon.code}` : ''}`
      };

      // 2. Save to Supabase
      const { data, error } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select()
        .single();

      if (error) throw error;

      const orderId = data.id.slice(0, 8).toUpperCase(); // Short ID for easier reading

      // 3. Prepare WhatsApp Message
      const orderItems = items
        .map(
          (item) =>
            `• ${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}${item.observations ? `\n   _Obs: ${item.observations}_` : ""
            }`
        )
        .join("\n");

      const message = `🍔 *PEDIDO O NOVO - #${orderId}* 🎸
      
*Cliente:* ${customerName}
*Telefone:* ${customerPhone}
*Endereço:* ${customerAddress}

*ITENS:*
${orderItems}

*Subtotal:* ${formatPrice(totalPrice)}
*Taxa de Entrega:* ${formatPrice(deliveryFee || 0)}
*TOTAL: ${formatPrice(finalTotal)}*
*Pagamento:* ${paymentMethod === "pix" ? "PIX" : paymentMethod === "cartao" ? "Cartão" : "Dinheiro"}

*ID do Pedido:* ${orderId}

--------------------------------
_Aguarde a confirmação do atendente._ 🤘`;

      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, "_blank");

      toast.success("Pedido enviado com sucesso!");
      clearCart();
      setIsOpen(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Erro ao salvar pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating cart button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-30 flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-colors ${status.isOpen
          ? "bg-primary text-primary-foreground shadow-primary/40"
          : "bg-gray-500 text-white hover:bg-gray-600 grayscale"
          }`}
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
                {!status.isOpen && (
                  <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded-full uppercase ml-2">
                    Loja Fechada
                  </span>
                )}
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
                        type="tel"
                        placeholder="Seu WhatsApp (obrigatório)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full rounded-lg bg-input border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                      />

                      {/* Delivery Calculation */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Endereço de entrega"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          className="flex-1 rounded-lg bg-input border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        />
                        {!isFixedFee && (
                          <button
                            onClick={calculateFee}
                            disabled={calculating}
                            className="px-4 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors border border-border"
                            title="Calcular frete por geolocalização"
                          >
                            {calculating ? (
                              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            ) : (
                              <Send className="h-5 w-5 rotate-[-90deg]" />
                            )}
                          </button>
                        )}
                      </div>

                      {isFixedFee && (
                        <div className="flex items-center gap-2 text-sm text-green-600 font-medium px-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          Taxa de entrega fixa aplicada
                        </div>
                      )}

                      {/* Coupon Section */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Cupom (Voucher VIP)"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          disabled={!!appliedCoupon}
                          className="flex-1 rounded-lg bg-input border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        />
                        {appliedCoupon ? (
                          <button
                            onClick={() => {
                              setAppliedCoupon(null);
                              setCouponCode("");
                              setDiscountAmount(0);
                              // If the applied coupon was for free delivery, reset delivery fee if not fixed by other means
                              if (appliedCoupon.type === "delivery_fee") {
                                setDeliveryFee(null); // Or recalculate if there's a default fee
                                setIsFixedFee(false);
                              }
                              toast.info("Cupom removido.");
                            }}
                            className="px-4 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 font-bold transition-colors"
                          >
                            X
                          </button>
                        ) : (
                          <button
                            onClick={handleValidateCoupon}
                            disabled={!couponCode || isValidatingCoupon}
                            className="px-4 rounded-lg bg-secondary hover:bg-secondary/80 font-bold text-xs uppercase tracking-wide transition-colors border border-border"
                          >
                            {isValidatingCoupon ? "..." : "Aplicar"}
                          </button>
                        )}
                      </div>
                      {appliedCoupon && (
                        <div className="text-xs text-green-600 font-bold px-2 flex justify-between">
                          <span>Voucher aplicado: {appliedCoupon.code}</span>
                          {discountAmount > 0 && <span>-{formatPrice(discountAmount)}</span>}
                        </div>
                      )}

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
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>

                  {deliveryFee !== null && (
                    <div className="mb-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de Entrega</span>
                      <span className="font-medium text-foreground">
                        {formatPrice(deliveryFee)}
                      </span>
                    </div>
                  )}

                  <div className="mb-4 flex items-center justify-between border-t border-dashed border-border pt-4">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-display text-3xl text-primary">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendOrder}
                    disabled={isSubmitting || !status.isOpen}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 font-display text-lg tracking-wider text-white shadow-lg transition-all ${status.isOpen
                      ? "bg-green-600 shadow-green-600/30 hover:bg-green-700"
                      : "bg-gray-400 cursor-not-allowed shadow-gray-400/30"
                      } disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    <Send className="h-5 w-5" />
                    {status.isOpen
                      ? (isSubmitting ? "ENVIANDO..." : "ENVIAR PEDIDO VIA WHATSAPP")
                      : "LOJA FECHADA"}
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
