import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { normalizeConditionPoints } from "@/services/imageProcessingService";

interface ComponentEditFormProps {
  componentId: string;
  description: string;
  conditionSummary: string;
  conditionPoints: any[]; // Support both string[] and enhanced object[]
  condition: string;
  cleanliness: string;
  cleanlinessOptions: { value: string; label: string }[];
  conditionRatingOptions: { value: string; label: string; color: string }[];
  notes?: string;
  onUpdateField: (field: string, value: string | string[]) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ComponentEditForm = ({
  componentId,
  description,
  conditionSummary,
  conditionPoints,
  condition,
  cleanliness,
  cleanlinessOptions,
  conditionRatingOptions,
  notes = "",
  onUpdateField,
  onSave,
  onCancel
}: ComponentEditFormProps) => {
  // Convert points for editing - handle both string[] and object[]
  const normalizedPoints = normalizeConditionPoints(conditionPoints);
  
  // Update points text when conditionPoints prop changes
  useEffect(() => {
    // We still need to handle conditionPoints being passed to the component,
    // but we won't display the editor for them anymore
  }, [conditionPoints]);
  
  const handleSave = () => {
    onSave();
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${componentId}-description`}>Description</Label>
        <Textarea
          id={`${componentId}-description`}
          value={description}
          onChange={(e) => onUpdateField("description", e.target.value)}
          placeholder="Describe the component..."
          className="min-h-[80px]"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`${componentId}-condition-summary`}>Condition Summary</Label>
        <Textarea
          id={`${componentId}-condition-summary`}
          value={conditionSummary}
          onChange={(e) => onUpdateField("conditionSummary", e.target.value)}
          placeholder="Summarize the condition..."
          className="min-h-[60px]"
        />
      </div>
      
      {/* Condition points section removed as requested */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${componentId}-condition`}>Condition Rating</Label>
          <Select 
            value={condition}
            onValueChange={(value) => onUpdateField("condition", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {conditionRatingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center">
                    <span 
                      className={`w-3 h-3 rounded-full ${option.color} mr-2`} 
                    />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`${componentId}-cleanliness`}>Cleanliness</Label>
          <Select 
            value={cleanliness}
            onValueChange={(value) => onUpdateField("cleanliness", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cleanliness" />
            </SelectTrigger>
            <SelectContent>
              {cleanlinessOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`${componentId}-notes`}>Additional Notes</Label>
        <Textarea
          id={`${componentId}-notes`}
          value={notes}
          onChange={(e) => onUpdateField("notes", e.target.value)}
          placeholder="Any additional notes or observations..."
          className="min-h-[60px]"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="gap-1"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          className="gap-1 bg-shareai-teal hover:bg-shareai-teal/90"
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
};

export default ComponentEditForm;
