import { createElement } from "../utility/dom";

// Supported at-rule types
type AtRuleType = 'media' | 'container' | 'supports' | 'style' | 'pseudo';

// Check if a class exists in the DOM
export function classExistsInDOM(className: string, condition?: string, atRuleType: AtRuleType = 'media', pseudoClass?: string): boolean {
	const styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;
	if (!styleSheet || !styleSheet.sheet) {
		return false;
	}

	// For pseudo-classes, check for the selector directly
	if (pseudoClass) {
		const selector = `.${className}${pseudoClass}`;
		const rules = Array.from(styleSheet.sheet.cssRules || []);
		return rules.some(function(rule) {
			if (rule instanceof CSSStyleRule) {
				return rule.selectorText === selector;
			}
			return false;
		});
	}

	if (condition) {
		const rules = Array.from(styleSheet.sheet.cssRules || []);
		const conditionRule = rules.find(function(rule) {
			if (atRuleType === 'media' && rule instanceof CSSMediaRule) {
				return rule.media.mediaText === condition;
			}
			if (atRuleType === 'container' && rule instanceof CSSContainerRule) {
				return rule.conditionText === condition;
			}
			if (atRuleType === 'supports' && rule instanceof CSSSupportsRule) {
				return rule.conditionText === condition;
			}
			return false;
		}) as CSSGroupingRule | undefined;

		if (!conditionRule) {
			return false;
		}

		return Array.from(conditionRule.cssRules).some(function(rule) {
			if (rule instanceof CSSStyleRule) {
				return rule.selectorText === `.${className}`;
			}
			return false;
		});
	} else {
		const rules = Array.from(styleSheet.sheet.cssRules || []);
		return rules.some(function(rule) {
			if (rule instanceof CSSStyleRule) {
				return rule.selectorText === `.${className}`;
			}
			return false;
		});
	}
}

// Create a CSS class with multiple styles
export function createCSSClassWithStyles(
	className: string,
	styles: Record<string, string>,
	condition?: string,
	atRuleType: AtRuleType = 'media',
	pseudoClass?: string
): void {
	let styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;

	if (!styleSheet) {
		styleSheet = createElement("style") as HTMLStyleElement;
		styleSheet.id = "nuclo-styles";
		document.head.appendChild(styleSheet);
	}

	const rules = Object.entries(styles)
		.map(function([property, value]) { return `${property}: ${value}`; })
		.join("; ");

	// Handle pseudo-classes (hover, focus, etc.) - these modify the selector directly
	if (pseudoClass) {
		const selector = `.${className}${pseudoClass}`;
		const sheet = styleSheet.sheet;
		if (!sheet) return;
		
		const allRules = sheet.cssRules;
		const rulesLength = allRules.length;
		
		// Find existing rule with this pseudo-class selector
		let existingRule: CSSStyleRule | null = null;
		let insertIndex = rulesLength;

		for (let i = 0; i < rulesLength; i++) {
			const rule = allRules[i];
			if (rule instanceof CSSStyleRule) {
				if (rule.selectorText === selector) {
					existingRule = rule;
					insertIndex = i;
					break;
				}
				// Insert pseudo-class rules after regular style rules but before at-rules
				if (!rule.selectorText.includes(':')) {
					insertIndex = i + 1;
				}
			}
		}

		if (existingRule) {
			// Update existing rule by replacing all styles
			// More efficient: clear and set in one pass
			const style = existingRule.style;
			style.cssText = ''; // Faster than removing properties one by one
			for (const [property, value] of Object.entries(styles)) {
				style.setProperty(property, value);
			}
		} else {
			sheet.insertRule(`${selector} { ${rules} }`, insertIndex);
		}
		return;
	}

	if (condition) {
		// Create or get at-rule (media, container, supports, etc.)
		const sheet = styleSheet.sheet;
		if (!sheet) return;
		
		const existingRules = sheet.cssRules;
		const rulesLength = existingRules.length;
		let groupingRule: CSSGroupingRule | null = null;

		// Helper to check if a rule matches our at-rule type and condition
		const isMatchingRule = (rule: CSSRule): boolean => {
			if (atRuleType === 'media' && rule instanceof CSSMediaRule) {
				return rule.media.mediaText === condition;
			}
			if (atRuleType === 'container' && rule instanceof CSSContainerRule) {
				return rule.conditionText === condition;
			}
			if (atRuleType === 'supports' && rule instanceof CSSSupportsRule) {
				return rule.conditionText === condition;
			}
			return false;
		};

		// Helper to check if a rule is any at-rule
		const isAtRule = (rule: CSSRule): boolean => {
			return rule instanceof CSSMediaRule ||
				rule instanceof CSSContainerRule ||
				rule instanceof CSSSupportsRule;
		};

		for (let i = 0; i < rulesLength; i++) {
			const rule = existingRules[i];
			if (isMatchingRule(rule)) {
				groupingRule = rule as CSSGroupingRule;
				break;
			}
		}

		if (!groupingRule) {
			// Find the correct insertion index: after all style rules, append at-rules in order
			// Since we process queries in registration order, we can simply append
			// This ensures: style rules first, then at-rules in the order they're processed
			let insertIndex = rulesLength;

			// Find the last at-rule to insert after it (maintains order)
			for (let i = rulesLength - 1; i >= 0; i--) {
				const rule = existingRules[i];
				if (isAtRule(rule)) {
					insertIndex = i + 1;
					break;
				} else if (rule instanceof CSSStyleRule) {
					// If we hit a style rule, insert after it
					insertIndex = i + 1;
					break;
				}
			}

			// Create the appropriate at-rule
			const atRulePrefix = atRuleType === 'media' ? '@media' :
				atRuleType === 'container' ? '@container' :
				atRuleType === 'supports' ? '@supports' :
				'@media'; // fallback

			sheet.insertRule(`${atRulePrefix} ${condition} {}`, insertIndex);
			groupingRule = sheet.cssRules[insertIndex] as CSSGroupingRule;
		}

		// Check if class already exists in this at-rule
		let existingRule: CSSStyleRule | null = null;
		for (const rule of Array.from(groupingRule.cssRules)) {
			if (rule instanceof CSSStyleRule && rule.selectorText === `.${className}`) {
				existingRule = rule;
				break;
			}
		}

		if (existingRule) {
			// Update existing rule by replacing all styles
			// More efficient: clear and set in one pass
			const style = existingRule.style;
			style.cssText = ''; // Faster than removing properties one by one
			for (const [property, value] of Object.entries(styles)) {
				style.setProperty(property, value);
			}
		} else {
			groupingRule.insertRule(`.${className} { ${rules} }`, groupingRule.cssRules.length);
		}
	} else {
		// Regular style rule (no at-rule)
		// Find existing rule or insert at the beginning (before at-rules)
		const sheet = styleSheet.sheet;
		if (!sheet) return;
		
		let existingRule: CSSStyleRule | null = null;
		let insertIndex = 0;

		// Helper to check if a rule is any at-rule
		const isAtRule = (rule: CSSRule): boolean => {
			return rule instanceof CSSMediaRule ||
				rule instanceof CSSContainerRule ||
				rule instanceof CSSSupportsRule;
		};

		const allRules = sheet.cssRules;
		const rulesLength = allRules.length;
		for (let i = 0; i < rulesLength; i++) {
			const rule = allRules[i];
			if (rule instanceof CSSStyleRule && rule.selectorText === `.${className}`) {
				existingRule = rule;
				insertIndex = i;
				break;
			}
			// Track where at-rules start to insert default styles before them
			if (!isAtRule(rule)) {
				insertIndex = i + 1;
			}
		}

		if (existingRule) {
			// Update existing rule by replacing all styles
			// More efficient: clear and set in one pass
			const style = existingRule.style;
			style.cssText = ''; // Faster than removing properties one by one
			for (const [property, value] of Object.entries(styles)) {
				style.setProperty(property, value);
			}
		} else {
			sheet.insertRule(`.${className} { ${rules} }`, insertIndex);
		}
	}
}

// Legacy function for backward compatibility
export function createCSSClass(className: string, styles: Record<string, string>): void {
	createCSSClassWithStyles(className, styles);
}
