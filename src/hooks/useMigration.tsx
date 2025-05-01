
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { runFullMigration } from '@/utils/migrateToSupabase';
import { useToast } from '@/components/ui/use-toast';

export const useMigration = () => {
  const { toast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    const checkAndMigrate = async () => {
      // Check if migration has already been done
      if (localStorage.getItem('migration-complete')) {
        setMigrationComplete(true);
        return;
      }

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setIsMigrating(true);
      
      try {
        await runFullMigration();
        localStorage.setItem('migration-complete', 'true');
        setMigrationComplete(true);
        
        toast({
          title: "Data Migration Complete",
          description: "Your data has been successfully migrated to the cloud. You can now access it from any device.",
        });
      } catch (error) {
        console.error('Migration error:', error);
        toast({
          variant: "destructive",
          title: "Migration Error",
          description: "There was a problem migrating your data. Some information may not be available across devices.",
        });
      } finally {
        setIsMigrating(false);
      }
    };

    checkAndMigrate();

    // Listen for auth state changes to migrate data when user signs in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        checkAndMigrate();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  return {
    isMigrating,
    migrationComplete
  };
};
