
import { Card, CardContent } from "@/components/ui/card";
import { BookCheck } from "lucide-react";

const EmptyRoomsState = () => {
  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <BookCheck className="h-16 w-16 text-shareai-teal mb-4" />
        <h3 className="text-xl font-medium mb-2">No Rooms Added</h3>
        <p className="text-gray-500 text-center mb-6 max-w-md">
          Add rooms to your report to begin documenting property conditions.
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyRoomsState;
