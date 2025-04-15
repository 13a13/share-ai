
export interface SectionItem {
  id: string;
  numbering: string;
  title: string;
  description: string;
  condition?: string;
  cleanliness?: string;
  imageCount: number;
  roomId: string;
  componentId?: string;
  parentTitle: string;
}
