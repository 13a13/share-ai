
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export const uploadReportImage = async (
  file: File | string, 
  reportId: string, 
  propertyAddress: string, 
  reportType: string
): Promise<string | null> => {
  try {
    // If file is a data URL, convert it to a blob
    const fileToUpload = typeof file === 'string' 
      ? await (await fetch(file)).blob() 
      : file;

    // Create a unique filename
    const fileExtension = typeof file === 'string' 
      ? 'jpg' 
      : file.name?.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Create folder path using property address and report type
    const folderPath = `${propertyAddress.replace(/\s+/g, '-')}/${reportType}`;
    const filePath = `${folderPath}/${fileName}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('inspection-images')
      .upload(filePath, fileToUpload);

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Return the public URL of the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('inspection-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadReportImage:', error);
    return null;
  }
};

export const deleteReportImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract the file path from the public URL
    const urlParts = imageUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf('inspection-images') + 1).join('/');

    const { error } = await supabase.storage
      .from('inspection-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteReportImage:', error);
    return false;
  }
};
