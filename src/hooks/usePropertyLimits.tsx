
import { useState, useEffect } from 'react';
import { PropertiesAPI } from '@/lib/api/propertiesApi';
import { useSubscription } from './useSubscription';

export const usePropertyLimits = () => {
  const [propertyCount, setPropertyCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { profile, canCreateProperties } = useSubscription();

  useEffect(() => {
    fetchPropertyCount();
  }, []);

  const fetchPropertyCount = async () => {
    try {
      setIsLoading(true);
      const properties = await PropertiesAPI.getAll();
      setPropertyCount(properties.length);
    } catch (error) {
      console.error('Error fetching property count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canCreateNewProperty = () => {
    if (!canCreateProperties()) return false;
    if (!profile) return false;
    return propertyCount < profile.property_limit;
  };

  const getPropertyLimitStatus = () => {
    if (!profile) return { current: 0, limit: 0, percentage: 0 };
    
    return {
      current: propertyCount,
      limit: profile.property_limit,
      percentage: (propertyCount / profile.property_limit) * 100
    };
  };

  return {
    propertyCount,
    isLoading,
    canCreateNewProperty,
    getPropertyLimitStatus,
    refetch: fetchPropertyCount
  };
};
