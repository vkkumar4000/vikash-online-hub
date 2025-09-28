import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-enhanced";
import { Check } from "lucide-react";

interface PricingProps {
  onLoginClick: () => void;
}

export const Pricing = ({ onLoginClick }: PricingProps) => {
  const plans = [
    {
      name: "Basic Hour",
      price: "₹30",
      period: "/hour",
      description: "Perfect for quick sessions",
      features: ["High-speed internet", "Standard PC", "Basic games", "Free water"],
      popular: false
    },
    {
      name: "Gaming Pro",
      price: "₹50",
      period: "/hour",
      description: "Premium gaming experience",
      features: ["Gaming PC with RTX GPU", "All latest games", "Gaming peripherals", "Free snacks", "Priority support"],
      popular: true
    },
    {
      name: "Daily Pass",
      price: "₹300",
      period: "/day",
      description: "All-day access",
      features: ["Unlimited hours", "Gaming PC access", "All services", "Free meals", "Reserved seating"],
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 px-4 bg-cyber-dark/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-text bg-clip-text text-transparent">
            Pricing Plans
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your needs - from quick sessions to all-day gaming
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative bg-gradient-card border-cyber-border transition-all duration-300 hover:scale-105 ${plan.popular ? 'ring-2 ring-primary shadow-cyber' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-cyber text-cyber-dark px-4 py-2 rounded-full text-sm font-bold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <p className="text-muted-foreground">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-primary mr-3" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.popular ? "hero" : "glow"} 
                  className="w-full mt-6"
                  onClick={onLoginClick}
                >
                  Book Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};