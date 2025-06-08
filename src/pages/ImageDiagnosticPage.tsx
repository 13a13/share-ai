
import ImageStorageDiagnostic from "@/components/ImageStorageDiagnostic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ImageDiagnosticPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Image Storage Troubleshooting</CardTitle>
            <p className="text-gray-600">
              Use this page to diagnose and fix issues with image storage in your application.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">About Image Storage</h3>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>Images in this application are stored in:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Supabase Storage:</strong> Physical files in the "inspection-images" bucket</li>
                    <li><strong>Database Records:</strong> Metadata in the "inspection_images" table</li>
                    <li><strong>File Structure:</strong> Organized by reportId/roomId/imageId.jpg</li>
                  </ul>
                  <p className="mt-3">
                    <strong>Common Issues:</strong> Missing bucket, permission errors, or failed uploads.
                  </p>
                </div>
              </div>

              <ImageStorageDiagnostic />

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Quick Fixes</h3>
                <div className="text-sm text-yellow-700 space-y-2">
                  <p>If you're having issues:</p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Run the diagnostic above to identify problems</li>
                    <li>Check if the "inspection-images" bucket exists in Supabase Storage</li>
                    <li>Verify you're logged in (authentication required for uploads)</li>
                    <li>Check browser console for JavaScript errors during upload</li>
                    <li>Ensure your Supabase project has sufficient storage quota</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageDiagnosticPage;
