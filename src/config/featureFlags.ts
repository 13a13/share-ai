
export const FEATURE_FLAGS = {
  MULTIPLE_IMAGE_CAPTURE: process.env.NODE_ENV === 'development' || 
                          (typeof localStorage !== 'undefined' && localStorage.getItem('enableMultipleImageCapture') === 'true'),
};
