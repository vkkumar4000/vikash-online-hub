import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-enhanced";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export default function ProductsView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [supplierId, setSupplierId] = useState("");

  // Fetch products with supplier info
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, suppliers(name)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (newProduct: { name: string; productCode: string; category: string; price: number; stock: number; unit: string; reorderLevel: number; supplierId: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      // Generate product ID
      const { data: productId, error: idError } = await supabase.rpc("generate_product_id");
      if (idError) throw idError;

      const { data, error } = await supabase
        .from("products")
        .insert({
          product_id: productId,
          product_code: newProduct.productCode || productId,
          name: newProduct.name,
          category: newProduct.category,
          price: newProduct.price,
          stock: newProduct.stock,
          unit: newProduct.unit,
          reorder_level: newProduct.reorderLevel,
          supplier_id: newProduct.supplierId || null,
          user_id: session.session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setName("");
      setProductCode("");
      setCategory("");
      setPrice("");
      setStock("");
      setUnit("pcs");
      setReorderLevel("10");
      setSupplierId("");
      toast({
        title: "Product added",
        description: "Product has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Product removed",
        description: "Product has been removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddProduct = () => {
    if (!name || !category || !price || !stock) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    addProductMutation.mutate({
      name,
      productCode,
      category,
      price: parseFloat(price),
      stock: parseInt(stock),
      unit,
      reorderLevel: parseInt(reorderLevel),
      supplierId,
    });
  };

  const handleRemoveProduct = (id: string) => {
    deleteProductMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-cyber-border">
        <CardHeader>
          <CardTitle className="text-2xl">Add Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productCode">Product Code</Label>
              <Input
                id="productCode"
                placeholder="Auto-generated if empty"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                placeholder="Enter category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <select
                id="supplier"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">Select Supplier (Optional)</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productPrice">Price (₹) *</Label>
              <Input
                id="productPrice"
                type="number"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                type="number"
                placeholder="Enter stock quantity"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level *</Label>
              <Input
                id="reorderLevel"
                type="number"
                placeholder="Minimum stock level"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <select
                id="unit"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilogram</option>
                <option value="ltr">Liter</option>
                <option value="box">Box</option>
                <option value="dozen">Dozen</option>
              </select>
            </div>
          </div>

          <Button 
            onClick={handleAddProduct}
            variant="cyber" 
            className="w-full"
            disabled={addProductMutation.isPending}
          >
            {addProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Product
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-cyber-border">
        <CardHeader>
          <CardTitle>Product List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No products yet. Add your first product above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Min Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: any) => {
                  const isLowStock = product.stock <= product.reorder_level;
                  return (
                    <TableRow key={product.id} className={isLowStock ? "bg-destructive/10" : ""}>
                      <TableCell className="font-medium">{product.product_code || product.product_id}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.suppliers?.name || "-"}</TableCell>
                      <TableCell className="text-right">₹{Number(product.price).toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-semibold ${isLowStock ? "text-destructive" : ""}`}>
                        {product.stock}
                        {isLowStock && " ⚠️"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{product.reorder_level}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveProduct(product.id)}
                            disabled={deleteProductMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
