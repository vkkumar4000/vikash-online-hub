import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-enhanced";
import { Printer } from "lucide-react";

export default function PrintBillView() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-cyber-border">
        <CardHeader>
          <CardTitle className="text-2xl">Print Bill</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Printer className="w-16 h-16 mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground mb-6">
              Create a bill first to print it
            </p>
            <Button variant="cyber" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Current Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
