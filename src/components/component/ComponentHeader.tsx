
import { Badge } from "@/components/ui/badge";
import { ConditionRating } from "@/types";
import { InfoIcon } from "lucide-react";
import { conditionOptions } from "@/utils/roomComponentUtils";

interface ComponentHeaderProps {
  name: string;
  isOptional: boolean;
  condition: ConditionRating | undefined;
  imagesCount: number;
}

const ComponentHeader = ({ name, isOptional, condition, imagesCount }: ComponentHeaderProps) => {
  const conditionOption = condition ? conditionOptions.find(
    (option) => option.value === condition
  ) : null;

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <span className="font-medium">{name}</span>
        {!isOptional && (
          <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">
            Required
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {condition && conditionOption && (
          <Badge className={conditionOption.color || "bg-gray-500"}>
            {conditionOption.label || String(condition)}
          </Badge>
        )}
        <Badge variant="outline" className="text-[10px]">
          {imagesCount} {imagesCount === 1 ? "image" : "images"}
        </Badge>
      </div>
    </div>
  );
};

export default ComponentHeader;
