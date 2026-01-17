import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useStoreStatus } from "@/hooks/useStoreStatus";

export default function Welcome() {
    const navigate = useNavigate();
    const { status } = useStoreStatus();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
            <div className="w-full max-w-md space-y-8 text-center">
                {/* Logo Area */}
                <div className="space-y-4">
                    <div className="mx-auto w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <img
                            src="/lovable-uploads/pinheiros-logo.png"
                            alt="Pinheiros Burguer"
                            className="w-28 h-28 object-contain"
                            onError={(e) => {
                                e.currentTarget.src = "https://placehold.co/150x150/16a34a/ffffff?text=PB";
                            }}
                        />
                    </div>

                    <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
                        Pinheiro's Burger
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Peça sua comida favorita!
                    </p>

                    <div className="flex justify-center gap-3 items-center mt-4">
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
                            🍔 Hamburgueria
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${status.isOpen
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                            {status.isOpen ? "🕒 Aberto" : "🕒 Fechado"}
                        </span>
                    </div>
                </div>

                {/* Action Area */}
                <div className="space-y-6 pt-8">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-4">
                            Faça login e peça com mais agilidade
                        </p>

                        <Button
                            variant="outline"
                            className="w-full py-6 text-base font-medium relative border-border hover:bg-secondary/50"
                            onClick={() => navigate("/auth")}
                        >
                            <Mail className="w-5 h-5 absolute left-4" />
                            Continuar com e-mail
                        </Button>

                        {/* 
            <Button 
                variant="outline" 
                className="w-full py-6 text-base font-medium relative border-border hover:bg-secondary/50"
                disabled
            >
                <svg className="w-5 h-5 absolute left-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.51 19.27 5 16.51 5 12s3.51-7.27 7.14-7.27c1.61 0 3.39.6 4.4 1.58l2.64-2.7C17.55 1.99 15.02 1 12.14 1 5.44 1 0 6.63 0 13.5S5.44 26 12.14 26c6.12 0 10.9-4.17 10.9-10.9 0-.77-.1-1.35-.29-2z" />
                </svg>
                Continuar com Google
            </Button>
            */}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                ou
                            </span>
                        </div>
                    </div>

                    <Button
                        className="w-full py-6 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                        onClick={() => navigate("/cardapio")}
                    >
                        Ver cardápio
                    </Button>
                </div>
            </div>
        </div>
    );
}
