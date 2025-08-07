// Centralized API for updating a single component in a report
// Ensures consistent persistence across the app
import { supabase } from "@/integrations/supabase/client";
import { RoomComponent } from "@/types";

const parseReportInfo = (reportInfo: any): any => {
  if (!reportInfo) return {};
  if (typeof reportInfo === "string") {
    try {
      return JSON.parse(reportInfo);
    } catch {
      return {};
    }
  }
  return reportInfo;
};

export const ComponentUpdateAPI = {
  async updateComponent(
    reportId: string,
    roomId: string,
    componentId: string,
    updates: Partial<RoomComponent>
  ): Promise<boolean> {
    try {
      const { data: inspection, error } = await supabase
        .from("inspections")
        .select("room_id, report_info")
        .eq("id", reportId)
        .maybeSingle();

      if (error) {
        console.error("ComponentUpdateAPI: fetch inspection error", error);
        return false;
      }

      if (!inspection) {
        console.error("ComponentUpdateAPI: inspection not found", reportId);
        return false;
      }

      const reportInfo = parseReportInfo(inspection.report_info);
      const isMainRoom = inspection.room_id === roomId;

      if (isMainRoom) {
        const components = Array.isArray(reportInfo.components)
          ? reportInfo.components
          : [];

        const updatedComponents = components.map((comp: any) => {
          if (comp.id === componentId) {
            return {
              ...comp,
              ...updates,
              analysis: comp.analysis || {},
              images: comp.images || [],
            };
          }
          return comp;
        });

        const { error: updateError } = await supabase
          .from("inspections")
          .update({
            report_info: {
              ...reportInfo,
              components: updatedComponents,
            },
          })
          .eq("id", reportId);

        if (updateError) {
          console.error("ComponentUpdateAPI: update main room error", updateError);
          return false;
        }
      } else {
        const additionalRooms = Array.isArray(reportInfo.additionalRooms)
          ? reportInfo.additionalRooms
          : [];
        const roomIndex = additionalRooms.findIndex((room: any) => room.id === roomId);
        if (roomIndex === -1) {
          console.error("ComponentUpdateAPI: room not found in additionalRooms", roomId);
          return false;
        }
        const room = additionalRooms[roomIndex];
        const components = Array.isArray(room.components) ? room.components : [];
        const updatedComponents = components.map((comp: any) => {
          if (comp.id === componentId) {
            return {
              ...comp,
              ...updates,
              analysis: comp.analysis || {},
              images: comp.images || [],
            };
          }
          return comp;
        });
        additionalRooms[roomIndex] = { ...room, components: updatedComponents };

        const { error: updateError } = await supabase
          .from("inspections")
          .update({
            report_info: {
              ...reportInfo,
              additionalRooms,
            },
          })
          .eq("id", reportId);

        if (updateError) {
          console.error("ComponentUpdateAPI: update additional room error", updateError);
          return false;
        }
      }

      return true;
    } catch (e) {
      console.error("ComponentUpdateAPI: unexpected error", e);
      return false;
    }
  },
};
