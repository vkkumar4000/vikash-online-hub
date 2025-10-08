import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Package } from "lucide-react";

export default function LowStockAlerts() {
  const { data: products = [] } = useQuery({
    queryKey: ["low-stock-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("stock", { ascending: true });
      
      if (error) throw error;
      
      // Filter products where stock is at or below reorder level
      return data.filter(product => product.stock <= product.reorder_level);
    },
  });

  if (products.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-card border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          Low Stock Alerts ({products.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {products.map((product) => (
          <Alert key={product.id} variant="destructive" className="border-destructive/30">
            <Package className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <span className="font-semibold">{product.name}</span> is running low on stock!
              <br />
              <span className="text-sm">
                Current: <span className="font-bold">{product.stock}</span> {product.unit} | 
                Minimum: {product.reorder_level} {product.unit}
              </span>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
