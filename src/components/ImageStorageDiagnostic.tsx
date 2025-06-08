
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Database, FolderOpen } from "lucide-react";

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

const ImageStorageDiagnostic = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Step 1: Check if bucket exists
      addResult({ step: "Checking storage buckets", status: 'success', message: "Starting bucket check..." });
      
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        addResult({ 
          step: "List Buckets", 
          status: 'error', 
          message: `Error listing buckets: ${bucketsError.message}`,
          details: bucketsError 
        });
      } else {
        const inspectionBucket = buckets?.find(b => b.name === 'inspection-images');
        
        if (inspectionBucket) {
          addResult({ 
            step: "Bucket Check", 
            status: 'success', 
            message: "✓ inspection-images bucket exists",
            details: inspectionBucket 
          });
        } else {
          addResult({ 
            step: "Bucket Check", 
            status: 'warning', 
            message: "⚠️ inspection-images bucket not found. Will attempt to create it.",
            details: { availableBuckets: buckets?.map(b => b.name) }
          });
          
          // Try to create the bucket
          const { data: createData, error: createError } = await supabase.storage.createBucket('inspection-images', {
            public: true
          });
          
          if (createError) {
            addResult({ 
              step: "Create Bucket", 
              status: 'error', 
              message: `Failed to create bucket: ${createError.message}`,
              details: createError 
            });
          } else {
            addResult({ 
              step: "Create Bucket", 
              status: 'success', 
              message: "✓ Created inspection-images bucket successfully" 
            });
          }
        }
      }

      // Step 2: Check inspection_images table
      addResult({ step: "Database Check", status: 'success', message: "Checking inspection_images table..." });
      
      const { data: images, error: imagesError } = await supabase
        .from('inspection_images')
        .select('*')
        .limit(10);
      
      if (imagesError) {
        addResult({ 
          step: "Database Images", 
          status: 'error', 
          message: `Error querying images: ${imagesError.message}`,
          details: imagesError 
        });
      } else {
        addResult({ 
          step: "Database Images", 
          status: 'success', 
          message: `✓ Found ${images?.length || 0} image records in database`,
          details: images 
        });
      }

      // Step 3: Check for files in bucket
      if (buckets?.find(b => b.name === 'inspection-images')) {
        addResult({ step: "File Check", status: 'success', message: "Checking files in bucket..." });
        
        const { data: files, error: filesError } = await supabase.storage
          .from('inspection-images')
          .list('', { limit: 100 });
        
        if (filesError) {
          addResult({ 
            step: "Bucket Files", 
            status: 'error', 
            message: `Error listing files: ${filesError.message}`,
            details: filesError 
          });
        } else {
          addResult({ 
            step: "Bucket Files", 
            status: 'success', 
            message: `✓ Found ${files?.length || 0} files in storage bucket`,
            details: files?.slice(0, 5) 
          });
        }
      }

      // Step 4: Test upload functionality
      addResult({ step: "Upload Test", status: 'success', message: "Testing upload functionality..." });
      
      try {
        // Create a small test image (1x1 pixel PNG)
        const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const response = await fetch(testImageData);
        const blob = await response.blob();
        
        const testFileName = `test-${Date.now()}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('inspection-images')
          .upload(testFileName, blob, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) {
          addResult({ 
            step: "Upload Test", 
            status: 'error', 
            message: `Upload test failed: ${uploadError.message}`,
            details: uploadError 
          });
        } else {
          addResult({ 
            step: "Upload Test", 
            status: 'success', 
            message: "✓ Upload test successful" 
          });
          
          // Clean up test file
          await supabase.storage
            .from('inspection-images')
            .remove([testFileName]);
        }
      } catch (error) {
        addResult({ 
          step: "Upload Test", 
          status: 'error', 
          message: `Upload test error: ${error}`,
          details: error 
        });
      }

      // Step 5: Check user permissions
      addResult({ step: "Permissions", status: 'success', message: "Checking user permissions..." });
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        addResult({ 
          step: "User Auth", 
          status: 'success', 
          message: `✓ User authenticated: ${user.email}` 
        });
      } else {
        addResult({ 
          step: "User Auth", 
          status: 'warning', 
          message: "⚠️ No authenticated user found" 
        });
      }

      toast({
        title: "Diagnostic Complete",
        description: "Image storage diagnostic has finished running.",
      });

    } catch (error) {
      addResult({ 
        step: "General Error", 
        status: 'error', 
        message: `Unexpected error: ${error}`,
        details: error 
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Image Storage Diagnostic
        </CardTitle>
        <p className="text-sm text-gray-600">
          This tool will check your image storage configuration and help identify any issues.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostic} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Diagnostic...
            </>
          ) : (
            <>
              <FolderOpen className="h-4 w-4 mr-2" />
              Run Image Storage Diagnostic
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Diagnostic Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.step}</span>
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">{result.message}</p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>What this checks:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Supabase Storage bucket existence and creation</li>
            <li>Database records in inspection_images table</li>
            <li>Files stored in the bucket</li>
            <li>Upload functionality test</li>
            <li>User authentication status</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageStorageDiagnostic;
