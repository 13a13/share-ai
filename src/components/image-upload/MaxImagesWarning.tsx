
import { Card } from "../ui/card";

interface MaxImagesWarningProps {
  maxImages: number;
  currentCount?: number;
  maxCount?: number;
}

const MaxImagesWarning = ({ 
  maxImages, 
  currentCount, 
  maxCount 
}: MaxImagesWarningProps) => {
  const displayCount = currentCount || maxCount || maxImages;
  
  return (
    <Card className="p-3 bg-yellow-50 border-yellow-200">
      <p className="text-sm text-yellow-700">
        Maximum number of images reached ({displayCount}). Remove some images to add more.
      </p>
    </Card>
  );
};

export default MaxImagesWarning;
