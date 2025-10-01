import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-enhanced";
import { Download, FileText, Users, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReportsView() {
  const { toast } = useToast();

  const handleDownloadReport = (reportType: string) => {
    toast({
      title: "Downloading report",
      description: `${reportType} report is being prepared`,
    });
  };

  const reports = [
    {
      title: "Sales Report",
      description: "Download complete sales report with transactions",
      icon: FileText,
      type: "Sales",
    },
    {
      title: "Customer Report",
      description: "Download customer list with contact details",
      icon: Users,
      type: "Customer",
    },
    {
      title: "Product Report",
      description: "Download product inventory and stock report",
      icon: Package,
      type: "Product",
    },
    {
      title: "Supplier Report",
      description: "Download supplier list with company details",
      icon: Users,
      type: "Supplier",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-cyber-border">
        <CardHeader>
          <CardTitle className="text-2xl">Download Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => (
              <Card key={report.type} className="bg-cyber-card/30 border-cyber-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <report.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{report.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {report.description}
                      </p>
                      <Button
                        variant="cyber"
                        size="sm"
                        onClick={() => handleDownloadReport(report.type)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
