import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-enhanced";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Download, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function CustomerPortal() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const customerData = sessionStorage.getItem("customerPortalId");
    if (customerData) {
      setCustomerId(customerData);
      setIsLoggedIn(true);
    }
  }, []);

  const { data: bills } = useQuery({
    queryKey: ["customer-bills", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from("bills")
        .select("*, bill_items(*)")
        .eq("customer_id", customerId)
        .order("bill_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const { data: payments } = useQuery({
    queryKey: ["customer-payments", customerId],
    queryFn: async () => {
      if (!customerId) return [];

      const billIds = bills?.map(b => b.id) || [];
      if (billIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .in("bill_id", billIds)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!customerId && !!bills,
  });

  const handleLogin = async () => {
    try {
      // This is a simplified login - in production, use proper password hashing
      const { data: credentials, error } = await supabase
        .from("customer_credentials")
        .select("*, customers(*)")
        .eq("username", username)
        .eq("is_active", true)
        .single();

      if (error || !credentials) {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
        return;
      }

      // In production, verify password hash here
      // For now, storing password as plain text (NOT SECURE - implement proper hashing)
      if (credentials.password_hash !== password) {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
        return;
      }

      // Update last login
      await supabase
        .from("customer_credentials")
        .update({ last_login: new Date().toISOString() })
        .eq("id", credentials.id);

      sessionStorage.setItem("customerPortalId", credentials.customer_id);
      setCustomerId(credentials.customer_id);
      setIsLoggedIn(true);

      toast({
        title: "Welcome!",
        description: `Hello ${credentials.customers.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("customerPortalId");
    setIsLoggedIn(false);
    setCustomerId(null);
    setUsername("");
    setPassword("");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const getPendingAmount = (billId: string) => {
    const bill = bills?.find(b => b.id === billId);
    if (!bill) return 0;

    const totalPaid = payments?.filter(p => p.bill_id === billId)
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    return Number(bill.total_amount) - totalPaid;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md bg-gradient-card border-cyber-border">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-primary">Customer Portal Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Username</label>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <Button variant="glow" onClick={handleLogin} className="w-full">
              Login
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Contact admin for login credentials
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-cyber-border bg-cyber-card/50 backdrop-blur-md flex items-center px-4">
        <h1 className="text-2xl font-bold bg-gradient-text bg-clip-text text-transparent flex-1">
          Customer Portal
        </h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Bills Section */}
        <Card className="bg-gradient-card border-cyber-border">
          <CardHeader>
            <CardTitle className="text-primary">My Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {!bills || bills.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No bills found</p>
            ) : (
              <div className="border border-cyber-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Pending Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill) => {
                      const pending = getPendingAmount(bill.id);
                      return (
                        <TableRow key={bill.id}>
                          <TableCell>{bill.bill_number}</TableCell>
                          <TableCell>
                            {new Date(bill.bill_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>₹{Number(bill.total_amount).toFixed(2)}</TableCell>
                          <TableCell className={pending > 0 ? "text-orange-500" : "text-green-500"}>
                            ₹{pending.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              bill.status === "unpaid" ? "bg-red-500/20 text-red-500" :
                              bill.status === "partial" ? "bg-orange-500/20 text-orange-500" :
                              "bg-green-500/20 text-green-500"
                            }`}>
                              {bill.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="bg-gradient-card border-cyber-border">
          <CardHeader>
            <CardTitle className="text-primary">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {!payments || payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No payments recorded</p>
            ) : (
              <div className="border border-cyber-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-green-500 font-semibold">
                          ₹{Number(payment.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="capitalize">{payment.payment_mode}</TableCell>
                        <TableCell>{payment.reference_number || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
