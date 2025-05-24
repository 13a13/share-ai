
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Provider } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

// Define types
interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  socialLogin: (provider: Provider) => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  socialLogin: async () => {},
});

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Check for existing session first
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          if (mounted) setIsLoading(false);
          return;
        }

        if (mounted && session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || 
                  session.user.user_metadata?.full_name || 
                  session.user.email?.split('@')[0] || "",
          };
          setUser(userData);
        }
        
        if (mounted) setIsLoading(false);
      } catch (error) {
        console.error("Session initialization error:", error);
        if (mounted) setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event, session?.user?.id);
        
        if (!mounted) return;

        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || 
                  session.user.user_metadata?.full_name || 
                  session.user.email?.split('@')[0] || "",
          };
          setUser(userData);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Register function
  const register = async (email: string, password: string, name?: string) => {
    try {
      console.log("Starting registration for:", email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name?.trim(),
            full_name: name?.trim(),
          },
        },
      });
      
      if (error) {
        console.error("Registration error:", error);
        throw error;
      }
      
      console.log("Registration response:", data);
      
      if (!data.user) {
        throw new Error("Failed to create user account");
      }

      console.log("User registered successfully:", data.user.id);
      
      // If there's a session, user is logged in immediately
      if (data.session) {
        console.log("User automatically logged in");
        toast({
          title: "Account created successfully",
          description: "Welcome! You're now logged in.",
        });
      } else {
        console.log("User created, attempting to sign in");
        // If no session, try to sign in immediately
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        
        if (signInError) {
          console.log("Auto sign-in failed, but account was created");
          toast({
            title: "Account created",
            description: "Your account has been created. Please log in.",
          });
        } else {
          console.log("Auto sign-in successful");
          toast({
            title: "Account created successfully",
            description: "Welcome! You're now logged in.",
          });
        }
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      
      let errorMessage = "Failed to create account. Please try again.";
      if (error.message?.includes("already registered") || error.message?.includes("already been registered")) {
        errorMessage = "An account with this email already exists. Please try logging in instead.";
      } else if (error.message?.includes("Password")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        console.error("Login error:", error);
        throw error;
      }
      
      console.log("Login successful:", data.user?.id);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      console.error("Login failed:", error);
      
      let errorMessage = "Login failed. Please check your credentials.";
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const socialLogin = async (provider: Provider) => {
    try {
      console.log(`Initiating ${provider} OAuth login flow`);
      
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log(`Using redirect URL: ${redirectTo}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes: provider === 'google' ? 'profile email' : undefined,
        },
      });
      
      if (error) {
        console.error(`${provider} OAuth error:`, error);
        throw error;
      }
      
      console.log(`${provider} OAuth initiated, redirecting:`, data);
    } catch (error: any) {
      toast({
        title: "Social login failed",
        description: error.message || `Could not sign in with ${provider}.`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out.",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        socialLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
