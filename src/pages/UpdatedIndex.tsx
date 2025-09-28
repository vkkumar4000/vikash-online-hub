import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Pricing } from "@/components/Pricing";

const UpdatedIndex = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation onLoginClick={handleLoginClick} />
      <Hero onLoginClick={handleLoginClick} />
      <Services />
      <Pricing onLoginClick={handleLoginClick} />
      
      {/* Footer */}
      <footer className="bg-cyber-card border-t border-cyber-border py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold bg-gradient-text bg-clip-text text-transparent mb-4">
              Vikash Online
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your premium destination for gaming, internet, and digital services. 
              Experience the future of cyber cafes with us.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4 text-primary">Contact Info</h4>
              <p className="text-muted-foreground">📍 123 Tech Street, Cyber City</p>
              <p className="text-muted-foreground">📞 +91 98765 43210</p>
              <p className="text-muted-foreground">✉️ info@vikashonline.com</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-primary">Hours</h4>
              <p className="text-muted-foreground">Monday - Sunday</p>
              <p className="text-muted-foreground">24/7 Open</p>
              <p className="text-muted-foreground">Always Here for You!</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-primary">Services</h4>
              <p className="text-muted-foreground">Gaming Stations</p>
              <p className="text-muted-foreground">High-Speed Internet</p>
              <p className="text-muted-foreground">Printing & Scanning</p>
            </div>
          </div>
          
          <div className="border-t border-cyber-border pt-8">
            <p className="text-muted-foreground">
              © 2024 Vikash Online. All rights reserved. | Powered by cutting-edge technology
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UpdatedIndex;