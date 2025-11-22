// Supported at-rule types
type AtRuleType = 'media' | 'container' | 'supports' | 'style';

// Check if a class exists in the DOM
export function classExistsInDOM(className: string, condition?: string, atRuleType: AtRuleType = 'media'): boolean {
	const styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;
	if (!styleSheet || !styleSheet.sheet) {
		return false;
	}

	if (condition) {
		const rules = Array.from(styleSheet.sheet.cssRules || []);
		const conditionRule = rules.find(rule => {
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

		return Array.from(conditionRule.cssRules).some(rule => {
			if (rule instanceof CSSStyleRule) {
				return rule.selectorText === `.${className}`;
			}
			return false;
		});
	} else {
		const rules = Array.from(styleSheet.sheet.cssRules || []);
		return rules.some(rule => {
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
	atRuleType: AtRuleType = 'media'
): void {
	let styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;

	if (!styleSheet) {
		styleSheet = document.createElement("style");
		styleSheet.id = "nuclo-styles";
		document.head.appendChild(styleSheet);
	}

	const rules = Object.entries(styles)
		.map(([property, value]) => `${property}: ${value}`)
		.join("; ");

	if (condition) {
		// Create or get at-rule (media, container, supports, etc.)
		const existingRules = Array.from(styleSheet.sheet?.cssRules || []);
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

		for (const rule of existingRules) {
			if (isMatchingRule(rule)) {
				groupingRule = rule as CSSGroupingRule;
				break;
			}
		}

		if (!groupingRule) {
			// Find the correct insertion index: after all style rules, append at-rules in order
			// Since we process queries in registration order, we can simply append
			// This ensures: style rules first, then at-rules in the order they're processed
			let insertIndex = existingRules.length;

			// Find the last at-rule to insert after it (maintains order)
			for (let i = existingRules.length - 1; i >= 0; i--) {
				if (isAtRule(existingRules[i])) {
					insertIndex = i + 1;
					break;
				} else if (existingRules[i] instanceof CSSStyleRule) {
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

			styleSheet.sheet?.insertRule(`${atRulePrefix} ${condition} {}`, insertIndex);
			groupingRule = styleSheet.sheet?.cssRules[insertIndex] as CSSGroupingRule;
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
			// First, clear all existing properties
			while (existingRule.style.length > 0) {
				existingRule.style.removeProperty(existingRule.style[0]);
			}
			// Then set all new properties
			Object.entries(styles).forEach(([property, value]) => {
				existingRule!.style.setProperty(property, value);
			});
		} else {
			groupingRule.insertRule(`.${className} { ${rules} }`, groupingRule.cssRules.length);
		}
	} else {
		// Regular style rule (no at-rule)
		// Find existing rule or insert at the beginning (before at-rules)
		let existingRule: CSSStyleRule | null = null;
		let insertIndex = 0;

		// Helper to check if a rule is any at-rule
		const isAtRule = (rule: CSSRule): boolean => {
			return rule instanceof CSSMediaRule ||
				rule instanceof CSSContainerRule ||
				rule instanceof CSSSupportsRule;
		};

		const allRules = Array.from(styleSheet.sheet?.cssRules || []);
		for (let i = 0; i < allRules.length; i++) {
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
			// First, clear all existing properties
			while (existingRule.style.length > 0) {
				existingRule.style.removeProperty(existingRule.style[0]);
			}
			// Then set all new properties
			Object.entries(styles).forEach(([property, value]) => {
				existingRule!.style.setProperty(property, value);
			});
		} else {
			styleSheet.sheet?.insertRule(`.${className} { ${rules} }`, insertIndex);
		}
	}
}

// Legacy function for backward compatibility
export function createCSSClass(className: string, styles: Record<string, string>): void {
	createCSSClassWithStyles(className, styles);
}
