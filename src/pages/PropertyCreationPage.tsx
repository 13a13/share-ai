
import PropertyForm from "@/components/property/PropertyForm";
import PropertyPageHeader from "@/components/property/PropertyPageHeader";

const PropertyCreationPage = () => {
  return (
    <div className="shareai-container py-8">
      <PropertyPageHeader 
        title="Add New Property"
        description="Enter the details of your property to create a record in the system."
      />
      <PropertyForm />
    </div>
  );
};

export default PropertyCreationPage;
