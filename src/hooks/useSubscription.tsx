
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  trial_start: string;
  trial_end: string;
  subscription_status: string;
  property_limit: number;
  subscription_tier: string;
  first_name: string | null;
  last_name: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysLeft = () => {
    if (!profile?.trial_end) return 0;
    const trialEnd = new Date(profile.trial_end);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isTrialExpired = () => {
    return false; // No trials, unlimited access
  };

  const isTrialActive = () => {
    return false; // No trials, unlimited access
  };

  const hasActiveSubscription = () => {
    return true; // Everyone has unlimited access
  };

  const isUnlimitedAccount = () => {
    return true; // Everyone has unlimited access
  };

  const canCreateProperties = () => {
    return true; // Everyone can create properties
  };

  return {
    profile,
    isLoading,
    error,
    getDaysLeft,
    isTrialExpired,
    isTrialActive,
    hasActiveSubscription,
    isUnlimitedAccount,
    canCreateProperties,
    refetch: fetchProfile
  };
};
