
import { Card } from "../ui/card";

interface MaxImagesWarningProps {
  maxImages: number;
}

const MaxImagesWarning = ({ maxImages }: MaxImagesWarningProps) => {
  return (
    <Card className="p-3 bg-yellow-50 border-yellow-200">
      <p className="text-sm text-yellow-700">
        Maximum number of images reached ({maxImages}). Remove some images to add more.
      </p>
    </Card>
  );
};

export default MaxImagesWarning;
