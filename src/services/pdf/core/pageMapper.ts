
import { Report } from "@/types";

/**
 * Manages page mapping and tracking for table of contents
 */
export class PageMapper {
  private pageMap: Record<string, number> = {};
  private currentPage: number;

  constructor(startPage: number = 2) {
    this.currentPage = startPage;
  }

  /**
   * Record a page number for a section
   */
  recordSection(key: string): number {
    this.pageMap[key] = this.currentPage;
    return this.currentPage++;
  }

  /**
   * Record a page number for a room
   */
  recordRoom(roomId: string): number {
    this.pageMap[roomId] = this.currentPage;
    return this.currentPage++;
  }

  /**
   * Get the current page map
   */
  getPageMap(): Record<string, number> {
    return { ...this.pageMap };
  }

  /**
   * Get the current page number
   */
  getCurrentPage(): number {
    return this.currentPage;
  }
}
