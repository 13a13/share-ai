
/**
 * Enhanced Defect Detection & Analysis Framework
 * Implements advanced defect taxonomy, multi-perspective validation, and precision mapping
 */

export interface DefectTaxonomy {
  structural: DefectCategory;
  surface: DefectCategory;
  functional: DefectCategory;
  aesthetic: DefectCategory;
}

export interface DefectCategory {
  name: string;
  indicators: string[];
  criticalSigns: string[];
}

export interface DefectLocation {
  area: string;
  coordinates?: string;
  extent: string;
  relationship: string;
}

export interface DefectAnalysis {
  id: string;
  category: keyof DefectTaxonomy;
  type: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'MINOR' | 'TRACE';
  confidence: number;
  location: DefectLocation;
  description: string;
  supportingEvidence: number;
  requiresValidation: boolean;
  potentialCauses: string[];
  repairUrgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedCost: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CleanlinessAssessment {
  level: 'PROFESSIONAL' | 'STANDARD' | 'BELOW_STANDARD';
  objectiveFindings: string[];
  measurableCriteria: {
    surfaceContamination: number; // 0-100%
    accessibilityForCleaning: 'EASY' | 'MODERATE' | 'DIFFICULT';
    cleaningRequirement: 'LIGHT' | 'STANDARD' | 'DEEP' | 'PROFESSIONAL';
  };
}

export class EnhancedDefectAnalyzer {
  private defectTaxonomy: DefectTaxonomy = {
    structural: {
      name: "Structural Integrity Defects",
      indicators: ["cracks", "holes", "damage", "separation", "movement", "displacement"],
      criticalSigns: ["structural compromise", "safety hazard", "load-bearing damage"]
    },
    surface: {
      name: "Surface Condition Defects", 
      indicators: ["scratches", "chips", "stains", "gouges", "burns", "impact damage"],
      criticalSigns: ["deep penetration", "extensive area coverage", "material exposure"]
    },
    functional: {
      name: "Functional Performance Defects",
      indicators: ["misalignment", "loose mounting", "operational failure", "poor installation"],
      criticalSigns: ["complete failure", "safety malfunction", "imminent collapse"]
    },
    aesthetic: {
      name: "Aesthetic Quality Defects",
      indicators: ["wear patterns", "discoloration", "finish deterioration", "fading"],
      criticalSigns: ["severe visual impact", "property value reduction", "tenant complaints"]
    }
  };

  /**
   * Component-specific defect analysis patterns
   */
  getComponentSpecificAnalysis(componentName: string): any {
    const component = componentName.toLowerCase();
    
    if (component.includes('wall')) {
      return {
        specificDefects: [
          "paint_condition_assessment",
          "surface_integrity_check", 
          "discoloration_pattern_analysis",
          "joint_corner_evaluation"
        ],
        criticalAreas: ["corners", "edges", "joints", "high-traffic zones"],
        materialConsiderations: ["paint_type", "wall_material", "age_indicators"]
      };
    }
    
    if (component.includes('floor') || component.includes('carpet') || component.includes('tile')) {
      return {
        specificDefects: [
          "wear_pattern_analysis",
          "surface_damage_assessment",
          "edge_transition_condition",
          "material_specific_issues"
        ],
        criticalAreas: ["high-traffic paths", "thresholds", "under_furniture", "edges"],
        materialConsiderations: ["flooring_type", "installation_quality", "wear_resistance"]
      };
    }
    
    if (component.includes('door') || component.includes('window') || component.includes('fixture')) {
      return {
        specificDefects: [
          "mounting_security_check",
          "functional_assessment",
          "mechanism_condition",
          "installation_quality_review"
        ],
        criticalAreas: ["hinges", "handles", "seals", "frames", "operation_points"],
        materialConsiderations: ["hardware_condition", "weathering", "operational_stress"]
      };
    }
    
    return {
      specificDefects: ["general_condition_assessment", "surface_evaluation", "structural_check"],
      criticalAreas: ["visible_surfaces", "connection_points", "high_stress_areas"],
      materialConsiderations: ["material_type", "age", "maintenance_history"]
    };
  }

  /**
   * False positive prevention patterns
   */
  getFalsePositivePreventionGuidance(): string {
    return `
CRITICAL: False Positive Prevention Protocol

LIGHTING ARTIFACT DETECTION:
- Shadow patterns are NOT stains or damage
- Reflective glare is NOT surface discoloration  
- Uneven lighting creates apparent defects - verify with multiple angles
- Natural shadows from room features are normal

MATERIAL TEXTURE RECOGNITION:
- Wood grain patterns are NOT cracks or damage
- Stone/tile natural variations are NOT defects
- Fabric weave patterns are NOT wear indicators
- Textured surfaces may appear damaged but are intentional

PHOTOGRAPHIC ARTIFACT FILTERING:
- Image compression creates false textures
- Motion blur affects perceived surface condition
- Focus issues create apparent surface irregularities
- Camera angle distorts proportions and appearance

VALIDATION REQUIREMENTS:
- Require 2+ images for significant defect confirmation
- Distinguish between natural material characteristics and actual defects
- Verify lighting conditions before defect classification
- Cross-reference findings across multiple perspectives`;
  }

  /**
   * Generate enhanced defect detection prompt
   */
  createDefectAnalysisPrompt(componentName: string, imageCount: number): string {
    const componentAnalysis = this.getComponentSpecificAnalysis(componentName);
    const falsePositivePrevention = this.getFalsePositivePreventionGuidance();
    
    return `You are conducting a professional forensic inspection of ${componentName} using advanced defect detection protocols.

INSPECTION OBJECTIVES:
- Systematic defect identification using scientific methodology
- Multi-perspective validation for accuracy
- Precision location mapping with quantifiable measurements
- Evidence-based severity classification

DEFECT TAXONOMY FRAMEWORK:
1. STRUCTURAL: Cracks, holes, damage affecting integrity
2. SURFACE: Scratches, chips, stains, surface compromises  
3. FUNCTIONAL: Alignment, mounting, operational issues
4. AESTHETIC: Wear, discoloration, finish deterioration

COMPONENT-SPECIFIC ANALYSIS:
Focus Areas: ${componentAnalysis.criticalAreas.join(', ')}
Key Defects: ${componentAnalysis.specificDefects.join(', ')}
Material Factors: ${componentAnalysis.materialConsiderations.join(', ')}

SEVERITY CLASSIFICATION:
- CRITICAL: Immediate safety/structural concerns requiring urgent action
- MAJOR: Significant functional or aesthetic impact affecting usability
- MODERATE: Noticeable issues requiring attention within normal maintenance
- MINOR: Cosmetic concerns with minimal functional impact
- TRACE: Barely detectable issues for documentation purposes

LOCATION PRECISION REQUIREMENTS:
- Specify exact component areas (e.g., "upper left quadrant", "along bottom edge")
- Estimate size/extent as percentage of total surface
- Describe relationship to surrounding elements
- Provide coordinates when possible

${falsePositivePrevention}

CLEANLINESS ASSESSMENT (SEPARATE FROM CONDITION):
- PROFESSIONAL: Hospital-grade cleanliness, no visible contamination
- STANDARD: Clean and well-maintained, minor dust acceptable  
- BELOW_STANDARD: Visible contamination requiring cleaning attention

REQUIRED JSON OUTPUT FORMAT:
{
  "description": "Professional component description",
  "condition": {
    "summary": "Evidence-based condition assessment",
    "rating": "EXCELLENT|GOOD|FAIR|POOR"
  },
  "defects": [
    {
      "id": "unique_identifier",
      "category": "structural|surface|functional|aesthetic", 
      "type": "specific_defect_name",
      "severity": "CRITICAL|MAJOR|MODERATE|MINOR|TRACE",
      "confidence": 0.95,
      "location": {
        "area": "specific_location",
        "extent": "size_description", 
        "coordinates": "position_details"
      },
      "description": "detailed_defect_description",
      "supportingEvidence": ${imageCount},
      "repairUrgency": "IMMEDIATE|HIGH|MEDIUM|LOW",
      "estimatedCost": "HIGH|MEDIUM|LOW"
    }
  ],
  "cleanliness": {
    "level": "PROFESSIONAL|STANDARD|BELOW_STANDARD",
    "objectiveFindings": ["specific_observations"],
    "cleaningRequirement": "LIGHT|STANDARD|DEEP|PROFESSIONAL"
  },
  "analysisMetadata": {
    "imageCount": ${imageCount},
    "validationApplied": true,
    "falsePositiveScreening": true,
    "componentSpecificAnalysis": true
  }
}

Conduct your inspection with scientific rigor and forensic precision.`;
  }
}
