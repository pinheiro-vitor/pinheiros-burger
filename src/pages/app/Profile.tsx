import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CustomerProfile() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        address: ""
    });

    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("full_name, phone, address")
                    .eq("user_id", user.id)
                    .single();

                if (data) {
                    setFormData({
                        full_name: data.full_name || "",
                        phone: data.phone || "",
                        address: data.address || ""
                    });
                }
            };
            fetchProfile();
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update(formData)
                .eq("user_id", user.id);

            if (error) throw error;
            toast.success("Perfil atualizado com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar perfil.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="mx-auto max-w-lg space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/cardapio")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-display text-2xl">Meus Dados</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Informações Pessoais
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Nome Completo</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Seu nome"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">WhatsApp / Telefone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="(11) 99999-9999"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço Padrão</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Rua Exemplo, 123 - Bairro"
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                <Save className="mr-2 h-4 w-4" />
                                {loading ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
