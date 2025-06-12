
import { Report } from "@/types";

interface ReportDisclaimersProps {
  report: Report;
}

const ReportDisclaimers = ({ report }: ReportDisclaimersProps) => {
  if (!report.disclaimers || report.disclaimers.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-xl font-bold mb-4 text-shareai-blue">Disclaimers</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-600">
        {report.disclaimers.map((disclaimer, index) => (
          <li key={index}>{disclaimer}</li>
        ))}
      </ul>
    </div>
  );
};

export default ReportDisclaimers;
