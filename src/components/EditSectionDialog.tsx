
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { conditionOptions } from "@/utils/roomComponentUtils";

interface SectionItem {
  id: string;
  numbering: string;
  title: string;
  description: string;
  condition?: string;
  cleanliness?: string;
  imageCount: number;
  roomId: string;
  componentId?: string;
  parentTitle: string;
}

interface EditSectionDialogProps {
  section: SectionItem;
  onSave: (updatedSection: SectionItem) => void;
  onCancel: () => void;
  open: boolean;
}

const cleanlinessOptions = [
  { value: "domestic_clean", label: "Domestic Clean" },
  { value: "needs_cleaning", label: "Needs Cleaning" },
  { value: "very_dirty", label: "Very Dirty" },
];

const EditSectionDialog = ({ section, onSave, onCancel, open }: EditSectionDialogProps) => {
  const [editedSection, setEditedSection] = useState<SectionItem>({ ...section });

  const handleChange = (field: keyof SectionItem, value: string) => {
    setEditedSection((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedSection);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {section.numbering} {section.title}</DialogTitle>
          {section.parentTitle && (
            <p className="text-sm text-gray-500">
              Room: {section.parentTitle}
            </p>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedSection.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              placeholder="Enter description"
            />
          </div>
          
          {editedSection.componentId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={editedSection.condition || ""}
                  onValueChange={(value) => handleChange("condition", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <span className={`h-2 w-2 rounded-full ${option.color} mr-2`}></span>
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cleanliness">Cleanliness</Label>
                <Select
                  value={editedSection.cleanliness || "domestic_clean"}
                  onValueChange={(value) => handleChange("cleanliness", value)}
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
            </>
          )}
          
          <div className="space-y-2">
            <Label>Photos</Label>
            <p className="text-sm text-gray-500">
              {editedSection.imageCount} {editedSection.imageCount === 1 ? "photo" : "photos"} attached
            </p>
            {/* In a complete implementation, you would add image upload functionality here */}
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSectionDialog;
