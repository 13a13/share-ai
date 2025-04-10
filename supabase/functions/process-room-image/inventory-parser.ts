
/**
 * Utilities for parsing and formatting inventory clerk responses
 */

/**
 * Parse the inventory clerk format response
 * @param text The text response from Gemini API
 * @returns Structured object with description, condition, cleanliness and rating
 */
export function parseInventoryResponse(text: string): any {
  // Extract sections from the formatted text
  const descriptionMatch = text.match(/DESCRIPTION:\s*([^\n]+)/i);
  const conditionMatch = text.match(/CONDITION:([\s\S]*?)(?=CLEANLINESS:|$)/i);
  const cleanlinessMatch = text.match(/CLEANLINESS:\s*([^\n]+)/i);
  const ratingMatch = text.match(/RATING:\s*([^\n]+)/i);
  
  // Extract bullet points from the condition section
  const bulletPoints: string[] = [];
  if (conditionMatch && conditionMatch[1]) {
    const bulletPointsText = conditionMatch[1].trim();
    const bulletPointMatches = bulletPointsText.match(/- ([^\n]+)/g);
    if (bulletPointMatches) {
      bulletPointMatches.forEach(point => {
        bulletPoints.push(point.replace('- ', '').trim());
      });
    }
  }
  
  // Map cleanliness value to standard rating
  const cleanlinessValue = cleanlinessMatch ? cleanlinessMatch[1].trim() : null;
  const ratingValue = ratingMatch ? ratingMatch[1].trim() : null;
  
  // Map rating to condition value
  let conditionRating: string;
  switch (ratingValue?.toLowerCase()) {
    case 'good order':
      conditionRating = 'excellent';
      break;
    case 'used order':
      conditionRating = 'good';
      break;
    case 'fair order':
      conditionRating = 'fair';
      break;
    case 'damaged':
      conditionRating = 'poor';
      break;
    default:
      conditionRating = 'fair';
  }
  
  return {
    description: descriptionMatch ? descriptionMatch[1].trim() : '',
    condition: {
      summary: bulletPoints.join('\n'),
      points: bulletPoints,
      rating: conditionRating
    },
    cleanliness: cleanlinessValue || '',
    rating: ratingValue || ''
  };
}

/**
 * Creates an inventory prompt for the Gemini API
 * @param componentName The name of the component being analyzed
 * @returns A detailed inventory clerk prompt
 */
export function createInventoryPrompt(componentName: string): string {
  return `YOU ARE A PROFESSIONAL PROPERTY INVENTORY CLERK.

YOU ARE ANALYSING MULTIPLE PHOTOS OF THE FOLLOWING COMPONENT: **${componentName}**.

YOUR ROLE IS TO GENERATE CONSISTENT, AUDITABLE INVENTORY RECORDS. YOUR JUDGEMENT MUST BE STANDARDISED ACROSS ALL REPORTS — NEVER SUBJECTIVE OR RELATIVE TO ROOM QUALITY.

ALWAYS APPLY THE FOLLOWING OBJECTIVE BENCHMARKS — THESE DO NOT CHANGE BETWEEN PROPERTIES OR PHOTOS:

---

CLEANLINESS SCALE (USE EXACTLY):
- PROFESSIONAL CLEAN → NO VISIBLE DIRT, SMEARS, DUST, OR RESIDUE. SUITABLE FOR MOVE-IN WITHOUT ADDITIONAL CLEANING.  
- PROFESSIONAL CLEAN WITH OMISSIONS → MOST SURFACES CLEANED TO A HIGH STANDARD BUT ONE OR TWO AREAS MISSED.  
- DOMESTIC CLEAN TO A HIGH LEVEL → VISIBLY CLEAN WITH LIGHT DUST IN INACCESSIBLE AREAS. EVIDENCE OF CARE.  
- DOMESTIC CLEAN → SURFACES CLEANED BUT MAY BE PATCHY OR INCOMPLETE.  
- NOT CLEAN → NOTICEABLE DIRT, SMEARS, DEBRIS, OR NEGLECT.

---

CONDITION RATINGS (USE THESE DEFINITIONS):

- GOOD ORDER → CLEAN, UNDAMAGED, NO SIGNS OF WEAR. APPEARS AS NEW OR WELL-MAINTAINED.  
- USED ORDER → FUNCTIONAL WITH MINOR COSMETIC WEAR (E.G., SCUFFS, FAINT SCRATCHES) BUT NO STRUCTURAL ISSUES.  
- FAIR ORDER → MODERATE WEAR OR COSMETIC DAMAGE VISIBLE. FIT FOR USE BUT NOT PRESENTABLE WITHOUT MAINTENANCE.  
- DAMAGED → STRUCTURALLY OR FUNCTIONALLY AFFECTED. CHIPPED, BROKEN, SEVERELY SCRATCHED, OR NEEDS REPAIR.

---

YOUR TASK:

1. DESCRIPTION:
   - WRITE ONE CLERK-STYLE SENTENCE USING THIS EXACT ORDER:
     [COLOUR] + [MATERIAL] + [OBJECT] + [KEY FEATURES / STYLE]
   - NO OPINIONS OR FLUFF.

2. CONDITION:
   - BULLET POINTS ONLY.
   - NOTE WEAR, DAMAGE, MISALIGNMENT, DEGRADATION, INSTALLATION ISSUES.

3. CLEANLINESS:
   - SELECT ONE FROM THE STANDARDISED SCALE ABOVE.

4. OVERALL RATING:
   - SELECT ONE FROM THE STANDARDISED CONDITION RATINGS ABOVE.

---

OUTPUT THIS EXACT FORMAT:

DESCRIPTION:  
[ONE SENTENCE – COLOUR, MATERIAL, OBJECT, FEATURES]

CONDITION:  
- [BULLET POINT 1]  
- [BULLET POINT 2]  
- [BULLET POINT 3] (IF NEEDED)

CLEANLINESS:  
[PROFESSIONAL CLEAN / PROFESSIONAL CLEAN WITH OMISSIONS / DOMESTIC CLEAN TO A HIGH LEVEL / DOMESTIC CLEAN / NOT CLEAN]

RATING:  
[GOOD ORDER / USED ORDER / FAIR ORDER / DAMAGED]`;
}
