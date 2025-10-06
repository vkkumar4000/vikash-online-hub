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

type Supplier = Tables<"suppliers">;

export default function SuppliersView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const addSupplierMutation = useMutation({
    mutationFn: async (newSupplier: { name: string; email: string; phone: string; company: string; address: string; gstNumber: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      // Generate supplier ID
      const { data: supplierId, error: idError } = await supabase.rpc("generate_supplier_id");
      if (idError) throw idError;

      const { data, error } = await supabase
        .from("suppliers")
        .insert({
          supplier_id: supplierId,
          name: newSupplier.name,
          email: newSupplier.email || null,
          phone: newSupplier.phone,
          company: newSupplier.company || null,
          address: newSupplier.address || null,
          gst_number: newSupplier.gstNumber || null,
          user_id: session.session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setAddress("");
      setGstNumber("");
      toast({
        title: "Supplier added",
        description: "Supplier has been added successfully",
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

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: "Supplier removed",
        description: "Supplier has been removed",
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

  const handleAddSupplier = () => {
    if (!name || !phone) {
      toast({
        title: "Missing information",
        description: "Please fill in name and phone",
        variant: "destructive",
      });
      return;
    }

    addSupplierMutation.mutate({ name, email, phone, company, address, gstNumber });
  };

  const handleRemoveSupplier = (id: string) => {
    deleteSupplierMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-cyber-border">
        <CardHeader>
          <CardTitle className="text-2xl">Add Supplier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="supplierName">Supplier Name *</Label>
              <Input
                id="supplierName"
                placeholder="Enter supplier name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierPhone">Phone Number *</Label>
              <Input
                id="supplierPhone"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierEmail">Email</Label>
              <Input
                id="supplierEmail"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="Enter company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="supplierAddress">Address</Label>
              <Input
                id="supplierAddress"
                placeholder="Enter address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                placeholder="Enter GST number"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleAddSupplier}
            variant="cyber" 
            className="w-full"
            disabled={addSupplierMutation.isPending}
          >
            {addSupplierMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Supplier
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-cyber-border">
        <CardHeader>
          <CardTitle>Supplier List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : suppliers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No suppliers yet. Add your first supplier above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>GST Number</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.supplier_id}</TableCell>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.email || "-"}</TableCell>
                    <TableCell>{supplier.company || "-"}</TableCell>
                    <TableCell>{supplier.gst_number || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSupplier(supplier.id)}
                          disabled={deleteSupplierMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
