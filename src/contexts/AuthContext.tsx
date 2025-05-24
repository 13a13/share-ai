import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Provider } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

// Define types
interface User {
  id: string;
  email: string;
  name?: string;
  emailConfirmed?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<{ needsVerification: boolean }>;
  logout: () => void;
  socialLogin: (provider: Provider) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => ({ needsVerification: false }),
  logout: () => {},
  socialLogin: async () => {},
  resendVerification: async () => {},
});

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing user session on mount and set up auth state listener
  useEffect(() => {
    // Set up auth state listener first to ensure we don't miss auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || 
                  session.user.user_metadata?.full_name || 
                  session.user.email?.split('@')[0] || "",
            emailConfirmed: session.user.email_confirmed_at != null,
          };
          setUser(userData);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name || 
                session.user.user_metadata?.full_name || 
                session.user.email?.split('@')[0] || "",
          emailConfirmed: session.user.email_confirmed_at != null,
        };
        setUser(userData);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Email verification required",
          description: "Please check your email and click the verification link before logging in.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        throw new Error("Email verification required");
      }
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function with email verification
  const register = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      // Check if user needs to verify email
      const needsVerification = !data.user?.email_confirmed_at;
      
      if (needsVerification) {
        toast({
          title: "Registration successful",
          description: "Please check your email to verify your account.",
        });
      } else {
        toast({
          title: "Registration successful",
          description: "Welcome! You have been logged in.",
        });
      }
      
      return { needsVerification };
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification email
  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) throw error;
  };

  const socialLogin = async (provider: Provider) => {
    setIsLoading(true);
    try {
      console.log(`Initiating ${provider} OAuth login flow`);
      
      // Use the absolute URL for redirect to avoid path issues
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      console.log(`Using redirect URL: ${redirectTo}`);
      
      if (provider === 'google') {
        console.log('Google Sign-In initiated with redirect URL:', redirectTo);
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          // Only specify scopes where needed
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
    } finally {
      setIsLoading(false);
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
        isAuthenticated: !!user && !!user.emailConfirmed,
        isLoading,
        login,
        register,
        logout,
        socialLogin,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
