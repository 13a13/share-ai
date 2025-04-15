
import { Badge } from "@/components/ui/badge";
import { ConditionRating } from "@/types";
import { conditionOptions } from "@/utils/roomComponentUtils";

interface ComponentHeaderProps {
  name: string;
  isOptional: boolean;
  condition?: ConditionRating;
  imagesCount: number;
  isAnalyzed?: boolean;
  isCustom?: boolean;
}

const ComponentHeader = ({ 
  name, 
  isOptional, 
  condition, 
  imagesCount,
  isAnalyzed = false,
  isCustom = false
}: ComponentHeaderProps) => {
  const conditionOption = condition ? conditionOptions.find(
    (option) => option.value === condition
  ) : null;

  return (
    <div className="flex w-full justify-between items-center">
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-base">{name}</h3>
        {isCustom && (
          <Badge className="bg-purple-500 text-white">Custom</Badge>
        )}
        {!isOptional && !isCustom && (
          <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">Required</Badge>
        )}
        {imagesCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {imagesCount} {imagesCount === 1 ? 'photo' : 'photos'}
          </Badge>
        )}
      </div>
      {condition && conditionOption && (
        <Badge className={conditionOption?.color || "bg-gray-500"}>
          {conditionOption?.label || condition}
        </Badge>
      )}
    </div>
  );
};

export default ComponentHeader;
