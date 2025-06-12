
import ImageFileInput from "../ImageFileInput";

interface ImageUploadControlsProps {
  componentId: string;
  isProcessing: boolean;
  compressionInProgress: boolean;
  handleImageCapture: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCameraCapture: (imageData: string) => void;
  canAddMore: boolean;
  disabled: boolean;
  totalImages: number;
  maxImages: number;
  hasStagingImages?: boolean;
  onImageCapture?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCameraCapture?: (imageData: string) => void;
  onProcessImages?: () => void;
  onCancelStaging?: () => void;
}

const ImageUploadControls = ({
  componentId,
  isProcessing,
  compressionInProgress,
  handleImageCapture,
  handleCameraCapture,
  canAddMore,
  disabled,
  totalImages,
  maxImages,
  hasStagingImages,
  onImageCapture,
  onCameraCapture,
  onProcessImages,
  onCancelStaging
}: ImageUploadControlsProps) => {
  // Use the provided handlers or fall back to the handle functions
  const imageHandler = onImageCapture || handleImageCapture;
  const cameraHandler = onCameraCapture || handleCameraCapture;

  return (
    <div className="flex flex-col gap-2">
      <ImageFileInput
        id={`image-upload-${componentId}`}
        isProcessing={isProcessing || compressionInProgress}
        onChange={imageHandler}
        onImageCapture={cameraHandler}
        multiple={true}
        disabled={!canAddMore || disabled}
        totalImages={totalImages}
        maxImages={maxImages}
        compressionInProgress={compressionInProgress}
      />
      <div className="text-sm text-gray-500 mt-1">
        {totalImages}/{maxImages} images
      </div>
      
      {hasStagingImages && (onProcessImages || onCancelStaging) && (
        <div className="flex justify-end gap-2 mt-2">
          {onCancelStaging && (
            <button
              onClick={onCancelStaging}
              className="text-sm text-gray-600 hover:text-gray-800"
              disabled={isProcessing || compressionInProgress}
            >
              Cancel
            </button>
          )}
          {onProcessImages && (
            <button
              onClick={onProcessImages}
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              disabled={isProcessing || compressionInProgress}
            >
              Process Images
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploadControls;
