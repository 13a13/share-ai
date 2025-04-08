
import { Badge } from "@/components/ui/badge";
import { conditionOptions } from "@/utils/roomComponentUtils";
import { ConditionRating } from "@/types";

interface ComponentHeaderProps {
  name: string;
  isOptional: boolean;
  condition: ConditionRating;
  imagesCount: number;
}

const ComponentHeader = ({ name, isOptional, condition, imagesCount }: ComponentHeaderProps) => {
  return (
    <div className="flex items-center justify-between w-full pr-4">
      <span className="flex items-center gap-2">
        {name}
        {!isOptional && (
          <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">Required</Badge>
        )}
      </span>
      <div className="flex items-center gap-2">
        {imagesCount > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            {imagesCount} {imagesCount === 1 ? 'image' : 'images'}
          </Badge>
        )}
        {condition && (
          <Badge className={
            conditionOptions.find(opt => opt.value === condition)?.color || 
            "bg-gray-500"
          }>
            {conditionOptions.find(opt => opt.value === condition)?.label || condition}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ComponentHeader;
