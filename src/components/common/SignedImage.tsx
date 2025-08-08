import React, { useEffect, useState } from 'react';
import { resolveImageUrl } from '@/utils/storage/signedUrlUtils';

interface SignedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  bucketName?: string;
  expiresIn?: number; // seconds
}

const SignedImage: React.FC<SignedImageProps> = ({ src, bucketName = 'inspection-images', expiresIn = 3600, alt = '', ...rest }) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        if (!src) {
          setResolvedSrc('');
          return;
        }
        const isHttp = src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:');
        if (isHttp) {
          if (isMounted) setResolvedSrc(src);
          return;
        }
        const signed = await resolveImageUrl(src, bucketName, expiresIn);
        if (isMounted) setResolvedSrc(signed || src);
      } catch (e) {
        console.warn('Failed to resolve signed URL, using original:', e);
        if (isMounted) setResolvedSrc(src);
      }
    };
    run();
    return () => { isMounted = false; };
  }, [src, bucketName, expiresIn]);

  return <img src={resolvedSrc} alt={alt} {...rest} />;
};

export default SignedImage;
