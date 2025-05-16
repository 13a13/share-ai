
import React, { useState } from "react";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LoadingOverlayDemo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"spinner" | "progress">("spinner");
  const [background, setBackground] = useState<"dark" | "light" | "transparent">("dark");
  const [loadingText, setLoadingText] = useState("Loading...");

  const toggleLoading = () => {
    setIsLoading(prev => !prev);
    if (!isLoading) {
      // Auto reset after 3 seconds
      setTimeout(() => setIsLoading(false), 3000);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Loading Overlay Component</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="border p-4 rounded-md space-y-4">
            <h3 className="text-lg font-medium">Controls</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <Button onClick={toggleLoading}>
                  {isLoading ? "Hide Loading Overlay" : "Show Loading Overlay"}
                </Button>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium">Loading Type:</label>
                <Tabs value={loadingType} onValueChange={(v) => setLoadingType(v as "spinner" | "progress")}>
                  <TabsList>
                    <TabsTrigger value="spinner">Spinner</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium">Background:</label>
                <Tabs value={background} onValueChange={(v) => setBackground(v as "dark" | "light" | "transparent")}>
                  <TabsList>
                    <TabsTrigger value="dark">Dark</TabsTrigger>
                    <TabsTrigger value="light">Light</TabsTrigger>
                    <TabsTrigger value="transparent">Transparent</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
          
          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2">Usage Example</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`<LoadingOverlay
  isLoading={${isLoading}}
  loadingText="${loadingText}"
  type="${loadingType}"
  background="${background}"
>
  <YourContent />
</LoadingOverlay>`}
            </pre>
          </div>
        </div>
        
        <div className="h-96 border rounded-md overflow-hidden relative">
          <LoadingOverlay
            isLoading={isLoading}
            loadingText={loadingText}
            type={loadingType}
            background={background}
          >
            <div className="p-6 h-full overflow-auto">
              <h3 className="text-lg font-medium mb-4">Content Below Overlay</h3>
              <p className="mb-4">
                This content is displayed behind the loading overlay when active.
                The overlay appears on top of this content when the isLoading prop is true.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-gray-100 p-4 rounded-md">
                    Sample content {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </LoadingOverlay>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlayDemo;
