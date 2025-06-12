
import { Report } from "@/types";
import CheckoutButton from "@/components/CheckoutButton";

interface ReportStatusBannerProps {
  report: Report;
  canStartCheckout: boolean;
}

const ReportStatusBanner = ({ report, canStartCheckout }: ReportStatusBannerProps) => {
  if (!canStartCheckout) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-900">Ready for Checkout</h3>
          <p className="text-blue-700 text-sm">
            This completed check-in report can be used to create a checkout assessment.
          </p>
        </div>
        <CheckoutButton 
          report={report}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        />
      </div>
    </div>
  );
};

export default ReportStatusBanner;
