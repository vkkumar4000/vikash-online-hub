import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-enhanced";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(100, { message: "Password must be less than 100 characters" })
});

export default function Auth() {
  const [loginType, setLoginType] = useState<"customer" | "admin" | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkRoleAndRedirect(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        checkRoleAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkRoleAndRedirect = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    if (roles && roles.length > 0) {
      // Check if user is admin
      const isAdmin = roles.some(r => r.role === "admin");
      if (isAdmin) {
        navigate("/dashboard");
      } else {
        navigate("/customer-portal");
      }
    } else {
      // No role assigned, redirect to customer portal by default
      navigate("/customer-portal");
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = authSchema.parse({ email, password });
      
      if (isLogin) {
        // Admin login with Supabase auth
        const { error, data } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });
        
        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          // Check if user has admin role
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id);
          
          const isAdmin = roles && roles.some(r => r.role === "admin");
          
          if (isAdmin) {
            toast({
              title: "Welcome Admin!",
              description: "Successfully logged in.",
            });
            navigate("/dashboard");
          } else {
            await supabase.auth.signOut();
            toast({
              title: "Access denied",
              description: "You don't have admin privileges.",
              variant: "destructive",
            });
          }
        }
      } else {
        // Request admin access
        const redirectUrl = `${window.location.origin}/auth`;
        
        const { error, data } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        
        if (error) {
          toast({
            title: "Signup failed",
            description: error.message,
            variant: "destructive",
          });
        } else if (data.user) {
          // Create admin request
          const { error: requestError } = await supabase
            .from("pending_admin_requests")
            .insert({
              user_id: data.user.id,
              email: validatedData.email,
            });
          
          if (requestError) {
            toast({
              title: "Request failed",
              description: "Could not create admin request.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Request submitted!",
              description: "Your admin access request has been sent for approval. You'll be notified via email.",
            });
          }
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "An error occurred",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Customer login with customer_credentials
        const { data: credential, error } = await supabase
          .from("customer_credentials")
          .select("customer_id, password_hash")
          .eq("username", username)
          .single();

        if (error || !credential) {
          toast({
            title: "Login failed",
            description: "Invalid username or password.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // In production, properly hash and compare passwords
        // For now, direct comparison (not secure!)
        if (credential.password_hash !== password) {
          toast({
            title: "Login failed",
            description: "Invalid username or password.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        toast({
          title: "Welcome!",
          description: "Successfully logged in.",
        });
        
        navigate("/customer-portal");
      } else {
        // Customer signup
        // First check if username already exists
        const { data: existingUsername } = await supabase
          .from("customer_credentials")
          .select("username")
          .eq("username", username)
          .maybeSingle();

        if (existingUsername) {
          toast({
            title: "Username taken",
            description: "Please choose a different username.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Get current user to use as admin/creator
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please login as admin first to create customer accounts.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Generate customer ID
        const { data: existingCustomers } = await supabase
          .from("customers")
          .select("customer_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        let nextId = 1;
        if (existingCustomers && existingCustomers.length > 0) {
          const lastId = parseInt(existingCustomers[0].customer_id.replace("CUST", ""));
          nextId = lastId + 1;
        }
        const customerId = `CUST${String(nextId).padStart(4, "0")}`;

        // Create customer
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            user_id: user.id,
            customer_id: customerId,
            name,
            email: email || null,
            phone,
            address: null,
          })
          .select()
          .single();

        if (customerError || !newCustomer) {
          toast({
            title: "Signup failed",
            description: customerError?.message || "Could not create customer account.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Create credentials
        const { error: credError } = await supabase
          .from("customer_credentials")
          .insert({
            customer_id: newCustomer.id,
            username,
            password_hash: password, // In production, hash this!
          });

        if (credError) {
          toast({
            title: "Signup failed",
            description: "Could not create login credentials.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        toast({
          title: "Account created!",
          description: "You can now login with your credentials.",
        });
        
        setIsLogin(true);
        setPassword("");
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!loginType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
        <div 
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${cursorPos.x}px ${cursorPos.y}px, hsl(var(--primary) / 0.15), transparent 40%)`
          }}
        />
        
        <Card className="w-full max-w-md bg-gradient-card border-cyber-border shadow-card-cyber relative z-10 transition-transform duration-200"
          style={{
            transform: `perspective(1000px) rotateX(${(cursorPos.y - window.innerHeight / 2) / 50}deg) rotateY(${(cursorPos.x - window.innerWidth / 2) / 50}deg)`
          }}>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-text bg-clip-text text-transparent">
              Vikash Online
            </CardTitle>
            <p className="text-muted-foreground">
              Choose login type
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button
              variant="cyber"
              className="w-full"
              onClick={() => setLoginType("customer")}
            >
              Customer Login
            </Button>
            
            <Button
              variant="glow"
              className="w-full"
              onClick={() => setLoginType("admin")}
            >
              Admin Login
            </Button>
            
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${cursorPos.x}px ${cursorPos.y}px, hsl(var(--primary) / 0.15), transparent 40%)`
        }}
      />
      
      <Card className="w-full max-w-md bg-gradient-card border-cyber-border shadow-card-cyber relative z-10 transition-transform duration-200"
        style={{
          transform: `perspective(1000px) rotateX(${(cursorPos.y - window.innerHeight / 2) / 50}deg) rotateY(${(cursorPos.x - window.innerWidth / 2) / 50}deg)`
        }}>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-text bg-clip-text text-transparent">
            {loginType === "admin" ? "Admin Access" : "Customer Portal"}
          </CardTitle>
          <p className="text-muted-foreground">
            {isLogin 
              ? loginType === "admin" 
                ? "Sign in with admin credentials" 
                : "Sign in to your account"
              : loginType === "admin"
                ? "Request admin access"
                : "Create a new account"
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={loginType === "admin" ? handleAdminLogin : handleCustomerLogin} className="space-y-4">
            {loginType === "admin" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-cyber-card border-cyber-border focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-cyber-card border-cyber-border focus:border-primary"
                  />
                </div>
              </>
            ) : (
              <>
                {isLogin ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="bg-cyber-card border-cyber-border focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-cyber-card border-cyber-border focus:border-primary"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-cyber-card border-cyber-border focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="bg-cyber-card border-cyber-border focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-cyber-card border-cyber-border focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Choose a username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="bg-cyber-card border-cyber-border focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Choose a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-cyber-card border-cyber-border focus:border-primary"
                      />
                    </div>
                  </>
                )}
              </>
            )}
            
            <Button
              type="submit"
              variant={loginType === "admin" ? "glow" : "cyber"}
              className="w-full"
              disabled={loading}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : loginType === "admin" ? "Request Access" : "Sign Up"}
            </Button>
          </form>
          
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-primary/80"
            >
              {isLogin 
                ? loginType === "admin" 
                  ? "Request admin access" 
                  : "Don't have an account? Sign up"
                : loginType === "admin"
                  ? "Already have access? Sign in"
                  : "Already have an account? Sign in"
              }
            </Button>
          </div>
          
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => {
                setLoginType(null);
                setIsLogin(true);
                setEmail("");
                setPassword("");
                setUsername("");
                setName("");
                setPhone("");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back to login options
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}