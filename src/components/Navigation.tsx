import { Button } from "@/components/ui/button-enhanced";
import { Link } from "react-router-dom";

interface NavigationProps {
  onLoginClick: () => void;
}

export const Navigation = ({ onLoginClick }: NavigationProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-cyber-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold bg-gradient-text bg-clip-text text-transparent">
          Vikash Online
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="#services" className="text-foreground hover:text-primary transition-colors">
            Services
          </Link>
          <Link to="#pricing" className="text-foreground hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link to="#contact" className="text-foreground hover:text-primary transition-colors">
            Contact
          </Link>
        </div>

        <Button variant="glow" onClick={onLoginClick}>
          Login
        </Button>
      </div>
    </nav>
  );
};