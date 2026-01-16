import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuCategories } from "@/components/admin/menu/MenuCategories";
import { MenuProducts } from "@/components/admin/menu/MenuProducts";
import { MenuOptionGroups } from "@/components/admin/menu/MenuOptionGroups";

export default function AdminMenu() {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">Cardápio</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="products">Cardápio Principal</TabsTrigger>
            <TabsTrigger value="optionals">Opcionais</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <MenuProducts />
          </TabsContent>

          <TabsContent value="optionals" className="mt-6">
            <MenuOptionGroups />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <MenuCategories />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
