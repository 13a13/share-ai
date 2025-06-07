
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AssessmentInstructions = () => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="font-semibold text-blue-800 mb-2">Assessment Instructions</h3>
      <ul className="text-sm text-blue-700 space-y-1">
        <li>• Review the check-in reference data for each component</li>
        <li>• Click on each component to expand and assess its current condition</li>
        <li>• Mark as "No Changes" if the component looks the same as check-in</li>
        <li>• Mark as "Changes Found" if you notice any differences</li>
        <li>• Take photos and add descriptions for any changes</li>
      </ul>
    </div>
  );
};

export default AssessmentInstructions;
