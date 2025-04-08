
import { ConditionRating, RoomType } from "@/types";

export const conditionOptions: { value: ConditionRating; label: string; color: string }[] = [
  { value: "excellent", label: "Excellent", color: "bg-green-500" },
  { value: "good", label: "Good", color: "bg-blue-500" },
  { value: "fair", label: "Fair", color: "bg-yellow-500" },
  { value: "poor", label: "Poor", color: "bg-orange-500" },
  { value: "needs_replacement", label: "Needs Replacement", color: "bg-red-500" },
];

export const standardRoomComponents = [
  { name: "Walls", type: "walls", isOptional: false },
  { name: "Ceiling", type: "ceiling", isOptional: false },
  { name: "Flooring", type: "flooring", isOptional: false },
  { name: "Doors & Frames", type: "doors", isOptional: false },
  { name: "Windows & Frames", type: "windows", isOptional: true },
  { name: "Lighting & Electrical", type: "lighting", isOptional: true },
  { name: "Furniture & Storage", type: "furniture", isOptional: true },
];

export const bathroomComponents = [
  ...standardRoomComponents,
  { name: "Bath/Shower", type: "bath", isOptional: false },
  { name: "Vanity/Sink", type: "vanity", isOptional: true },
  { name: "Toilet", type: "toilet", isOptional: false },
  { name: "Mirror", type: "mirror", isOptional: true },
];

export const kitchenComponents = [
  ...standardRoomComponents,
  { name: "Cabinetry & Countertops", type: "cabinetry", isOptional: false },
  { name: "Sink & Taps", type: "sink", isOptional: false },
  { name: "Refrigerator", type: "refrigerator", isOptional: true },
  { name: "Oven/Stove", type: "oven", isOptional: true },
  { name: "Dishwasher", type: "dishwasher", isOptional: true },
  { name: "Microwave", type: "microwave", isOptional: true },
];

export const getDefaultComponentsByRoomType = (roomType: RoomType): { name: string; type: string; isOptional: boolean }[] => {
  switch (roomType) {
    case "bathroom":
      return bathroomComponents;
    case "kitchen":
      return kitchenComponents;
    default:
      return standardRoomComponents;
  }
};
