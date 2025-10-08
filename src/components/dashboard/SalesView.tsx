import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-enhanced";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Printer, Check, ChevronsUpDown } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Customer = Database["public"]["Tables"]["customers"]["Row"];

interface BillItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function SalesView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("18");
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [notes, setNotes] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Customer[];
    },
  });

  const createBillMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: billNumber } = await supabase.rpc('generate_bill_number');
      
      const subtotal = billItems.reduce((sum, item) => sum + item.total_price, 0);
      const discountAmount = (subtotal * parseFloat(discount)) / 100;
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = (taxableAmount * parseFloat(taxRate)) / 100;
      const totalAmount = taxableAmount + taxAmount;

      // Create bill
      const { data: bill, error: billError } = await supabase
        .from("bills")
        .insert({
          bill_number: billNumber,
          customer_id: selectedCustomerId || null,
          user_id: user.id,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          status: "unpaid",
          notes,
        })
        .select()
        .single();

      if (billError) throw billError;

      // Create bill items
      const billItemsToInsert = billItems.map(item => ({
        bill_id: bill.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from("bill_items")
        .insert(billItemsToInsert);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of billItems) {
        const product = products?.find(p => p.id === item.product_id);
        if (product) {
          await supabase
            .from("products")
            .update({ stock: product.stock - item.quantity })
            .eq("id", item.product_id);
        }
      }

      // Update customer total_due
      if (selectedCustomerId) {
        const { data: customer } = await supabase
          .from("customers")
          .select("total_due")
          .eq("id", selectedCustomerId)
          .single();

        if (customer) {
          await supabase
            .from("customers")
            .update({ total_due: Number(customer.total_due) + totalAmount })
            .eq("id", selectedCustomerId);
        }
      }

      return bill;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bill created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setBillItems([]);
      setSelectedCustomerId("");
      setDiscount("0");
      setNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    if (!selectedProductId || !quantity) {
      toast({
        title: "Missing Information",
        description: "Please select a product and enter quantity",
        variant: "destructive",
      });
      return;
    }

    const product = products?.find(p => p.id === selectedProductId);
    if (!product) return;

    if (product.stock < parseInt(quantity)) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stock} units available`,
        variant: "destructive",
      });
      return;
    }

    const newItem: BillItem = {
      id: Math.random().toString(),
      product_id: product.id,
      product_name: product.name,
      quantity: parseInt(quantity),
      unit_price: product.price,
      total_price: product.price * parseInt(quantity),
    };

    setBillItems([...billItems, newItem]);
    setSelectedProductId("");
    setQuantity("");
  };

  const handleRemoveItem = (id: string) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  const handleCreateBill = () => {
    if (billItems.length === 0) {
      toast({
        title: "Empty Bill",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }
    createBillMutation.mutate();
  };

  const subtotal = billItems.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmount = (subtotal * parseFloat(discount)) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * parseFloat(taxRate)) / 100;
  const total = taxableAmount + taxAmount;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-cyber-border">
        <CardHeader>
          <CardTitle className="text-primary">Create Sale / Bill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Customer (Optional)</label>
            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerOpen}
                  className="w-full justify-between bg-cyber-card border-cyber-border"
                >
                  {selectedCustomerId
                    ? customers?.find((c) => c.id === selectedCustomerId)?.name
                    : "Walk-in Customer"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search customer..." />
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="walk-in"
                        onSelect={() => {
                          setSelectedCustomerId("");
                          setCustomerOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !selectedCustomerId ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Walk-in Customer
                      </CommandItem>
                      {customers?.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.name}
                          onSelect={() => {
                            setSelectedCustomerId(customer.id);
                            setCustomerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {customer.name} - {customer.phone}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Add Product Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Product</label>
              <Popover open={productOpen} onOpenChange={setProductOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productOpen}
                    className="w-full justify-between bg-cyber-card border-cyber-border"
                  >
                    {selectedProductId && products?.find((p) => p.id === selectedProductId)
                      ? products.find((p) => p.id === selectedProductId)?.name
                      : "Select product..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search product..." />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {products?.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={product.name}
                            onSelect={() => {
                              setSelectedProductId(product.id);
                              setProductOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProductId === product.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {product.name} - ₹{product.price} (Stock: {product.stock})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Quantity</label>
              <Input
                type="number"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>
            <div className="flex items-end">
              <Button variant="glow" onClick={handleAddItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Bill Items Table */}
          {billItems.length > 0 && (
            <div className="border border-cyber-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{item.unit_price.toFixed(2)}</TableCell>
                      <TableCell>₹{item.total_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totals Section */}
          {billItems.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Discount (%)</label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tax Rate (%)</label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <Input
                  type="text"
                  placeholder="Additional notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-orange-500">
                  <span>Discount ({discount}%):</span>
                  <span>- ₹{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({taxRate}%):</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                variant="glow"
                onClick={handleCreateBill}
                disabled={createBillMutation.isPending}
                className="w-full"
              >
                <Printer className="w-4 h-4 mr-2" />
                Create Bill
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
