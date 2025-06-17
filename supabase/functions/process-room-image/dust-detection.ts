
export interface DustDetectionConfig {
  enableContextualAnalysis: boolean;
  dustSeverityThreshold: 'low' | 'medium' | 'high';
  excludeNaturalTextures: boolean;
  lightingCompensation: boolean;
}

export function createDustAwarePrompt(
  componentName: string,
  roomType: string,
  config: DustDetectionConfig = {
    enableContextualAnalysis: true,
    dustSeverityThreshold: 'medium',
    excludeNaturalTextures: true,
    lightingCompensation: true
  }
): string {
  return `ENHANCED DUST AND CLEANLINESS ANALYSIS FOR ${componentName.toUpperCase()}

CRITICAL: DISTINGUISH BETWEEN ACTUAL DUST AND NORMAL CHARACTERISTICS

DUST/DIRT INDICATORS (ONLY FLAG IF CLEARLY VISIBLE):
- ACCUMULATED PARTICLES ON FLAT SURFACES
- VISIBLE SEDIMENT IN CORNERS OR EDGES  
- FILM OR RESIDUE THAT OBSCURES ORIGINAL SURFACE
- DEBRIS OR FOREIGN MATTER
- STAINING FROM ENVIRONMENTAL CONTAMINATION

DO NOT CONFUSE WITH:
- NATURAL WOOD GRAIN OR STONE TEXTURES
- SHADOW PATTERNS FROM LIGHTING
- SURFACE WEAR PATTERNS (SCUFFS, PATINA)
- MATERIAL COLOR VARIATIONS
- PHOTOGRAPHIC GRAIN OR COMPRESSION ARTIFACTS
- REFLECTIVE SURFACES AND GLARE

${config.lightingCompensation ? `
LIGHTING CONTEXT ANALYSIS:
- CONSIDER LIGHTING CONDITIONS WHEN ASSESSING CLEANLINESS
- DIFFERENTIATE BETWEEN SHADOWS AND ACTUAL DIRT
- ACCOUNT FOR CAMERA FLASH REFLECTIONS
- RECOGNIZE NATURAL MATERIAL VARIATIONS
- ADJUST FOR AMBIENT LIGHTING EFFECTS
` : ''}

ROOM-SPECIFIC STANDARDS FOR ${roomType.toUpperCase()}:
${getRoomSpecificStandards(roomType)}

SEVERITY THRESHOLDS FOR ${config.dustSeverityThreshold.toUpperCase()} DETECTION:
- LIGHT: Minimal visible accumulation, easily cleaned
- MODERATE: Noticeable accumulation affecting appearance
- HEAVY: Significant buildup requiring deep cleaning
- ONLY REPORT DUST/DIRT THAT IS CLEARLY VISIBLE WITHOUT MAGNIFICATION
- FOCUS ON ACCUMULATIONS THAT AFFECT PROPERTY PRESENTATION

${config.excludeNaturalTextures ? `
TEXTURE EXCLUSION PROTOCOLS:
- WOOD: Grain patterns, knots, natural color variation
- STONE: Mineral patterns, natural veining, texture
- METAL: Brushed finishes, oxidation patterns
- FABRIC: Weave patterns, pile texture, material characteristics
` : ''}

OUTPUT REQUIREMENTS:
DESCRIPTION: [Material + Component type + Key visual characteristics]
CONDITION: 
- [SEVERITY] [Specific contamination type and location]
- [SEVERITY] [Cleaning complexity assessment]
CONTAMINATION_ANALYSIS:
- Type: [Dust/Dirt/Debris/Staining/Mixed]
- Distribution: [Even/Patchy/Localized/Corners/Edges]
- Severity: [Light/Moderate/Heavy]
- Cleaning complexity: [Simple wipe/Standard cleaning/Deep cleaning required]
CLEANLINESS: [Professional assessment based on property standards]
RATING: [Condition rating with contamination impact considered]

Focus on factual, measurable contamination observations. Avoid subjective interpretations.`;
}

function getRoomSpecificStandards(roomType: string): string {
  switch (roomType.toLowerCase()) {
    case 'kitchen':
      return `- KITCHEN SURFACES: EXPECT HIGHER CLEANLINESS STANDARDS
- CHECK FOR GREASE ACCUMULATION, FOOD RESIDUE
- ASSESS BACKSPLASH AREAS, APPLIANCE SURFACES
- EVALUATE CABINET HANDLES AND DRAWER FRONTS`;
      
    case 'bathroom':
      return `- BATHROOM SURFACES: CHECK FOR SOAP RESIDUE, WATER MARKS
- ASSESS TILE GROUT, SHOWER AREAS FOR MILDEW
- EVALUATE MIRROR SURFACES, FIXTURE CLEANLINESS
- CHECK FOR MINERAL DEPOSITS FROM HARD WATER`;
      
    case 'bedroom':
      return `- BEDROOM SURFACES: LIGHT DUST ON LESS-USED ITEMS IS NORMAL
- ASSESS WINDOW SILLS, BASEBOARDS
- EVALUATE FURNITURE SURFACES, LIGHT FIXTURES
- CHECK BEHIND/UNDER FURNITURE FOR ACCUMULATION`;
      
    case 'living_room':
    case 'lounge':
      return `- LIVING AREAS: MODERATE DUST EXPECTED ON HIGH SURFACES
- ASSESS ENTERTAINMENT UNITS, SHELVING
- EVALUATE UPHOLSTERED SURFACES
- CHECK AIR VENTS, CEILING FANS`;
      
    default:
      return `- GENERAL STANDARDS: ASSESS BASED ON ROOM USAGE PATTERNS
- CONSIDER ACCESSIBILITY FOR REGULAR CLEANING
- EVALUATE BASED ON TENANT OCCUPANCY LEVEL
- FOCUS ON VISIBLE ACCUMULATION AFFECTING PRESENTATION`;
  }
}

export function validateDustDetection(result: any): any {
  console.log("🔍 [DUST VALIDATION] Validating dust detection results");
  
  // Post-processing validation to reduce false positives
  if (result.cleanliness && result.condition?.points) {
    const dustRelatedPoints = result.condition.points.filter((point: string) => 
      point.toLowerCase().includes('dust') || 
      point.toLowerCase().includes('dirt') ||
      point.toLowerCase().includes('grime') ||
      point.toLowerCase().includes('debris') ||
      point.toLowerCase().includes('contamination')
    );
    
    // If dust is mentioned but cleanliness is high, flag for review
    if (dustRelatedPoints.length > 0 && 
        ['professional_clean', 'professional_clean_with_omissions'].includes(result.cleanliness)) {
      console.warn('⚠️ [DUST VALIDATION] Potential dust detection inconsistency detected');
      
      // Add validation note
      result.validationNotes = result.validationNotes || [];
      result.validationNotes.push('Dust reported but high cleanliness rating - manual verification recommended');
      
      // Adjust cleanliness to be more conservative
      if (dustRelatedPoints.length > 1) {
        result.cleanliness = 'domestic_clean_high_level';
        result.validationNotes.push('Cleanliness rating automatically adjusted due to dust detection');
      }
    }
    
    // Check for texture confusion
    const textureKeywords = ['grain', 'pattern', 'texture', 'natural', 'wood', 'stone'];
    const potentialTextureConfusion = dustRelatedPoints.some((point: string) =>
      textureKeywords.some(keyword => point.toLowerCase().includes(keyword))
    );
    
    if (potentialTextureConfusion) {
      result.validationNotes = result.validationNotes || [];
      result.validationNotes.push('Possible texture/dust confusion detected - review recommended');
    }
  }
  
  console.log("✅ [DUST VALIDATION] Validation complete");
  return result;
}
