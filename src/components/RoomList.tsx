
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Room, RoomType } from "@/types";

const roomFormSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  type: z.string().min(1, "Room type is required"),
});

export type RoomFormValues = z.infer<typeof roomFormSchema>;

interface RoomListProps {
  rooms: Room[];
  currentRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onAddRoom: (values: RoomFormValues) => Promise<void>;
  isSubmittingRoom: boolean;
}

const RoomList = ({ 
  rooms, 
  currentRoomId, 
  onSelectRoom, 
  onAddRoom, 
  isSubmittingRoom 
}: RoomListProps) => {
  const roomForm = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      type: "living_room",
    },
  });

  const roomTypeOptions = [
    { value: "entrance", label: "Entrance" },
    { value: "hallway", label: "Hallway" },
    { value: "living_room", label: "Living Room" },
    { value: "dining_room", label: "Dining Room" },
    { value: "kitchen", label: "Kitchen" },
    { value: "bedroom", label: "Bedroom" },
    { value: "bathroom", label: "Bathroom" },
    { value: "garage", label: "Garage" },
    { value: "basement", label: "Basement" },
    { value: "attic", label: "Attic" },
    { value: "outdoor", label: "Outdoor Space" },
    { value: "other", label: "Other Room" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Home className="h-5 w-5 mr-2 text-shareai-teal" />
          Rooms
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        {rooms.length === 0 ? (
          <p className="text-gray-500 text-sm">No rooms added yet.</p>
        ) : (
          <ul className="space-y-2">
            {rooms.map((room) => (
              <li key={room.id}>
                <Button
                  variant={currentRoomId === room.id ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    currentRoomId === room.id 
                      ? "bg-shareai-teal hover:bg-shareai-teal/90" 
                      : ""
                  }`}
                  onClick={() => onSelectRoom(room.id)}
                >
                  {room.name}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Form {...roomForm}>
          <form onSubmit={roomForm.handleSubmit(onAddRoom)} className="w-full space-y-3">
            <FormField
              control={roomForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Master Bedroom" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={roomForm.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roomTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmittingRoom}
            >
              {isSubmittingRoom ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
};

export default RoomList;
