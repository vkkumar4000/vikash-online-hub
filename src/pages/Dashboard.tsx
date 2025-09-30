import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-enhanced";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Clock, Monitor, CreditCard, User as UserIcon, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BillingItem {
  id: string;
  productName: string;
  qty: number;
  price: number;
  subtotal: number;
  tax: number;
  total: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Billing state
  const [customerName, setCustomerName] = useState("");
  const [productName, setProductName] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [items, setItems] = useState<BillingItem[]>([]);

  const TAX_RATE = 0.18; // 18% GST

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAddItem = () => {
    if (!productName || !qty || !price) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseFloat(qty);
    const priceValue = parseFloat(price);
    const subtotal = quantity * priceValue;
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const newItem: BillingItem = {
      id: Date.now().toString(),
      productName,
      qty: quantity,
      price: priceValue,
      subtotal,
      tax,
      total,
    };

    setItems([...items, newItem]);
    setProductName("");
    setQty("");
    setPrice("");

    toast({
      title: "Item added",
      description: "Item has been added to the bill",
    });
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const getTotalTax = () => {
    return items.reduce((sum, item) => sum + item.tax, 0);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Logout failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logged out successfully",
          description: "See you next time!",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-cyber-border bg-cyber-card/50 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-text bg-clip-text text-transparent">
            Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground">Welcome, {user?.email}</span>
            <Button variant="glow" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Quick Stats */}
          <Card className="bg-gradient-card border-cyber-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Session</CardTitle>
              <Clock className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">2h 34m</div>
              <p className="text-xs text-muted-foreground">Current gaming session</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-cyber-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Station</CardTitle>
              <Monitor className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">PC-07</div>
              <p className="text-xs text-muted-foreground">Gaming Pro Station</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-cyber-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Credits</CardTitle>
              <CreditCard className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₹150</div>
              <p className="text-xs text-muted-foreground">Available balance</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-cyber-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <UserIcon className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">Gold</div>
              <p className="text-xs text-muted-foreground">Member status</p>
            </CardContent>
          </Card>
        </div>

        {/* Billing Section */}
        <div className="space-y-6">
          <Card className="bg-gradient-card border-cyber-border">
            <CardHeader>
              <CardTitle className="text-2xl">Create Bill</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product/Service</Label>
                  <Input
                    id="productName"
                    placeholder="Product name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    placeholder="Qty"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="Price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    onClick={handleAddItem}
                    variant="cyber" 
                    className="w-full"
                  >
                    Add Item
                  </Button>
                </div>
              </div>

              {qty && price && (
                <div className="p-4 bg-cyber-card/30 rounded-lg border border-cyber-border mb-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Subtotal</p>
                      <p className="text-lg font-bold text-primary">
                        ₹{(parseFloat(qty) * parseFloat(price)).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tax (18%)</p>
                      <p className="text-lg font-bold text-primary">
                        ₹{(parseFloat(qty) * parseFloat(price) * TAX_RATE).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="text-lg font-bold text-primary">
                        ₹{(parseFloat(qty) * parseFloat(price) * (1 + TAX_RATE)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Table */}
          {items.length > 0 && (
            <Card className="bg-gradient-card border-cyber-border">
              <CardHeader>
                <CardTitle>Bill Items</CardTitle>
                {customerName && (
                  <p className="text-muted-foreground">Customer: {customerName}</p>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product/Service</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Tax (18%)</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-right">{item.qty}</TableCell>
                        <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{item.subtotal.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{item.tax.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          ₹{item.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Total Summary */}
                <div className="mt-6 flex justify-end">
                  <div className="w-full md:w-1/3 space-y-2 p-4 bg-cyber-card/30 rounded-lg border border-cyber-border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Tax:</span>
                      <span className="font-semibold">₹{getTotalTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg border-t border-cyber-border pt-2">
                      <span className="font-bold">Grand Total:</span>
                      <span className="font-bold text-primary">₹{getTotalAmount().toFixed(2)}</span>
                    </div>
                    <Button variant="glow" className="w-full mt-4">
                      Generate Bill
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}