import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-enhanced";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Clock, Monitor, CreditCard, User as UserIcon } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import BillingView from "@/components/dashboard/BillingView";
import CustomersView from "@/components/dashboard/CustomersView";
import ProductsView from "@/components/dashboard/ProductsView";
import SuppliersView from "@/components/dashboard/SuppliersView";
import PrintBillView from "@/components/dashboard/PrintBillView";
import ReportsView from "@/components/dashboard/ReportsView";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("billing");
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const renderView = () => {
    switch (activeView) {
      case "billing":
        return <BillingView />;
      case "customers":
        return <CustomersView />;
      case "products":
        return <ProductsView />;
      case "suppliers":
        return <SuppliersView />;
      case "print":
        return <PrintBillView />;
      case "reports":
        return <ReportsView />;
      default:
        return <BillingView />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-cyber-border bg-cyber-card/50 backdrop-blur-md flex items-center px-4">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-2xl font-bold bg-gradient-text bg-clip-text text-transparent flex-1">
              Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-muted-foreground">Welcome, {user?.email}</span>
              <Button variant="glow" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8">
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

              {/* Dynamic Content */}
              {renderView()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}