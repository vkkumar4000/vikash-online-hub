import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-enhanced";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Download, LogOut, User as UserIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";

export default function CustomerPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in via Supabase auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setIsLoggedIn(true);
        fetchCustomerId(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        setIsLoggedIn(true);
        fetchCustomerId(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setCustomerId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCustomerId = async (userId: string) => {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .single();
    
    if (data) {
      setCustomerId(data.id);
    }
  };

  const { data: customer } = useQuery({
    queryKey: ["customer-info", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

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

  const downloadBillPDF = (billId: string) => {
    const bill = bills?.find(b => b.id === billId);
    if (!bill) return;

    // Create a simple text-based receipt
    const billContent = `
===========================================
              BILL RECEIPT
===========================================
Bill Number: ${bill.bill_number}
Date: ${new Date(bill.bill_date).toLocaleDateString()}
Customer: ${customer?.name || "N/A"}
Phone: ${customer?.phone || "N/A"}
-------------------------------------------
Items:
${bill.bill_items.map((item: any) => 
  `${item.product_name} x ${item.quantity} @ ₹${Number(item.unit_price).toFixed(2)} = ₹${Number(item.total_price).toFixed(2)}`
).join('\n')}
-------------------------------------------
Subtotal:        ₹${Number(bill.subtotal).toFixed(2)}
Discount:        ₹${Number(bill.discount_amount).toFixed(2)}
Tax:             ₹${Number(bill.tax_amount).toFixed(2)}
-------------------------------------------
TOTAL:           ₹${Number(bill.total_amount).toFixed(2)}
===========================================
Notes: ${bill.notes || "N/A"}
===========================================
    `;

    // Create and download as text file
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bill-${bill.bill_number}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Downloaded",
      description: "Bill has been downloaded",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUser(null);
    setCustomerId(null);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/auth");
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
            <CardTitle className="text-2xl text-center text-primary">Customer Portal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <UserIcon className="w-16 h-16 mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground mb-4">
                Please log in to view your bills and payment history
              </p>
              <Button variant="glow" onClick={() => navigate("/auth")} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-cyber-border bg-cyber-card/50 backdrop-blur-md flex items-center px-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold bg-gradient-text bg-clip-text text-transparent">
            Customer Portal
          </h1>
          {customer && (
            <p className="text-sm text-muted-foreground">Welcome, {customer.name}</p>
          )}
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Customer Info Card */}
        {customer && (
          <Card className="bg-gradient-card border-cyber-border">
            <CardHeader>
              <CardTitle className="text-primary">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer ID</p>
                  <p className="font-semibold">{customer.customer_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{customer.email || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadBillPDF(bill.id)}
                            >
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
