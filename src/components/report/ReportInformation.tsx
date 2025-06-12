
import { Report } from "@/types";

interface ReportInformationProps {
  report: Report;
}

const ReportInformation = ({ report }: ReportInformationProps) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4 text-shareai-blue">Report Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Report Date</p>
            <p>{report.reportInfo?.reportDate ? new Date(report.reportInfo.reportDate).toLocaleDateString() : "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Report Type</p>
            <p>{report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Inspector</p>
            <p>{report.reportInfo?.clerk || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p>{report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
          </div>
          {report.reportInfo?.tenantName && (
            <div>
              <p className="text-sm text-gray-500">Tenant</p>
              <p>{report.reportInfo.tenantName}</p>
            </div>
          )}
        </div>
        
        {report.reportInfo?.additionalInfo && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Additional Information</p>
            <p>{report.reportInfo.additionalInfo}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportInformation;
