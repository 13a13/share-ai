
import { useParams } from "react-router-dom";

const CheckoutPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-blue-900 mb-6">
          Checkout Report
        </h1>
        <p className="text-gray-600">Report ID: {id}</p>
        <div className="mt-6">
          <p>Checkout functionality will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
