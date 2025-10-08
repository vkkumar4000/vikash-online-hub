import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-enhanced";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Search } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type Bill = Database["public"]["Tables"]["bills"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

export default function PaymentsView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedBillId, setSelectedBillId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: bills, isLoading: billsLoading } = useQuery({
    queryKey: ["bills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*, customers(name)")
        .order("bill_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, bills(bill_number, customers(name))")
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("payments").insert({
        bill_id: selectedBillId,
        user_id: user.id,
        amount: parseFloat(amount),
        payment_mode: paymentMode,
        reference_number: referenceNumber || null,
        notes: paymentNotes || null,
      });

      if (error) throw error;

      // Update bill status and customer due
      const bill = bills?.find(b => b.id === selectedBillId);
      if (bill) {
        const totalPaid = (payments?.filter(p => p.bill_id === selectedBillId)
          .reduce((sum, p) => sum + Number(p.amount), 0) || 0) + parseFloat(amount);
        
        if (totalPaid >= Number(bill.total_amount)) {
          await supabase
            .from("bills")
            .update({ status: "paid" })
            .eq("id", selectedBillId);
        } else {
          await supabase
            .from("bills")
            .update({ status: "partial" })
            .eq("id", selectedBillId);
        }

        // Update customer total_due
        if (bill.customer_id) {
          const { data: customer } = await supabase
            .from("customers")
            .select("total_due")
            .eq("id", bill.customer_id)
            .single();

          if (customer) {
            const newDue = Number(customer.total_due) - parseFloat(amount);
            await supabase
              .from("customers")
              .update({ total_due: Math.max(0, newDue) })
              .eq("id", bill.customer_id);
          }
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment recorded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setSelectedBillId("");
      setAmount("");
      setReferenceNumber("");
      setPaymentNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddPayment = () => {
    if (!selectedBillId || !amount) {
      toast({
        title: "Missing Information",
        description: "Please select a bill and enter amount",
        variant: "destructive",
      });
      return;
    }

    addPaymentMutation.mutate();
  };

  const getPendingAmount = (billId: string) => {
    const bill = bills?.find(b => b.id === billId);
    if (!bill) return 0;

    const totalPaid = payments?.filter(p => p.bill_id === billId)
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    return Number(bill.total_amount) - totalPaid;
  };

  const filteredBills = bills?.filter(bill => 
    bill.status !== "paid" && (
      bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Add Payment Card */}
      <Card className="bg-gradient-card border-cyber-border">
        <CardHeader>
          <CardTitle className="text-primary">Record Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Bill</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedBillId}
                onChange={(e) => setSelectedBillId(e.target.value)}
              >
                <option value="">Select Bill</option>
                {bills?.filter(b => b.status !== "paid").map((bill) => (
                  <option key={bill.id} value={bill.id}>
                    {bill.bill_number} - {bill.customers?.name || "Walk-in"} - Pending: ₹{getPendingAmount(bill.id).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Amount</label>
              <Input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Payment Mode</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Reference Number</label>
              <Input
                type="text"
                placeholder="Transaction/Cheque Number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Notes</label>
            <Input
              type="text"
              placeholder="Payment notes"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </div>

          <Button
            variant="glow"
            onClick={handleAddPayment}
            disabled={addPaymentMutation.isPending}
            className="w-full"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </CardContent>
      </Card>

      {/* Pending Bills */}
      <Card className="bg-gradient-card border-cyber-border">
        <CardHeader>
          <CardTitle className="text-primary">Pending Bills</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {billsLoading ? (
            <p className="text-muted-foreground text-center py-4">Loading bills...</p>
          ) : filteredBills && filteredBills.length > 0 ? (
            <div className="border border-cyber-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Pending Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => {
                    const pending = getPendingAmount(bill.id);
                    return (
                      <TableRow key={bill.id}>
                        <TableCell>{bill.bill_number}</TableCell>
                        <TableCell>{bill.customers?.name || "Walk-in"}</TableCell>
                        <TableCell>₹{Number(bill.total_amount).toFixed(2)}</TableCell>
                        <TableCell className="text-orange-500 font-semibold">
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
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No pending bills</p>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="bg-gradient-card border-cyber-border">
        <CardHeader>
          <CardTitle className="text-primary">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <p className="text-muted-foreground text-center py-4">Loading payments...</p>
          ) : payments && payments.length > 0 ? (
            <div className="border border-cyber-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{payment.bills?.bill_number}</TableCell>
                      <TableCell>{payment.bills?.customers?.name || "Walk-in"}</TableCell>
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
          ) : (
            <p className="text-muted-foreground text-center py-4">No payments recorded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
