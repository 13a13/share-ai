// Debug test file to help isolate the issue
import { useComponentPersistence } from "./useComponentPersistence";

export const debugTestComponentPersistence = () => {
  console.log("🧪 Debug test: testing useComponentPersistence import");
  
  try {
    const result = useComponentPersistence();
    console.log("🧪 Debug test: useComponentPersistence result:", result);
    return result;
  } catch (error) {
    console.error("🧪 Debug test: Error in useComponentPersistence:", error);
    throw error;
  }
};