import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-enhanced";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

export default function ProductsView() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const handleAddProduct = () => {
    if (!name || !price || !stock) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const productId = `PROD${String(products.length + 1).padStart(3, '0')}`;
    const newProduct: Product = {
      id: productId,
      name,
      category,
      price: parseFloat(price),
      stock: parseInt(stock),
    };

    setProducts([...products, newProduct]);
    setName("");
    setCategory("");
    setPrice("");
    setStock("");

    toast({
      title: "Product added",
      description: "Product has been added successfully",
    });
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(products.filter(product => product.id !== id));
    toast({
      title: "Product removed",
      description: "Product has been removed",
    });
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
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="Enter category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
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
          </div>

          <Button 
            onClick={handleAddProduct}
            variant="cyber" 
            className="w-full"
          >
            Add Product
          </Button>
        </CardContent>
      </Card>

      {products.length > 0 && (
        <Card className="bg-gradient-card border-cyber-border">
          <CardHeader>
            <CardTitle>Product List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{product.stock}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
