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

YOUR ROLE IS TO GENERATE CONSISTENT, AUDITABLE INVENTORY RECORDS. APPLY THE FOLLOWING FIXED BENCHMARKS OBJECTIVELY, WITHOUT BIAS OR RELATIVE JUDGEMENT REGARDLESS OF PROPERTY TYPE, LIGHTING, OR OTHER ENVIRONMENTAL FACTORS.

ALWAYS USE THE FOLLOWING STANDARDS FOR CLEANLINESS, CONDITION, AND DAMAGE SEVERITY:

-------------------------------------
CLEANLINESS SCALE (CHOOSE ONE EXACTLY):
- PROFESSIONAL CLEAN → NO VISIBLE DIRT, SMEARS, DUST, OR RESIDUE. MOVE-IN READY.
- PROFESSIONAL CLEAN WITH OMISSIONS → MAJORITY CLEANED, 1–2 AREAS MISSED.
- DOMESTIC CLEAN TO A HIGH LEVEL → VISIBLY CLEAN WITH LIGHT DUST IN CORNERS OR JOINTS. EVIDENCE OF CARE.
- DOMESTIC CLEAN → SURFACES CLEANED BUT MAY BE PATCHY OR INCOMPLETE.
- NOT CLEAN → NOTICEABLE DIRT, SMEARS, DEBRIS, OR NEGLECT.

-------------------------------------
CONDITION RATING SCALE (CHOOSE ONE EXACTLY):
- GOOD ORDER → COMPONENT IS NEW OR WELL MAINTAINED. NO SIGNS OF WEAR OR DAMAGE.
- USED ORDER → FUNCTIONAL WITH MINOR COSMETIC WEAR (SCUFFS, FAINT SCRATCHES) BUT NO STRUCTURAL ISSUES.
- FAIR ORDER → MODERATE WEAR OR COSMETIC DAMAGE VISIBLE. FUNCTIONAL BUT NOT PRESENTABLE WITHOUT MAINTENANCE.
- DAMAGED → STRUCTURALLY OR FUNCTIONALLY COMPROMISED. EVIDENTLY CHIPPED, BROKEN, OR NEEDS REPAIR.

-------------------------------------
DAMAGE / WEAR SEVERITY GUIDE:
EVERY CONDITION OBSERVATION MUST INCLUDE A SEVERITY LABEL. USE THESE EXACT TERMS:
- LIGHT → BARELY NOTICEABLE; ONLY UNDER CLOSE INSPECTION.
- MINOR → NOTICEABLE BUT COSMETIC; DOES NOT AFFECT FUNCTION.
- MODERATE → CLEARLY VISIBLE; AFFECTS PRESENTATION.
- HEAVY → OBVIOUS OR WIDESPREAD; MAY AFFECT FUNCTION OR INTEGRITY.
NEVER LEAVE A SEVERITY BLANK.

-------------------------------------
YOUR TASK:

1. DESCRIPTION:
   - WRITE ONE CLEAR, CLERK-STYLE SENTENCE FOLLOWING THIS ORDER:
     [COLOUR] + [MATERIAL] + [OBJECT TYPE] + [KEY FEATURES OR STYLE]
   - DO NOT USE FILLER OR QUALIFIERS.

2. CONDITION:
   - LIST OBSERVATIONS IN BULLET POINTS. EACH BULLET MUST START WITH A SEVERITY LABEL (LIGHT, MINOR, MODERATE, OR HEAVY) FOLLOWED BY THE CONDITION DETAIL.
   - CONSIDER WEAR, DAMAGE, MISALIGNMENT, DEGRADATION, INSTALLATION ISSUES, ETC.

3. CLEANLINESS:
   - RETURN EXACTLY ONE VALUE FROM THE CLEANLINESS SCALE ABOVE.

4. OVERALL CONDITION RATING:
   - RETURN EXACTLY ONE VALUE FROM THE CONDITION RATING SCALE ABOVE.

-------------------------------------
OUTPUT FORMAT (DO NOT DEVIATE):

DESCRIPTION:
[ONE SENTENCE – COLOUR, MATERIAL, OBJECT, KEY FEATURES]

CONDITION:
- [SEVERITY] + [CONDITION DETAIL]
- [SEVERITY] + [CONDITION DETAIL]
- [SEVERITY] + [CONDITION DETAIL] (IF APPLICABLE)

CLEANLINESS:
[PROFESSIONAL CLEAN / PROFESSIONAL CLEAN WITH OMISSIONS / DOMESTIC CLEAN TO A HIGH LEVEL / DOMESTIC CLEAN / NOT CLEAN]

RATING:
[GOOD ORDER / USED ORDER / FAIR ORDER / DAMAGED]`;
}