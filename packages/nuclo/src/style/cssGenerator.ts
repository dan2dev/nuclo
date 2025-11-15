// Check if a class exists in the DOM
export function classExistsInDOM(className: string, mediaQuery?: string): boolean {
	const styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;
	if (!styleSheet || !styleSheet.sheet) {
		return false;
	}

	if (mediaQuery) {
		const rules = Array.from(styleSheet.sheet.cssRules || []);
		const mediaRule = rules.find(rule => {
			if (rule instanceof CSSMediaRule) {
				return rule.media.mediaText === mediaQuery;
			}
			return false;
		}) as CSSMediaRule | undefined;

		if (!mediaRule) {
			return false;
		}

		return Array.from(mediaRule.cssRules).some(rule => {
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
	mediaQuery?: string
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

	if (mediaQuery) {
		// Create or get media query rule
		const existingRules = Array.from(styleSheet.sheet?.cssRules || []);
		let mediaRule: CSSMediaRule | null = null;

		for (const rule of existingRules) {
			if (rule instanceof CSSMediaRule && rule.media.mediaText === mediaQuery) {
				mediaRule = rule;
				break;
			}
		}

		if (!mediaRule) {
			// Find the correct insertion index: after all style rules, append media queries in order
			// Since we process breakpoints in registration order, we can simply append
			// This ensures: style rules first, then media queries in the order they're processed
			let insertIndex = existingRules.length;

			// Find the last media query rule to insert after it (maintains order)
			for (let i = existingRules.length - 1; i >= 0; i--) {
				if (existingRules[i] instanceof CSSMediaRule) {
					insertIndex = i + 1;
					break;
				} else if (existingRules[i] instanceof CSSStyleRule) {
					// If we hit a style rule, insert after it
					insertIndex = i + 1;
					break;
				}
			}

			styleSheet.sheet?.insertRule(`@media ${mediaQuery} {}`, insertIndex);
			mediaRule = styleSheet.sheet?.cssRules[insertIndex] as CSSMediaRule;
		}

		// Check if class already exists in this media query
		let existingRule: CSSStyleRule | null = null;
		for (const rule of Array.from(mediaRule.cssRules)) {
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
			mediaRule.insertRule(`.${className} { ${rules} }`, mediaRule.cssRules.length);
		}
	} else {
		// Regular style rule (no media query)
		// Find existing rule or insert at the beginning (before media queries)
		let existingRule: CSSStyleRule | null = null;
		let insertIndex = 0;

		const allRules = Array.from(styleSheet.sheet?.cssRules || []);
		for (let i = 0; i < allRules.length; i++) {
			const rule = allRules[i];
			if (rule instanceof CSSStyleRule && rule.selectorText === `.${className}`) {
				existingRule = rule;
				insertIndex = i;
				break;
			}
			// Track where media queries start to insert default styles before them
			if (!(rule instanceof CSSMediaRule)) {
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
