
import { Card, CardContent } from "@/components/ui/card";
import { BookCheck } from "lucide-react";

const RoomDetailsEmptyState = () => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <BookCheck className="h-16 w-16 text-verifyvision-teal mb-4" />
        <h3 className="text-xl font-medium mb-2">No Room Selected</h3>
        <p className="text-gray-500 text-center mb-6 max-w-md">
          Select a room from the list on the left to edit its details or add a new room.
        </p>
      </CardContent>
    </Card>
  );
};

export default RoomDetailsEmptyState;
