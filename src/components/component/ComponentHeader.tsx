
import { Badge } from "@/components/ui/badge";
import { ConditionRating } from "@/types";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { conditionOptions } from "@/utils/roomComponentUtils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComponentHeaderProps {
  name: string;
  isOptional: boolean;
  condition: ConditionRating | undefined;
  imagesCount: number;
  isAnalyzed?: boolean;
}

const ComponentHeader = ({ 
  name, 
  isOptional, 
  condition, 
  imagesCount,
  isAnalyzed = false
}: ComponentHeaderProps) => {
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
        {isAnalyzed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-green-500 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="text-[10px]">AI Complete</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">This component has been analyzed by AI</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {!isAnalyzed && imagesCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-amber-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-[10px]">Awaiting Analysis</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Run AI analysis to complete this component</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
