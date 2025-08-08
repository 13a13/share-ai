
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoomComponent } from "@/types";
import { conditionOptions } from "@/utils/roomComponentUtils";
import { InfoIcon } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SignedImage from "@/components/common/SignedImage";

interface RoomComponentViewProps {
  component: RoomComponent;
}

const RoomComponentView = ({ component }: RoomComponentViewProps) => {
  const conditionOption = component.condition ? conditionOptions.find(
    (option) => option.value === component.condition
  ) : null;

  return (
    <Card className="mb-2 transition-all duration-300 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{component.name}</h3>
              {!component.isOptional && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">Required</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">This component is required and cannot be removed</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {component.condition && conditionOption && (
              <Badge className={conditionOption?.color || "bg-gray-500"}>
                {conditionOption?.label || String(component.condition)}
              </Badge>
            )}
          </div>

          {component.description && (
            <div>
              <p className="text-sm text-gray-700">{component.description}</p>
            </div>
          )}

          {component.notes && (
            <div>
              <p className="text-xs text-gray-600 italic">{component.notes}</p>
            </div>
          )}

          {component.images && component.images.length > 0 && (
            <div className="mt-2">
              <div className="grid grid-cols-3 gap-2">
                {component.images.map((image) => (
                  <div key={image.id} className="relative rounded overflow-hidden border">
                    <SignedImage
                      src={image.url}
                      alt={`${component.name}`}
                      className="w-full h-20 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomComponentView;
