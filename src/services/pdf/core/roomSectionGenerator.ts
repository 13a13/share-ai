
import { jsPDF } from "jspdf";
import { Report } from "@/types";
import { generateRoomSection } from "../sections/roomSection";
import { PageMapper } from "./pageMapper";

/**
 * Handles generation of all room sections
 */
export const generateRoomSections = async (
  doc: jsPDF,
  report: Report,
  pageMapper: PageMapper
): Promise<void> => {
  console.log("=== Generating room sections ===");
  
  // Filter out placeholder/empty rooms (no components, sections, images, or general condition)
  const roomsToInclude = report.rooms.filter((room) => {
    const hasComponents = Array.isArray(room.components) && room.components.length > 0;
    const hasSections = Array.isArray(room.sections) && room.sections.length > 0;
    const hasImages = Array.isArray(room.images) && room.images.length > 0;
    const hasGeneral = typeof room.generalCondition === 'string' && room.generalCondition.trim() !== '';
    return hasComponents || hasSections || hasImages || hasGeneral;
  });
  
  for (let i = 0; i < roomsToInclude.length; i++) {
    const room = roomsToInclude[i];
    console.log(`=== Processing room ${i+1}/${roomsToInclude.length}: ${room.name} ===`);
    
    try {
      // Record page number for this room
      pageMapper.recordRoom(room.id);
      
      // Generate room section
      await generateRoomSection(doc, room, i + 1);
      
      // Add new page for next room (except for last room)
      if (i < roomsToInclude.length - 1) {
        doc.addPage();
      }
      
      console.log(`=== Room ${room.name} completed successfully ===`);
    } catch (roomError) {
      console.error(`=== Error processing room ${room.name} ===`, roomError);
      // Continue with other rooms instead of failing entirely
      
      // Add a placeholder page for this room
      doc.text(`Error processing room: ${room.name}`, 20, 50);
      if (i < roomsToInclude.length - 1) {
        doc.addPage();
      }
    }
  }
};
