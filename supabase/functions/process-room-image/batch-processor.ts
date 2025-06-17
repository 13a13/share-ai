
import { callGeminiApi, createGeminiRequest } from "./gemini-api.ts";

export interface BatchProcessingOptions {
  maxImagesPerRequest: number;
  enableParallelProcessing: boolean;
  fallbackToIndividual: boolean;
  batchDelay: number;
}

export interface BatchResult {
  description: string;
  condition: {
    summary: string;
    points: string[];
    rating: string;
  };
  cleanliness: string;
  crossAnalysis?: {
    materialConsistency: boolean;
    defectConfidence: 'low' | 'medium' | 'high';
    multiAngleValidation: Array<[string, number]>;
  };
}

export async function processBatchWithOptimization(
  images: string[],
  prompt: string,
  apiKey: string,
  options: BatchProcessingOptions = {
    maxImagesPerRequest: 8,
    enableParallelProcessing: true,
    fallbackToIndividual: false,
    batchDelay: 500
  }
): Promise<BatchResult> {
  const { maxImagesPerRequest, enableParallelProcessing, fallbackToIndividual, batchDelay } = options;
  
  console.log(`🔄 [BATCH PROCESSOR] Processing ${images.length} images with optimization`);
  
  // If images count is within limit, process normally
  if (images.length <= maxImagesPerRequest) {
    console.log(`✅ [BATCH PROCESSOR] Image count ${images.length} within limit, processing normally`);
    const result = await callGeminiApi(apiKey, createGeminiRequest(prompt, images, true));
    return parseGeminiResponse(result);
  }
  
  // Split into batches
  const batches: string[][] = [];
  for (let i = 0; i < images.length; i += maxImagesPerRequest) {
    batches.push(images.slice(i, i + maxImagesPerRequest));
  }
  
  console.log(`📦 [BATCH PROCESSOR] Split ${images.length} images into ${batches.length} batches`);
  
  try {
    if (enableParallelProcessing && batches.length <= 3) {
      console.log(`⚡ [BATCH PROCESSOR] Using parallel processing for ${batches.length} batches`);
      
      // Process batches in parallel (limited to 3 to prevent rate limiting)
      const batchPromises = batches.map(async (batch, index) => {
        const batchPrompt = `${prompt}\n\nBATCH ${index + 1}/${batches.length}: Analyze these ${batch.length} images as part of a comprehensive multi-batch analysis.`;
        return await callGeminiApi(apiKey, createGeminiRequest(batchPrompt, batch, true));
      });
      
      const results = await Promise.all(batchPromises);
      return consolidateBatchResults(results.map(parseGeminiResponse));
      
    } else {
      console.log(`🔄 [BATCH PROCESSOR] Using sequential processing for ${batches.length} batches`);
      
      // Process batches sequentially
      const results = [];
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchPrompt = `${prompt}\n\nBATCH ${i + 1}/${batches.length}: Analyze these ${batch.length} images as part of a comprehensive sequential analysis.`;
        
        console.log(`📤 [BATCH PROCESSOR] Processing batch ${i + 1}/${batches.length}`);
        const result = await callGeminiApi(apiKey, createGeminiRequest(batchPrompt, batch, true));
        results.push(parseGeminiResponse(result));
        
        // Add delay between sequential requests to prevent rate limiting
        if (i < batches.length - 1) {
          console.log(`⏳ [BATCH PROCESSOR] Waiting ${batchDelay}ms between batches`);
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      }
      
      return consolidateBatchResults(results);
    }
  } catch (error) {
    console.error(`❌ [BATCH PROCESSOR] Batch processing failed:`, error);
    
    if (fallbackToIndividual) {
      console.warn(`🔄 [BATCH PROCESSOR] Falling back to individual image processing`);
      return await processIndividualImages(images, prompt, apiKey);
    }
    throw error;
  }
}

function parseGeminiResponse(textContent: string): BatchResult {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(textContent);
    return {
      description: parsed.description || '',
      condition: {
        summary: parsed.condition?.summary || '',
        points: parsed.condition?.points || [],
        rating: parsed.condition?.rating || 'fair'
      },
      cleanliness: parsed.cleanliness || 'domestic_clean',
      crossAnalysis: parsed.crossAnalysis
    };
  } catch {
    // Fallback parsing for non-JSON responses
    return {
      description: extractField(textContent, 'DESCRIPTION') || 'Analysis completed',
      condition: {
        summary: extractField(textContent, 'CONDITION') || '',
        points: extractListItems(textContent, 'CONDITION') || [],
        rating: extractField(textContent, 'RATING') || 'fair'
      },
      cleanliness: extractField(textContent, 'CLEANLINESS') || 'domestic_clean'
    };
  }
}

function consolidateBatchResults(results: BatchResult[]): BatchResult {
  console.log(`🔗 [BATCH PROCESSOR] Consolidating ${results.length} batch results`);
  
  // Intelligent consolidation of multiple batch results
  const consolidated: BatchResult = {
    description: results.map(r => r.description).filter(d => d).join('. '),
    condition: {
      summary: results.map(r => r.condition?.summary || '').filter(s => s).join('. '),
      points: results.flatMap(r => r.condition?.points || []).filter(p => p),
      rating: determineCombinedRating(results.map(r => r.condition?.rating || 'fair'))
    },
    cleanliness: determineWorstCleanliness(results.map(r => r.cleanliness || 'domestic_clean')),
    crossAnalysis: {
      materialConsistency: results.every(r => r.crossAnalysis?.materialConsistency !== false),
      defectConfidence: determineHighestConfidence(results.map(r => r.crossAnalysis?.defectConfidence || 'medium')),
      multiAngleValidation: results.flatMap(r => r.crossAnalysis?.multiAngleValidation || [])
    }
  };
  
  console.log(`✅ [BATCH PROCESSOR] Consolidation complete`);
  return consolidated;
}

function determineCombinedRating(ratings: string[]): string {
  const ratingValues = { 'excellent': 4, 'good': 3, 'fair': 2, 'poor': 1 };
  const validRatings = ratings.filter(r => r in ratingValues);
  
  if (validRatings.length === 0) return 'fair';
  
  // Use the worst rating found
  const minRating = Math.min(...validRatings.map(r => ratingValues[r as keyof typeof ratingValues]));
  return Object.keys(ratingValues).find(key => ratingValues[key as keyof typeof ratingValues] === minRating) || 'fair';
}

function determineWorstCleanliness(cleanlinessLevels: string[]): string {
  const cleanlinessOrder = [
    'professional_clean',
    'professional_clean_with_omissions', 
    'domestic_clean_high_level',
    'domestic_clean',
    'not_clean'
  ];
  
  const validLevels = cleanlinessLevels.filter(l => cleanlinessOrder.includes(l));
  if (validLevels.length === 0) return 'domestic_clean';
  
  // Return the worst cleanliness level
  for (let i = cleanlinessOrder.length - 1; i >= 0; i--) {
    if (validLevels.includes(cleanlinessOrder[i])) {
      return cleanlinessOrder[i];
    }
  }
  
  return 'domestic_clean';
}

function determineHighestConfidence(confidenceLevels: string[]): 'low' | 'medium' | 'high' {
  if (confidenceLevels.includes('high')) return 'high';
  if (confidenceLevels.includes('medium')) return 'medium';
  return 'low';
}

async function processIndividualImages(images: string[], prompt: string, apiKey: string): Promise<BatchResult> {
  console.log(`🔄 [INDIVIDUAL PROCESSOR] Processing ${images.length} images individually`);
  
  const results: BatchResult[] = [];
  
  for (let i = 0; i < images.length; i++) {
    try {
      const individualPrompt = `${prompt}\n\nIMAGE ${i + 1}/${images.length}: Analyze this single image as part of individual processing fallback.`;
      const result = await callGeminiApi(apiKey, createGeminiRequest(individualPrompt, [images[i]], false));
      results.push(parseGeminiResponse(result));
    } catch (error) {
      console.error(`❌ [INDIVIDUAL PROCESSOR] Failed to process image ${i + 1}:`, error);
    }
    
    // Small delay between individual requests
    if (i < images.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return consolidateBatchResults(results);
}

function extractField(text: string, fieldName: string): string | null {
  const regex = new RegExp(`${fieldName}:?\\s*([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function extractListItems(text: string, sectionName: string): string[] | null {
  const regex = new RegExp(`${sectionName}:?\\s*([\\s\\S]*?)(?=\\n[A-Z]+:|$)`, 'i');
  const match = text.match(regex);
  
  if (!match) return null;
  
  const content = match[1];
  const items = content.split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-') || line.startsWith('•'))
    .map(line => line.replace(/^[-•]\s*/, ''));
    
  return items.length > 0 ? items : null;
}
