
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle } from 'lucide-react';
import { Report } from '@/types';

interface CheckinReportInfoProps {
  checkinReport: Report;
}

const CheckinReportInfo = ({ checkinReport }: CheckinReportInfoProps) => {
  return (
    <Card className="mb-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Check-in Report Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Check-in Date</p>
              <span className="font-semibold">
                {new Date(checkinReport.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Rooms</p>
              <span className="font-semibold">
                {checkinReport.rooms.length || 0} rooms
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className="font-semibold">
                {checkinReport.status}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckinReportInfo;
