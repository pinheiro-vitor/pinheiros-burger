import { motion } from "framer-motion";
import { Receipt, MapPin, Phone, User, Music } from "lucide-react";

interface TicketReceiptProps {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    items: any[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    paymentMethod: string;
}

export function TicketReceipt({
    customerName,
    customerPhone,
    customerAddress,
    items,
    subtotal,
    deliveryFee,
    total,
    paymentMethod,
}: TicketReceiptProps) {
    const formatPrice = (price: number) => {
        return price.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    };

    return (
        <div className="w-full max-w-sm mx-auto bg-white text-black font-mono text-sm shadow-2xl transform rotate-1">
            {/* Top Section - "Admit One" style */}
            <div className="bg-black text-white p-4 text-center border-b-2 border-dashed border-white/50 relative">
                <div className="absolute top-1/2 left-0 w-4 h-4 bg-[#1a1a1a] rounded-full translate-x-[-50%] translate-y-[-50%]" />
                <div className="absolute top-1/2 right-0 w-4 h-4 bg-[#1a1a1a] rounded-full translate-x-[50%] translate-y-[-50%]" />

                <h2 className="text-2xl font-black tracking-tighter uppercase">Pinheiros Burguer</h2>
                <p className="text-xs tracking-widest uppercase opacity-70">Rock & Burger Experience</p>
                <div className="mt-2 flex justify-center items-center gap-2">
                    <Music className="w-4 h-4 animate-bounce" />
                    <span className="font-bold">PEDIDO CONFIRMADO</span>
                    <Music className="w-4 h-4 animate-bounce" />
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 space-y-4 relative bg-[#f0f0f0] pattern-dots pattern-black/5 pattern-bg-white pattern-size-4 pattern-opacity-10">

                {/* Customer Info */}
                <div className="space-y-2 border-b border-black/10 pb-4">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-bold">{customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{customerPhone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span className="leading-tight">{customerAddress}</span>
                    </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                    <p className="font-bold uppercase text-xs text-black/50 mb-2">Line-up (Itens)</p>
                    {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-sm">
                            <div>
                                <span className="font-bold">{item.quantity}x</span> {item.name}
                            </div>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="border-t-2 border-dashed border-black/20 pt-4 space-y-1">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Taxa de Entrega</span>
                        <span>{formatPrice(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black mt-2 pt-2 border-t border-black">
                        <span>TOTAL</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                    <p className="text-xs text-right mt-1 capitalize">
                        Pagamento: {paymentMethod === 'cartao' ? 'Cartão' : paymentMethod}
                    </p>
                </div>

                {/* Barcode Mockup */}
                <div className="pt-6 text-center">
                    <div className="h-12 bg-repeat-x bg-[length:4px_100%] bg-[linear-gradient(90deg,black_1px,transparent_0)] mx-auto w-3/4 opacity-80"></div>
                    <p className="text-[10px] tracking-[0.5em] mt-1 font-bold">{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                </div>

            </div>

            {/* Tear-off Section */}
            <div className="bg-yellow-400 p-4 border-t-2 border-dashed border-black/20 text-center relative overflow-hidden">
                <div className="absolute -top-3 left-2 w-6 h-6 bg-[#1a1a1a] rounded-full" />
                <div className="absolute -top-3 right-2 w-6 h-6 bg-[#1a1a1a] rounded-full" />

                <p className="text-xs font-bold uppercase transform -rotate-1">Keep Rocking!</p>
                <p className="text-[10px] opacity-70">Agradecemos a preferência 🤘</p>
            </div>
        </div>
    );
}
