import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-enhanced";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function CustomersView() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleAddCustomer = () => {
    if (!name || !phone) {
      toast({
        title: "Missing information",
        description: "Please fill in name and phone",
        variant: "destructive",
      });
      return;
    }

    const customerId = `CUST${String(customers.length + 1).padStart(3, '0')}`;
    const newCustomer: Customer = {
      id: customerId,
      name,
      email,
      phone,
      address,
    };

    setCustomers([...customers, newCustomer]);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");

    toast({
      title: "Customer added",
      description: "Customer has been added successfully",
    });
  };

  const handleRemoveCustomer = (id: string) => {
    setCustomers(customers.filter(customer => customer.id !== id));
    toast({
      title: "Customer removed",
      description: "Customer has been removed",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-cyber-border">
        <CardHeader>
          <CardTitle className="text-2xl">Add Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                placeholder="Enter customer name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleAddCustomer}
            variant="cyber" 
            className="w-full"
          >
            Add Customer
          </Button>
        </CardContent>
      </Card>

      {customers.length > 0 && (
        <Card className="bg-gradient-card border-cyber-border">
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>{customer.address || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCustomer(customer.id)}
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
