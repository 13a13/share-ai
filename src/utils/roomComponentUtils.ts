
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

export const getDefaultComponentsByRoomType = (roomType: RoomType) => {
  const baseComponents = [
    { name: "Walls", type: "walls", isOptional: false },
    { name: "Ceiling", type: "ceiling", isOptional: false },
    { name: "Flooring", type: "flooring", isOptional: false },
    { name: "Doors & Frames", type: "doors", isOptional: false },
  ];

  const kitchenComponents = [
    ...baseComponents,
    { name: "Cabinetry", type: "cabinetry", isOptional: false },
    { name: "Countertops", type: "countertops", isOptional: false },
    { name: "Sink & Taps", type: "sink", isOptional: false },
    { name: "Appliances", type: "appliances", isOptional: false },
  ];

  const bathroomComponents = [
    ...baseComponents,
    { name: "Bath/Shower", type: "bath", isOptional: false },
    { name: "Toilet", type: "toilet", isOptional: false },
    { name: "Sink & Taps", type: "sink", isOptional: false },
    { name: "Mirrors", type: "mirrors", isOptional: false },
  ];

  const bedroomComponents = [
    ...baseComponents,
    { name: "Windows & Frames", type: "windows", isOptional: false },
    { name: "Closets", type: "closets", isOptional: false },
  ];

  const livingComponents = [
    ...baseComponents,
    { name: "Windows & Frames", type: "windows", isOptional: false },
    { name: "Light Fixtures", type: "lighting", isOptional: false },
  ];

  const additionalComponents = [
    { name: "Light Fixtures", type: "lighting", isOptional: true },
    { name: "Windows & Frames", type: "windows", isOptional: true },
    { name: "Electrical Outlets", type: "electrical", isOptional: true },
    { name: "HVAC Vents", type: "hvac", isOptional: true },
    { name: "Closets", type: "closets", isOptional: true },
    { name: "Built-in Shelving", type: "shelving", isOptional: true },
    { name: "Smoke Detectors", type: "smoke_detector", isOptional: true },
    { name: "Curtains/Blinds", type: "window_coverings", isOptional: true },
  ];

  switch (roomType) {
    case "kitchen":
      return [...kitchenComponents, ...additionalComponents];
    case "bathroom":
      return [...bathroomComponents, ...additionalComponents];
    case "bedroom":
      return [...bedroomComponents, ...additionalComponents];
    case "living_room":
      return [...livingComponents, ...additionalComponents];
    case "dining_room":
      return [...livingComponents, ...additionalComponents];
    case "entrance":
    case "hallway":
    case "garage":
    case "basement":
    case "attic":
    case "outdoor":
    default:
      return [...baseComponents, ...additionalComponents];
  }
};

// Add the missing export that was causing the error
export const ROOM_COMPONENT_CONFIGS = {
  kitchen: kitchenComponents,
  bathroom: bathroomComponents,
  bedroom: getDefaultComponentsByRoomType("bedroom"),
  living_room: getDefaultComponentsByRoomType("living_room"),
  dining_room: getDefaultComponentsByRoomType("dining_room"),
  entrance: getDefaultComponentsByRoomType("entrance"),
  hallway: getDefaultComponentsByRoomType("hallway"),
  garage: getDefaultComponentsByRoomType("garage"),
  basement: getDefaultComponentsByRoomType("basement"),
  attic: getDefaultComponentsByRoomType("attic"),
  outdoor: getDefaultComponentsByRoomType("outdoor"),
};

export const commonComponentTypes = [
  { label: "Furniture", value: "furniture" },
  { label: "Appliance", value: "appliance" },
  { label: "Electronic", value: "electronic" },
  { label: "Fixture", value: "fixture" },
  { label: "Storage", value: "storage" },
  { label: "Window Covering", value: "window_covering" },
  { label: "Decor", value: "decor" },
  { label: "Other", value: "other" }
];
