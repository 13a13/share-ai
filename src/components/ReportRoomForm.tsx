
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoomType } from "@/types";

const roomFormSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  type: z.string().min(1, "Room type is required"),
});

export type RoomFormValues = z.infer<typeof roomFormSchema>;

interface ReportRoomFormProps {
  onAddRoom: (values: RoomFormValues) => Promise<void>;
  isSubmittingRoom: boolean;
}

const ReportRoomForm = ({ onAddRoom, isSubmittingRoom }: ReportRoomFormProps) => {
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
      <CardHeader>
        <CardTitle className="text-lg">Add New Room</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...roomForm}>
          <form onSubmit={roomForm.handleSubmit(onAddRoom)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            
            <Button 
              type="submit" 
              className="bg-shareai-teal hover:bg-shareai-teal/90"
              disabled={isSubmittingRoom}
            >
              {isSubmittingRoom ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Room...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReportRoomForm;
