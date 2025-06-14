import { RoomComponent } from "@/types";
import { ROOM_COMPONENT_CONFIGS } from "@/utils/roomComponentUtils";
import { useComponentState } from "./useComponentState";
import { useComponentOperations } from "./useComponentOperations";
import { useComponentImageHandling } from "./useComponentImageHandling";

interface UseRoomComponentsProps {
  roomId: string;
  roomType: string;
  propertyName?: string;
  roomName?: string;
  initialComponents: RoomComponent[];
  onChange: (updatedComponents: RoomComponent[]) => void;
}

interface ComponentConfig {
  name: string;
  type: string;
  isOptional?: boolean;
}

interface UseRoomComponentsReturn {
  components: RoomComponent[];
  isProcessing: { [key: string]: boolean };
  expandedComponents: string[];
  selectedComponentType: string;
  availableComponents: ComponentConfig[];
  propertyName?: string;
  roomName?: string;
  setSelectedComponentType: React.Dispatch<React.SetStateAction<string>>;
  handleAddComponent: () => void;
  addCustomComponent: (name: string) => void;
  handleRemoveComponent: (componentId: string) => void;
  handleUpdateComponent: (componentId: string, updates: Partial<RoomComponent>) => void;
  toggleEditMode: (componentId: string) => void;
  handleRemoveImage: (componentId: string, imageId: string) => void;
  handleImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  handleComponentProcessingState: (componentId: string, isProcessing: boolean) => void;
  toggleExpandComponent: (componentId: string) => void;
}

export function useRoomComponents({
  roomId,
  roomType,
  propertyName: initialPropertyName,
  roomName: initialRoomName,
  initialComponents,
  onChange
}: UseRoomComponentsProps): UseRoomComponentsReturn {
  // --------- NEW: fetch real property/room name if missing ---------
  const [propertyName, setPropertyName] = useState(initialPropertyName ?? "");
  const [roomName, setRoomName] = useState(initialRoomName ?? "");

  useEffect(() => {
    async function fetchNamesIfNeeded() {
      if ((!propertyName || propertyName === "unknown_property" || propertyName.trim() === "") && window.supabase) {
        try {
          const { data, error } = await window.supabase
            .from('rooms')
            .select('id, name, property_id, properties(name)')
            .eq('id', roomId)
            .maybeSingle();
          if (data) {
            setRoomName(data.name ?? "");
            setPropertyName(data.properties?.name ?? "");
          }
        } catch (err) { /* ignore */ }
      }
    }
    fetchNamesIfNeeded();
  }, [roomId]);

  // Get available components for the room type
  const availableComponents = ROOM_COMPONENT_CONFIGS[roomType as keyof typeof ROOM_COMPONENT_CONFIGS] || [];

  // Component state management
  const {
    components,
    updateComponents,
    isProcessing,
    expandedComponents,
    setExpandedComponents,
    selectedComponentType,
    setSelectedComponentType,
    handleComponentProcessingState,
    toggleExpandComponent
  } = useComponentState({
    initialComponents,
    onChange
  });

  // Component CRUD operations
  const {
    handleAddComponent,
    addCustomComponent,
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode
  } = useComponentOperations({
    components,
    updateComponents,
    expandedComponents,
    setExpandedComponents,
    availableComponents,
    selectedComponentType,
    setSelectedComponentType
  });

  // Image handling operations
  const {
    handleRemoveImage,
    handleImagesProcessed
  } = useComponentImageHandling({
    components,
    updateComponents,
    expandedComponents,
    setExpandedComponents,
    onChange,
    propertyName,
    roomName
  });

  return {
    components,
    isProcessing,
    expandedComponents,
    selectedComponentType,
    availableComponents,
    propertyName,
    roomName,
    setSelectedComponentType,
    handleAddComponent,
    addCustomComponent,
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode,
    handleRemoveImage,
    handleImagesProcessed,
    handleComponentProcessingState,
    toggleExpandComponent
  };
}
