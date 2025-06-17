
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
   * Enhanced component classification with intelligent parsing
   */
  private classifyComponent(componentName: string): string {
    const name = componentName.toLowerCase().trim();
    
    // Enhanced keyword detection with fuzzy matching
    const componentKeywords = {
      walls: ['wall', 'walls', 'paint', 'painted', 'drywall', 'plaster', 'wallpaper'],
      floors: ['floor', 'floors', 'flooring', 'carpet', 'tile', 'tiles', 'hardwood', 'laminate', 'vinyl', 'linoleum', 'rug'],
      ceiling: ['ceiling', 'ceilings', 'overhead', 'crown molding', 'beam', 'beams'],
      doors: ['door', 'doors', 'entrance', 'exit', 'entry', 'doorway', 'portal'],
      windows: ['window', 'windows', 'glass', 'pane', 'panes', 'sill', 'frame', 'glazing'],
      fixtures: ['fixture', 'fixtures', 'light', 'lighting', 'lamp', 'chandelier', 'sconce', 'fan', 'ceiling fan'],
      appliances: ['appliance', 'appliances', 'refrigerator', 'fridge', 'stove', 'oven', 'dishwasher', 'microwave', 'washer', 'dryer'],
      furniture: ['furniture', 'chair', 'chairs', 'table', 'tables', 'desk', 'bed', 'sofa', 'couch', 'cabinet', 'cabinets', 'shelf', 'shelves', 'dresser', 'wardrobe'],
      plumbing: ['plumbing', 'sink', 'faucet', 'tap', 'toilet', 'shower', 'bath', 'bathtub', 'drain', 'pipe', 'pipes'],
      electrical: ['electrical', 'outlet', 'outlets', 'switch', 'switches', 'panel', 'wiring', 'breaker'],
      hvac: ['hvac', 'heating', 'cooling', 'vent', 'vents', 'duct', 'ducts', 'thermostat', 'ac', 'air conditioning'],
      trim: ['trim', 'molding', 'baseboard', 'baseboards', 'casing', 'millwork'],
      countertops: ['counter', 'counters', 'countertop', 'countertops', 'surface', 'worktop']
    };

    // Find best matching category
    for (const [category, keywords] of Object.entries(componentKeywords)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return category;
      }
    }

    // Intelligent parsing for compound names
    if (name.includes(' ') || name.includes('-') || name.includes('_')) {
      const parts = name.split(/[\s\-_]+/);
      for (const part of parts) {
        for (const [category, keywords] of Object.entries(componentKeywords)) {
          if (keywords.some(keyword => part.includes(keyword) || keyword.includes(part))) {
            return category;
          }
        }
      }
    }

    // Material-based classification fallback
    const materialKeywords = {
      'wood': 'furniture',
      'metal': 'fixtures',
      'stone': 'countertops',
      'ceramic': 'floors',
      'fabric': 'furniture',
      'glass': 'windows'
    };

    for (const [material, category] of Object.entries(materialKeywords)) {
      if (name.includes(material)) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Enhanced component-specific defect analysis with intelligent categorization
   */
  getComponentSpecificAnalysis(componentName: string): any {
    const category = this.classifyComponent(componentName);
    
    console.log(`🔍 [ENHANCED DEFECT ANALYZER] Component "${componentName}" classified as "${category}"`);

    switch (category) {
      case 'walls':
        return {
          specificDefects: [
            "paint_condition_assessment",
            "surface_integrity_check", 
            "discoloration_pattern_analysis",
            "joint_corner_evaluation",
            "nail_hole_detection",
            "crack_propagation_analysis"
          ],
          criticalAreas: ["corners", "edges", "joints", "high-traffic zones", "behind furniture", "around fixtures"],
          materialConsiderations: ["paint_type", "wall_material", "age_indicators", "previous_repairs"],
          inspectionFocus: "Surface condition, paint adhesion, structural integrity"
        };

      case 'floors':
        return {
          specificDefects: [
            "wear_pattern_analysis",
            "surface_damage_assessment",
            "edge_transition_condition",
            "material_specific_issues",
            "subfloor_integrity_check",
            "installation_quality_review"
          ],
          criticalAreas: ["high-traffic paths", "thresholds", "under_furniture", "edges", "seams", "transitions"],
          materialConsiderations: ["flooring_type", "installation_quality", "wear_resistance", "moisture_damage"],
          inspectionFocus: "Surface wear, structural integrity, installation quality"
        };

      case 'ceiling':
        return {
          specificDefects: [
            "water_damage_assessment",
            "structural_sag_evaluation",
            "texture_condition_check",
            "stain_pattern_analysis",
            "joint_separation_review"
          ],
          criticalAreas: ["center spans", "corners", "around fixtures", "seams", "water entry points"],
          materialConsiderations: ["ceiling_material", "support_structure", "insulation_condition"],
          inspectionFocus: "Structural integrity, water damage, surface condition"
        };

      case 'doors':
      case 'windows':
        return {
          specificDefects: [
            "mounting_security_check",
            "functional_assessment",
            "mechanism_condition",
            "installation_quality_review",
            "weatherstrip_evaluation",
            "hardware_operation_test"
          ],
          criticalAreas: ["hinges", "handles", "seals", "frames", "operation_points", "locking_mechanisms"],
          materialConsiderations: ["hardware_condition", "weathering", "operational_stress", "seal_integrity"],
          inspectionFocus: "Functional operation, security, weather resistance"
        };

      case 'fixtures':
        return {
          specificDefects: [
            "mounting_stability_check",
            "electrical_connection_review",
            "operational_functionality_test",
            "finish_condition_assessment",
            "safety_compliance_check"
          ],
          criticalAreas: ["mounting_points", "electrical_connections", "moving_parts", "user_interfaces"],
          materialConsiderations: ["electrical_safety", "mounting_adequacy", "finish_durability"],
          inspectionFocus: "Safety, functionality, installation quality"
        };

      case 'appliances':
        return {
          specificDefects: [
            "operational_functionality_test",
            "safety_system_check",
            "installation_compliance_review",
            "energy_efficiency_assessment",
            "maintenance_requirement_evaluation"
          ],
          criticalAreas: ["control_panels", "safety_systems", "connections", "venting", "drainage"],
          materialConsiderations: ["age_condition", "maintenance_history", "safety_compliance"],
          inspectionFocus: "Functionality, safety, compliance, maintenance needs"
        };

      case 'furniture':
        return {
          specificDefects: [
            "structural_stability_check",
            "surface_condition_assessment",
            "hardware_functionality_test",
            "material_integrity_review",
            "safety_hazard_identification"
          ],
          criticalAreas: ["joints", "hardware", "surfaces", "structural_points", "moving_parts"],
          materialConsiderations: ["material_type", "construction_quality", "wear_patterns"],
          inspectionFocus: "Structural integrity, surface condition, functionality"
        };

      case 'plumbing':
        return {
          specificDefects: [
            "leak_detection_assessment",
            "functional_operation_test",
            "water_pressure_evaluation",
            "drainage_efficiency_check",
            "fixture_condition_review"
          ],
          criticalAreas: ["connections", "seals", "valves", "drainage_points", "supply_lines"],
          materialConsiderations: ["pipe_condition", "fixture_age", "water_quality_impact"],
          inspectionFocus: "Water integrity, functionality, drainage efficiency"
        };

      case 'electrical':
        return {
          specificDefects: [
            "safety_compliance_check",
            "operational_functionality_test",
            "installation_code_review",
            "load_capacity_assessment",
            "grounding_verification"
          ],
          criticalAreas: ["connections", "grounding", "load_points", "safety_devices"],
          materialConsiderations: ["code_compliance", "safety_standards", "load_adequacy"],
          inspectionFocus: "Safety, code compliance, operational integrity"
        };

      case 'hvac':
        return {
          specificDefects: [
            "airflow_efficiency_test",
            "system_operational_check",
            "ductwork_integrity_review",
            "filter_condition_assessment",
            "temperature_control_evaluation"
          ],
          criticalAreas: ["ductwork", "vents", "controls", "filters", "connections"],
          materialConsiderations: ["system_age", "maintenance_history", "efficiency_rating"],
          inspectionFocus: "Operational efficiency, air quality, system integrity"
        };

      case 'trim':
        return {
          specificDefects: [
            "installation_quality_check",
            "joint_condition_assessment",
            "finish_integrity_review",
            "gap_measurement_analysis",
            "attachment_security_test"
          ],
          criticalAreas: ["joints", "corners", "attachment_points", "finish_surfaces"],
          materialConsiderations: ["material_quality", "installation_precision", "finish_durability"],
          inspectionFocus: "Installation quality, finish condition, joint integrity"
        };

      case 'countertops':
        return {
          specificDefects: [
            "surface_integrity_assessment",
            "edge_condition_review",
            "support_adequacy_check",
            "seam_quality_evaluation",
            "stain_resistance_test"
          ],
          criticalAreas: ["edges", "seams", "support_points", "high_use_areas"],
          materialConsiderations: ["material_type", "installation_quality", "maintenance_requirements"],
          inspectionFocus: "Surface integrity, installation quality, durability"
        };

      default:
        return {
          specificDefects: [
            "general_condition_assessment", 
            "surface_evaluation", 
            "structural_check",
            "functionality_review",
            "safety_assessment"
          ],
          criticalAreas: ["visible_surfaces", "connection_points", "high_stress_areas", "user_contact_points"],
          materialConsiderations: ["material_type", "age", "maintenance_history", "environmental_exposure"],
          inspectionFocus: "Overall condition, functionality, safety considerations"
        };
    }
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
   * Generate enhanced defect detection prompt with component-specific guidance
   */
  createDefectAnalysisPrompt(componentName: string, imageCount: number): string {
    const componentAnalysis = this.getComponentSpecificAnalysis(componentName);
    const falsePositivePrevention = this.getFalsePositivePreventionGuidance();
    
    return `You are conducting a professional forensic inspection of ${componentName} using advanced defect detection protocols.

COMPONENT CLASSIFICATION: ${componentName} has been analyzed as a ${this.classifyComponent(componentName)} component.

INSPECTION OBJECTIVES:
- Systematic defect identification using scientific methodology
- Multi-perspective validation for accuracy
- Precision location mapping with quantifiable measurements
- Evidence-based severity classification

COMPONENT-SPECIFIC ANALYSIS PROTOCOL:
Focus Areas: ${componentAnalysis.criticalAreas.join(', ')}
Key Defects: ${componentAnalysis.specificDefects.join(', ')}
Material Factors: ${componentAnalysis.materialConsiderations.join(', ')}
Inspection Focus: ${componentAnalysis.inspectionFocus}

DEFECT TAXONOMY FRAMEWORK:
1. STRUCTURAL: Cracks, holes, damage affecting integrity
2. SURFACE: Scratches, chips, stains, surface compromises  
3. FUNCTIONAL: Alignment, mounting, operational issues
4. AESTHETIC: Wear, discoloration, finish deterioration

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
  "description": "Professional component description with specific material and feature identification",
  "condition": {
    "summary": "Evidence-based condition assessment focusing on component-specific concerns",
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
    "componentType": "${this.classifyComponent(componentName)}",
    "customComponentName": "${componentName}",
    "imageCount": ${imageCount},
    "validationApplied": true,
    "falsePositiveScreening": true,
    "componentSpecificAnalysis": true,
    "enhancedClassification": true
  }
}

Conduct your inspection with scientific rigor and forensic precision, applying the component-specific analysis protocol.`;
  }
}
