
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Provider, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { securityService } from "@/lib/security/securityService";

// Define types
interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
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
  session: null,
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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Helper function to extract user data from session
  const extractUserData = (session: Session | null): User | null => {
    if (!session?.user) return null;
    
    return {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.user_metadata?.name || 
            session.user.user_metadata?.full_name || 
            session.user.email?.split('@')[0] || "",
    };
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    console.log("Initializing auth state...");

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change:", event, session?.user?.id);
        
        if (!mounted) return;

        setSession(session);
        const userData = extractUserData(session);
        setUser(userData);
        setIsLoading(false);

        // Log security events
        securityService.logSecurityEvent({
          action: event,
          success: !!session,
          identifier: userData?.email,
          userAgent: navigator.userAgent
        });

        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, clearing state");
        } else if (event === 'SIGNED_IN') {
          console.log("User signed in:", userData?.email);
          // Record successful login for rate limiting
          securityService.recordAttempt('login', userData?.email, true);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log("Token refreshed for user:", userData?.email);
        }
      }
    );

    // THEN check for existing session
    const getInitialSession = async () => {
      try {
        console.log("Checking for existing session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          console.log("Initial session found:", !!session);
          setSession(session);
          const userData = extractUserData(session);
          setUser(userData);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Session initialization error:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      console.log("Cleaning up auth state listener");
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Register function with enhanced security
  const register = async (email: string, password: string, name?: string) => {
    try {
      console.log("Starting registration for:", email);
      
      // Sanitize inputs
      const sanitizedEmail = securityService.sanitizeInput(email);
      const sanitizedName = name ? securityService.sanitizeInput(name) : undefined;
      
      // Validate email
      const emailValidation = securityService.validateEmail(sanitizedEmail);
      if (!emailValidation.valid) {
        throw new Error(emailValidation.reason);
      }
      
      // Check rate limiting
      const rateLimitCheck = securityService.checkRateLimit('register', sanitizedEmail);
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.reason);
      }
      
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: sanitizedName?.trim(),
            full_name: sanitizedName?.trim(),
          },
        },
      });
      
      // Record attempt
      securityService.recordAttempt('register', sanitizedEmail, !error);
      
      if (error) {
        console.error("Registration error:", error);
        securityService.logSecurityEvent({
          action: 'register_failed',
          success: false,
          identifier: sanitizedEmail,
          userAgent: navigator.userAgent,
          additionalData: { error: error.message }
        });
        throw error;
      }
      
      console.log("Registration response:", data);
      
      if (!data.user) {
        throw new Error("Failed to create user account");
      }

      console.log("User registered successfully:", data.user.id);
      
      securityService.logSecurityEvent({
        action: 'register_success',
        success: true,
        identifier: sanitizedEmail,
        userAgent: navigator.userAgent
      });
      
      // If there's a session, user is logged in immediately
      if (data.session) {
        console.log("User automatically logged in");
        toast({
          title: "Account created successfully",
          description: "Welcome! You're now logged in.",
        });
      } else {
        console.log("Registration complete, please check email for verification");
        toast({
          title: "Account created",
          description: "Please check your email for verification.",
        });
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
    } finally {
      setIsLoading(false);
    }
  };

  // Login function with enhanced security
  const login = async (email: string, password: string) => {
    try {
      console.log("Starting login for:", email);
      
      // Sanitize inputs
      const sanitizedEmail = securityService.sanitizeInput(email);
      
      // Validate email
      const emailValidation = securityService.validateEmail(sanitizedEmail);
      if (!emailValidation.valid) {
        throw new Error(emailValidation.reason);
      }
      
      // Check rate limiting
      const rateLimitCheck = securityService.checkRateLimit('login', sanitizedEmail);
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.reason);
      }
      
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail.trim().toLowerCase(),
        password,
      });
      
      // Record attempt
      securityService.recordAttempt('login', sanitizedEmail, !error);
      
      if (error) {
        console.error("Login error:", error);
        securityService.logSecurityEvent({
          action: 'login_failed',
          success: false,
          identifier: sanitizedEmail,
          userAgent: navigator.userAgent,
          additionalData: { error: error.message }
        });
        throw error;
      }
      
      console.log("Login successful:", data.user?.id);
      
      securityService.logSecurityEvent({
        action: 'login_success',
        success: true,
        identifier: sanitizedEmail,
        userAgent: navigator.userAgent
      });
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      console.error("Login failed:", error);
      
      let errorMessage = "Login failed. Please check your credentials.";
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Please check your email and confirm your account before logging in.";
      } else if (error.message?.includes("Too many attempts")) {
        errorMessage = error.message; // Rate limiting message
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = async (provider: Provider) => {
    try {
      console.log(`Initiating ${provider} OAuth login flow`);
      
      // Check rate limiting for social login
      const rateLimitCheck = securityService.checkRateLimit('socialLogin');
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.reason);
      }
      
      setIsLoading(true);
      
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log(`Using redirect URL: ${redirectTo}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes: provider === 'google' ? 'profile email' : undefined,
        },
      });
      
      // Record attempt
      securityService.recordAttempt('socialLogin', provider, !error);
      
      if (error) {
        console.error(`${provider} OAuth error:`, error);
        securityService.logSecurityEvent({
          action: 'social_login_failed',
          success: false,
          identifier: provider,
          userAgent: navigator.userAgent,
          additionalData: { provider, error: error.message }
        });
        throw error;
      }
      
      console.log(`${provider} OAuth initiated, redirecting:`, data);
      
      securityService.logSecurityEvent({
        action: 'social_login_initiated',
        success: true,
        identifier: provider,
        userAgent: navigator.userAgent,
        additionalData: { provider }
      });
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
      console.log("Starting logout...");
      setIsLoading(true);
      
      const userEmail = user?.email;
      
      await supabase.auth.signOut();
      
      // Clear state immediately (onAuthStateChange will also handle this)
      setUser(null);
      setSession(null);
      
      console.log("Logout successful");
      
      securityService.logSecurityEvent({
        action: 'logout',
        success: true,
        identifier: userEmail,
        userAgent: navigator.userAgent
      });
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out.",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user && !!session,
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
