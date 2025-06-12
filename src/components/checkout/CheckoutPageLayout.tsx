
import Header from '@/components/Header';
import CheckoutPageHeader from './CheckoutPageHeader';
import CheckoutProgress from './CheckoutProgress';
import CheckinReportInfo from './CheckinReportInfo';
import { Report } from '@/types';

interface CheckoutPageLayoutProps {
  checkinReport: Report;
  currentStep: number;
  isDraftSaved: boolean;
  children: React.ReactNode;
}

const CheckoutPageLayout = ({ 
  checkinReport, 
  currentStep, 
  isDraftSaved, 
  children 
}: CheckoutPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <CheckoutPageHeader
          currentStep={currentStep}
          propertyName={checkinReport?.property?.name}
          isDraftSaved={isDraftSaved}
        />

        <CheckoutProgress currentStep={currentStep} />

        <CheckinReportInfo checkinReport={checkinReport} />

        {children}
      </div>
    </div>
  );
};

export default CheckoutPageLayout;
