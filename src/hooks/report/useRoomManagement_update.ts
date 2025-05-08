
// This is an extension for handleUpdateGeneralCondition in useRoomManagement.tsx
// Since the full file is too long, add this to the existing function

const handleUpdateGeneralCondition = async (roomId: string, generalCondition: string) => {
  if (!report) return;
  
  const currentRoom = report.rooms.find(room => room.id === roomId);
  if (!currentRoom) return;
  
  try {
    // Get the inspection for this room
    const { data: inspection } = await supabase
      .from('inspections')
      .select('id, report_info')
      .eq('room_id', roomId)
      .single();
    
    if (inspection) {
      // Save general condition in report_info
      await supabase
        .from('inspections')
        .update({
          report_info: {
            ...(inspection.report_info || {}),
            generalCondition
          }
        })
        .eq('id', inspection.id);
    }
    
    const updatedRoom = {
      ...currentRoom,
      generalCondition,
    };
    
    const savedRoom = await ReportsAPI.updateRoom(report.id, roomId, updatedRoom);
    
    if (savedRoom) {
      setReport(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          rooms: prev.rooms.map(room => 
            room.id === savedRoom.id ? savedRoom : room
          ),
        };
      });
    }
  } catch (error) {
    console.error("Error saving general condition:", error);
    toast({
      title: "Error",
      description: "Failed to save general condition. Please try again.",
      variant: "destructive",
    });
  }
};
