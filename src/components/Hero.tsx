import { Button } from "@/components/ui/button-enhanced";
import heroImage from "@/assets/hero-cyber-cafe.jpg";

interface HeroProps {
  onLoginClick: () => void;
}

export const Hero = ({ onLoginClick }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-cyber-dark/70" />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-float">
          <span className="bg-gradient-text bg-clip-text text-transparent">
            Vikash Online
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Experience the future of gaming and internet at our premium cyber cafe. 
          High-speed connections, latest games, and cutting-edge technology.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero" size="xl" onClick={onLoginClick}>
            Get Started
          </Button>
          <Button variant="glow" size="xl">
            View Packages
          </Button>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4">
            <div className="text-3xl font-bold text-primary mb-2">50+</div>
            <div className="text-muted-foreground">Gaming Stations</div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-secondary mb-2">1Gbps</div>
            <div className="text-muted-foreground">Internet Speed</div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-muted-foreground">Open Hours</div>
          </div>
        </div>
      </div>
    </section>
  );
};