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

  // Check for existing user session on mount and set up auth state listener
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "",
          };
          setUser(userData);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "",
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
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

  // Register function
  const register = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (error) throw error;
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

  // Social login function with enhanced Google support
  const socialLogin = async (provider: Provider) => {
    setIsLoading(true);
    try {
      console.log(`Initiating ${provider} OAuth login flow`);
      
      // Use the appropriate redirect URL for the current environment
      // Make sure this matches the URL configured in both Supabase and Google Cloud Console
      const redirectTo = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/auth/callback`
        : "https://share-ai.lovable.app/auth/callback";
      
      console.log(`Using redirect URL: ${redirectTo}`);
      
      // Google-specific logging
      if (provider === 'google') {
        console.log('Google Sign-In initiated with redirect URL:', redirectTo);
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          // Set appropriate scopes
          scopes: provider === 'apple' 
            ? 'name email' 
            : provider === 'google' 
              ? 'profile email' 
              : undefined,
        },
      });
      
      if (error) {
        console.error(`${provider} OAuth error:`, error);
        
        // Enhanced Google-specific error handling
        if (provider === 'google') {
          if (error.message.includes('provider is not enabled')) {
            throw new Error('Google Sign-In is not properly configured in your Supabase project settings. Please check your configuration.');
          }
          
          console.error('Google Sign-In failed with error:', error);
          throw new Error(`Google Sign-In failed: ${error.message}. Please verify your Google Cloud Console settings.`);
        }
        
        // Check for validation errors which could indicate provider not enabled
        if (error.message.includes('validation_failed') || error.message.includes('provider is not enabled')) {
          throw new Error(`The ${provider} provider is not enabled in your Supabase project settings.`);
        }
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
