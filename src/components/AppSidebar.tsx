import { FileText, Users, Package, Building2, Receipt, Download } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: "billing", title: "Create Bill", icon: Receipt },
  { id: "customers", title: "Add Customers", icon: Users },
  { id: "products", title: "Add Products", icon: Package },
  { id: "suppliers", title: "Add Suppliers", icon: Building2 },
  { id: "print", title: "Print Bill", icon: FileText },
  { id: "reports", title: "Download Report", icon: Download },
];

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const { state } = useSidebar();

  return (
    <Sidebar
      className={state === "collapsed" ? "w-16" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent className="bg-cyber-card/50 border-r border-cyber-border">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary">
            {state !== "collapsed" && "Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.id)}
                    className={`${
                      activeView === item.id
                        ? "bg-primary/20 text-primary font-medium border-l-2 border-primary"
                        : "hover:bg-muted/50"
                    } transition-all`}
                  >
                    <item.icon className={`${state === "collapsed" ? "" : "mr-2"} h-4 w-4`} />
                    {state !== "collapsed" && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
