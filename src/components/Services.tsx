import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Wifi, Gamepad2, Printer, Coffee, Shield } from "lucide-react";

export const Services = () => {
  const services = [
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      title: "Gaming Stations",
      description: "High-performance gaming PCs with latest graphics cards and peripherals for the ultimate gaming experience."
    },
    {
      icon: <Wifi className="w-8 h-8" />,
      title: "High-Speed Internet",
      description: "Lightning-fast 1Gbps internet connection for seamless browsing, streaming, and downloading."
    },
    {
      icon: <Monitor className="w-8 h-8" />,
      title: "Workstations",
      description: "Professional workstations for coding, design work, and productivity tasks with premium software."
    },
    {
      icon: <Printer className="w-8 h-8" />,
      title: "Printing Services",
      description: "High-quality printing, scanning, and photocopying services for all your document needs."
    },
    {
      icon: <Coffee className="w-8 h-8" />,
      title: "Refreshments",
      description: "Complimentary beverages and snacks to keep you energized during your sessions."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Environment",
      description: "Safe and secure environment with CCTV monitoring and trained staff on-site 24/7."
    }
  ];

  return (
    <section id="services" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-text bg-clip-text text-transparent">
            Our Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for gaming, work, and entertainment in one premium location
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="bg-gradient-card border-cyber-border hover:shadow-cyber transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="text-primary mb-4">{service.icon}</div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};