
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
  
  for (let i = 0; i < report.rooms.length; i++) {
    const room = report.rooms[i];
    console.log(`=== Processing room ${i+1}/${report.rooms.length}: ${room.name} ===`);
    
    try {
      // Record page number for this room
      pageMapper.recordRoom(room.id);
      
      // Generate room section
      await generateRoomSection(doc, room, i + 1);
      
      // Add new page for next room (except for last room)
      if (i < report.rooms.length - 1) {
        doc.addPage();
      }
      
      console.log(`=== Room ${room.name} completed successfully ===`);
    } catch (roomError) {
      console.error(`=== Error processing room ${room.name} ===`, roomError);
      // Continue with other rooms instead of failing entirely
      
      // Add a placeholder page for this room
      doc.text(`Error processing room: ${room.name}`, 20, 50);
      if (i < report.rooms.length - 1) {
        doc.addPage();
      }
    }
  }
};
