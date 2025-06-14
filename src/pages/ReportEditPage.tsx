
import { useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import SaveProgressIndicator from "@/components/ui/SaveProgressIndicator";
import ReportHeader from "@/components/ReportHeader";
import ReportInfoForm from "@/components/ReportInfoForm";
import EmptyRoomsState from "@/components/EmptyRoomsState";
import ReportRoomForm from "@/components/ReportRoomForm";
import ReportLoadingState from "@/components/ReportLoadingState";
import UnifiedRoomView from "@/components/room/UnifiedRoomView";
import { useReportEditor, ReportInfoFormValues } from "@/hooks/report/useReportEditor";

const ReportEditPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const isMobile = useIsMobile();
  
  const {
    report,
    property,
    isLoading,
    isSaving,
    isSubmittingRoom,
    activeRoomIndex,
    hasError,
    saveProgress,
    handleAddRoom,
    handleUpdateGeneralCondition,
    handleSaveSection,
    handleUpdateComponents,
    handleDeleteRoom,
    handleSaveReportInfo,
    handleSaveReport,
    handleCompleteReport,
    handleNavigateRoom,
  } = useReportEditor(reportId);
  
  // Show loading or error states
  if (isLoading || hasError || !report || !property) {
    return <ReportLoadingState isLoading={isLoading} hasError={hasError} />;
  }
  
  console.log(`📄 ReportEditPage: propertyName="${property.name}"`);
  
  const reportInfoDefaults: ReportInfoFormValues = {
    reportDate: report.reportInfo?.reportDate 
      ? new Date(report.reportInfo.reportDate).toISOString().substring(0, 10)
      : new Date().toISOString().substring(0, 10),
    clerk: report.reportInfo?.clerk || "Inspector",
    inventoryType: report.reportInfo?.inventoryType || "Full Inventory",
    tenantPresent: report.reportInfo?.tenantPresent || false,
    tenantName: report.reportInfo?.tenantName || "",
    additionalInfo: report.reportInfo?.additionalInfo || "",
  };
  
  // Ensure report.rooms is always defined
  const hasRooms = report.rooms && report.rooms.length > 0;
  
  return (
    <div className="shareai-container pb-24 sm:pb-8" data-report-id={report.id}>
      <ReportHeader 
        title={report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) + " Report"}
        address={`${property.address}, ${property.city}, ${property.state} ${property.zipCode}`}
        status={report.status}
        isSaving={isSaving}
        onSave={handleSaveReport}
        onComplete={handleCompleteReport}
      />
      
      {/* Add save progress indicator */}
      {saveProgress && (
        <div className="mb-4">
          <SaveProgressIndicator progress={saveProgress} />
        </div>
      )}
      
      <ReportInfoForm 
        defaultValues={reportInfoDefaults}
        onSave={handleSaveReportInfo}
        isSaving={isSaving}
      />
      
      <div className="my-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Rooms</h2>
        </div>
        
        {!hasRooms ? (
          <EmptyRoomsState />
        ) : (
          <div className="space-y-4 mb-6">
            {report.rooms.map((room, index) => (
              <UnifiedRoomView
                key={room.id}
                reportId={report.id}
                room={room}
                roomIndex={index}
                totalRooms={report.rooms.length}
                propertyName={property.name}
                onNavigateRoom={handleNavigateRoom}
                onUpdateGeneralCondition={handleUpdateGeneralCondition}
                onUpdateComponents={handleUpdateComponents}
                onDeleteRoom={handleDeleteRoom}
                isComplete={room.components?.filter(c => !c.isOptional).every(c => 
                  c.description && c.condition && (c.images.length > 0 || c.notes)
                )}
              />
            ))}
          </div>
        )}
        
        <ReportRoomForm 
          onAddRoom={handleAddRoom}
          isSubmittingRoom={isSubmittingRoom}
        />
      </div>
      
      {/* Add sticky bottom bar for mobile navigation if needed */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-around z-40 shadow-lg">
          <Button
            variant="outline"
            onClick={() => window.scrollTo(0, 0)}
            className="text-xs flex-1 mx-1"
          >
            Top
          </Button>
          <Button
            onClick={handleSaveReport}
            disabled={isSaving}
            className="bg-shareai-teal hover:bg-shareai-teal/90 text-xs flex-1 mx-1"
          >
            {isSaving ? "Saving..." : "Save Report"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReportEditPage;
