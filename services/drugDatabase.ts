import { Medication, InteractionWarning } from "../types";

// This service simulates a real connection to a PostgreSQL Drug Interaction Database or an API like First Databank.
// In a real production app, this would be an async fetch call.

interface DrugInteractionRule {
  drugs: [string, string];
  severity: 'High' | 'Moderate' | 'Low';
  description: string;
}

const INTERACTION_DATABASE: DrugInteractionRule[] = [
  {
    drugs: ['sildenafil', 'nitroglycerin'],
    severity: 'High',
    description: 'CRITICAL: Concomitant use of PDE5 inhibitors (Sildenafil) and Nitrates can cause life-threatening hypotension.'
  },
  {
    drugs: ['tadalafil', 'nitroglycerin'],
    severity: 'High',
    description: 'CRITICAL: Concomitant use of PDE5 inhibitors (Tadalafil) and Nitrates can cause life-threatening hypotension.'
  },
  {
    drugs: ['lisinopril', 'potassium'],
    severity: 'Moderate',
    description: 'Risk of Hyperkalemia: ACE inhibitors can increase potassium levels.'
  },
  {
    drugs: ['warfarin', 'aspirin'],
    severity: 'High',
    description: 'Increased risk of bleeding due to additive anticoagulant effects.'
  },
  {
    drugs: ['metformin', 'contrast dye'],
    severity: 'Moderate',
    description: 'Risk of lactic acidosis. Metformin should be withheld before imaging procedures with contrast.'
  }
];

export const checkDatabaseInteractions = (
  currentMeds: Medication[],
  proposedMedName: string
): InteractionWarning[] => {
  const warnings: InteractionWarning[] = [];
  const normalizedProposed = proposedMedName.toLowerCase();

  for (const med of currentMeds) {
    const normalizedCurrent = med.name.toLowerCase();

    // Check our hardcoded rules
    for (const rule of INTERACTION_DATABASE) {
      // Check if both drugs from the rule are present (one current, one proposed)
      const hasDrugA = rule.drugs.some(d => normalizedCurrent.includes(d));
      const hasDrugB = rule.drugs.some(d => normalizedProposed.includes(d));

      if (hasDrugA && hasDrugB) {
        warnings.push({
          severity: rule.severity,
          description: `[DATABASE FLAG] ${rule.description}`,
          source: 'DRUG_DB'
        });
      }
    }
  }

  return warnings;
};
