import { INDICATOR_RULES } from "./detector.js";

export function getIndicatorList() {
  return INDICATOR_RULES.map((rule) => ({
    id: rule.id,
    category: rule.category,
    name: rule.name,
    description: rule.description,
    severity: rule.severity,
    examples: rule.examples,
  }));
}
