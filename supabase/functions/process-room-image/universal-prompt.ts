/**
 * Universal Prompt System - Single comprehensive prompt for all scenarios
 * Replaces inventory, advanced, and dust detection prompts
 */

export function createUniversalPrompt(
  componentName: string,
  roomType: string,
  imageCount: number
): string {
  const componentGuidelines = getComponentSpecificGuidelines(componentName, roomType);
  const isMultiImage = imageCount > 1;
  
  return `PROFESSIONAL PROPERTY INSPECTION ANALYSIS

COMPONENT: ${componentName.toUpperCase()}
ROOM TYPE: ${roomType.toUpperCase()}
IMAGE COUNT: ${imageCount} ${isMultiImage ? 'perspectives' : 'image'}

You are an expert property inspection specialist conducting a comprehensive analysis.

CORE ANALYSIS REQUIREMENTS:
1. MATERIAL IDENTIFICATION: Primary/secondary materials, quality grade, construction method
2. CONDITION ASSESSMENT: Structural integrity, surface condition, functionality, aesthetics  
3. CLEANLINESS EVALUATION: Contamination type, distribution, cleaning complexity
4. DAMAGE ASSESSMENT: Wear patterns vs actual damage, severity classification
5. MAINTENANCE ANALYSIS: Requirements, priority level, cost implications

${isMultiImage ? `
MULTI-IMAGE CROSS-VALIDATION PROTOCOL:
- Compare and triangulate findings across all ${imageCount} perspectives
- Resolve discrepancies between different viewing angles
- Weight observations by image quality and clarity
- Provide confidence levels for major assessments
- Identify areas requiring additional documentation
` : ''}

COMPONENT-SPECIFIC GUIDELINES:
${componentGuidelines}

CONTAMINATION ANALYSIS FRAMEWORK:
- DUST vs DIRT vs DEBRIS vs STAINING identification
- Distribution patterns (even/patchy/localized/edges/corners)
- Cleaning complexity (simple wipe/standard/deep cleaning/professional)
- Distinguish from natural textures (wood grain, stone patterns, wear marks)
- Consider lighting effects and photographic artifacts

SEVERITY CLASSIFICATION:
- LIGHT: Cosmetic issues, minimal functional impact
- MINOR: Noticeable but acceptable, may need attention
- MODERATE: Significant issues affecting function/presentation
- HEAVY: Major problems requiring immediate attention

CLEANLINESS STANDARDS:
- PROFESSIONAL_CLEAN: Spotless, commercial standard
- PROFESSIONAL_CLEAN_WITH_OMISSIONS: Mostly clean, minor areas missed
- DOMESTIC_CLEAN_HIGH_LEVEL: Very good residential standard
- DOMESTIC_CLEAN: Acceptable residential standard
- REQUIRES_CLEANING: Visible contamination affecting presentation

CONDITION RATINGS:
- EXCELLENT: Like new, no visible wear
- GOOD: Minor wear, fully functional, good appearance
- FAIR: Moderate wear, functional, acceptable appearance
- POOR: Significant issues, may need repair/replacement

REQUIRED JSON OUTPUT FORMAT:
{
  "description": "[Color] [Material] [Component type] with [Key features and characteristics]",
  "condition": {
    "summary": "[Comprehensive condition overview with specific details]",
    "points": [
      "[SEVERITY] [Specific observation with precise location and extent]",
      "[SEVERITY] [Additional finding with impact assessment]"
    ],
    "rating": "[EXCELLENT|GOOD|FAIR|POOR]"
  },
  "material_analysis": {
    "primary_material": "[Main material type]",
    "quality_grade": "[HIGH|MEDIUM|LOW]",
    "construction_quality": "[EXCELLENT|GOOD|FAIR|POOR]"
  },
  "cleanliness": "[PROFESSIONAL_CLEAN|PROFESSIONAL_CLEAN_WITH_OMISSIONS|DOMESTIC_CLEAN_HIGH_LEVEL|DOMESTIC_CLEAN|REQUIRES_CLEANING]",
  "contamination_details": {
    "type": "[DUST|DIRT|DEBRIS|STAINING|MIXED|NONE]",
    "distribution": "[EVEN|PATCHY|LOCALIZED|EDGES|CORNERS|NONE]",
    "severity": "[LIGHT|MODERATE|HEAVY|NONE]",
    "cleaning_required": "[SIMPLE_WIPE|STANDARD_CLEANING|DEEP_CLEANING|PROFESSIONAL_REQUIRED|NONE]"
  },${isMultiImage ? `
  "cross_validation": {
    "consistency_score": "[0.0-1.0 confidence level]",
    "discrepancies_noted": "[Any differences between perspectives]",
    "optimal_angles": "[Most informative viewing angles]",
    "additional_images_needed": "[Areas requiring more documentation]"
  },` : ''}
  "maintenance_assessment": {
    "immediate_action": "[What needs attention now]",
    "priority": "[LOW|MEDIUM|HIGH|URGENT]",
    "estimated_cost_impact": "[MINIMAL|MODERATE|SIGNIFICANT|MAJOR]"
  },
  "notes": "[Additional observations and recommendations]"
}

CRITICAL INSTRUCTIONS:
- Provide only factual, measurable observations
- Use precise technical terminology
- Avoid subjective interpretations or assumptions
- Focus on actionable insights for property management
- Ensure JSON is valid and complete
- Be specific about locations and extents of findings

Analyze the provided ${imageCount > 1 ? 'images' : 'image'} and respond with the JSON format only.`;
}

function getComponentSpecificGuidelines(componentName: string, roomType: string): string {
  const component = componentName.toLowerCase();
  const room = roomType.toLowerCase();
  
  // Wall components
  if (component.includes('wall') || component.includes('paint') || component.includes('drywall')) {
    return `WALL ANALYSIS FOCUS:
- Surface integrity: cracks, holes, dents, texture consistency
- Paint/finish condition: peeling, fading, staining, touch-up quality
- Moisture indicators: discoloration, bubbling, mold growth
- Mounting damage: nail holes, screw holes, anchor points
- Edge/corner condition: chipping, wear patterns
${room === 'bathroom' || room === 'kitchen' ? '- Moisture resistance and waterproofing integrity' : ''}`;
  }
  
  // Floor components
  if (component.includes('floor') || component.includes('carpet') || component.includes('tile') || component.includes('hardwood')) {
    return `FLOOR ANALYSIS FOCUS:
- Surface wear patterns: traffic lanes, scuffing, scratches
- Joint/seam integrity: gaps, lifting, separation
- Staining and discoloration: spills, pet damage, sun fading
- Structural issues: squeaking, soft spots, unevenness
- Transition strips and thresholds condition
${component.includes('carpet') ? '- Pile condition, matting, odor assessment' : ''}
${component.includes('tile') ? '- Grout condition, cracked/loose tiles' : ''}`;
  }
  
  // Ceiling components
  if (component.includes('ceiling') || component.includes('light') || component.includes('fan')) {
    return `CEILING ANALYSIS FOCUS:
- Surface condition: cracks, staining, texture integrity
- Lighting fixture mounting and functionality
- Ventilation component operation and cleanliness
- Water damage indicators: discoloration, sagging
- Paint/finish quality and uniformity
${room === 'bathroom' ? '- Exhaust fan operation and moisture resistance' : ''}`;
  }
  
  // Window/door components
  if (component.includes('window') || component.includes('door') || component.includes('frame')) {
    return `WINDOW/DOOR ANALYSIS FOCUS:
- Operation functionality: opening, closing, locking mechanisms
- Seal integrity: weatherstripping, caulking, draft prevention
- Glass condition: cracks, scratches, thermal seal failure
- Frame condition: warping, rot, paint condition
- Hardware functionality: handles, hinges, locks
- Security features and proper installation`;
  }
  
  // Appliance components
  if (component.includes('appliance') || component.includes('refrigerator') || component.includes('oven') || component.includes('dishwasher')) {
    return `APPLIANCE ANALYSIS FOCUS:
- Functional operation: heating, cooling, cleaning cycles
- External condition: dents, scratches, rust, discoloration
- Door/drawer operation: alignment, seals, handles
- Control panel functionality: buttons, displays, settings
- Energy efficiency indicators: age, model, condition
- Installation quality: level, secure mounting, connections`;
  }
  
  // Bathroom fixtures
  if (component.includes('toilet') || component.includes('sink') || component.includes('bathtub') || component.includes('shower')) {
    return `BATHROOM FIXTURE ANALYSIS FOCUS:
- Functional operation: water flow, drainage, flushing
- Porcelain/surface condition: chips, cracks, staining
- Caulking and sealing: water damage prevention
- Hardware condition: faucets, handles, flush mechanisms
- Mounting security: wall-hung units, floor attachment
- Cleanliness and hygiene standards for rental properties`;
  }
  
  // Kitchen fixtures
  if (component.includes('cabinet') || component.includes('counter') || component.includes('backsplash')) {
    return `KITCHEN FIXTURE ANALYSIS FOCUS:
- Surface condition: scratches, burns, stains, chips
- Door/drawer operation: alignment, soft-close function
- Hardware condition: handles, hinges, drawer slides
- Counter edge condition: chipping, separation, wear
- Installation quality: level, secure mounting, gaps
- Cleanliness standards for food preparation areas`;
  }
  
  // Generic component guidelines
  return `GENERAL COMPONENT ANALYSIS FOCUS:
- Overall structural integrity and stability
- Surface condition and finish quality
- Functional operation (if applicable)
- Installation quality and mounting security
- Age-appropriate wear vs damage assessment
- Cleanliness and maintenance standards
- Safety considerations and code compliance`;
}

export function parseUniversalResponse(textContent: string): any {
  console.log(`🔍 [UNIVERSAL PARSER] Parsing response: ${textContent.substring(0, 200)}...`);
  
  try {
    // Extract JSON from markdown blocks if present
    let cleanedContent = textContent.trim();
    const jsonMatch = cleanedContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[1].trim();
    }
    
    const result = JSON.parse(cleanedContent);
    console.log(`✅ [UNIVERSAL PARSER] JSON parsed successfully`);
    return validateAndNormalizeResult(result);
  } catch (jsonError) {
    console.log(`❌ [UNIVERSAL PARSER] JSON parsing failed, using text extraction`);
    return extractFromText(textContent);
  }
}

function validateAndNormalizeResult(result: any): any {
  return {
    description: result.description || 'Component analysis completed',
    condition: {
      summary: result.condition?.summary || '',
      points: Array.isArray(result.condition?.points) ? result.condition.points : [],
      rating: normalizeRating(result.condition?.rating || 'fair')
    },
    material_analysis: result.material_analysis || {
      primary_material: 'Unknown',
      quality_grade: 'MEDIUM',
      construction_quality: 'FAIR'
    },
    cleanliness: normalizeCleanliness(result.cleanliness || 'domestic_clean'),
    contamination_details: result.contamination_details || {
      type: 'NONE',
      distribution: 'NONE',
      severity: 'NONE',
      cleaning_required: 'NONE'
    },
    cross_validation: result.cross_validation,
    maintenance_assessment: result.maintenance_assessment || {
      immediate_action: 'None required',
      priority: 'LOW',
      estimated_cost_impact: 'MINIMAL'
    },
    notes: result.notes || ''
  };
}

function extractFromText(text: string): any {
  const description = extractField(text, 'description') || 'Analysis completed';
  const conditionSummary = extractField(text, 'condition') || extractField(text, 'summary') || '';
  const rating = extractField(text, 'rating') || 'fair';
  const cleanliness = extractField(text, 'cleanliness') || 'domestic_clean';
  const points = extractListItems(text);
  
  return {
    description,
    condition: {
      summary: conditionSummary,
      points: points || [],
      rating: normalizeRating(rating)
    },
    material_analysis: {
      primary_material: 'Unknown',
      quality_grade: 'MEDIUM',
      construction_quality: 'FAIR'
    },
    cleanliness: normalizeCleanliness(cleanliness),
    contamination_details: {
      type: 'NONE',
      distribution: 'NONE', 
      severity: 'NONE',
      cleaning_required: 'NONE'
    },
    maintenance_assessment: {
      immediate_action: 'None required',
      priority: 'LOW',
      estimated_cost_impact: 'MINIMAL'
    },
    notes: ''
  };
}

function extractField(text: string, fieldName: string): string | null {
  const patterns = [
    new RegExp(`${fieldName}\\s*:?\\s*([^\\n\\r]+)`, 'i'),
    new RegExp(`"${fieldName}"\\s*:\\s*"([^"]+)"`, 'i'),
    new RegExp(`\\*\\*${fieldName}\\*\\*\\s*:?\\s*([^\\n\\r]+)`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractListItems(text: string): string[] {
  const matches = Array.from(text.matchAll(/[-•*]\s*([^\n]+)/g));
  return matches.map(match => match[1].trim()).filter(item => item.length > 0);
}

function normalizeRating(rating: string): string {
  const normalized = rating.toLowerCase().trim();
  if (normalized.includes('excellent') || normalized.includes('like new')) return 'excellent';
  if (normalized.includes('good')) return 'good';
  if (normalized.includes('poor') || normalized.includes('bad')) return 'poor';
  return 'fair';
}

function normalizeCleanliness(cleanliness: string): string {
  const normalized = cleanliness.toLowerCase().trim();
  if (normalized.includes('professional_clean_with')) return 'professional_clean_with_omissions';
  if (normalized.includes('professional')) return 'professional_clean';
  if (normalized.includes('domestic_clean_high')) return 'domestic_clean_high_level';
  if (normalized.includes('requires') || normalized.includes('dirty')) return 'requires_cleaning';
  return 'domestic_clean';
}