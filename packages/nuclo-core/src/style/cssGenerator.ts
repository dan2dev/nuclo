const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

type AtRuleType = "media" | "container" | "supports" | "style" | "pseudo";

// SSR collector — a single function reference installed once at server startup.
// Keeping this as a plain function slot (no global Set, no ALS) means the nuclo
// package stays browser-safe and free of Node-specific imports.  The server is
// responsible for wiring in whatever collection strategy it wants (e.g. an
// AsyncLocalStorage-backed dispatcher).  null = no-op (browser default).
type SSRCollector = (rule: string) => void;
let _ssrCollector: SSRCollector | null = null;

/**
 * Install a CSS rule collector for SSR.  Call once at server startup with a
 * function that receives every rule string emitted by cn() / createStyleQueries.
 * Pass null to remove the collector (not normally needed).
 */
export function setSSRCollector(fn: SSRCollector | null): void {
  _ssrCollector = fn;
}

function isAtRule(rule: CSSRule): boolean {
  return (
    rule instanceof CSSMediaRule ||
    rule instanceof CSSContainerRule ||
    rule instanceof CSSSupportsRule
  );
}

function matchesAtRule(
  rule: CSSRule,
  atRuleType: AtRuleType,
  condition: string,
): boolean {
  if (atRuleType === "media" && rule instanceof CSSMediaRule) {
    return rule.media.mediaText === condition;
  }
  if (atRuleType === "container" && rule instanceof CSSContainerRule) {
    return rule.conditionText === condition;
  }
  if (atRuleType === "supports" && rule instanceof CSSSupportsRule) {
    return rule.conditionText === condition;
  }
  return false;
}

function findStyleRule(
  rules: CSSRuleList,
  selector: string,
): CSSStyleRule | null {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (rule instanceof CSSStyleRule && rule.selectorText === selector) {
      return rule;
    }
  }
  return null;
}

function updateRuleStyles(
  rule: CSSStyleRule,
  styles: Record<string, string>,
): void {
  rule.style.cssText = "";
  for (const [property, value] of Object.entries(styles)) {
    rule.style.setProperty(property, value);
  }
}

function getStyleSheet(): HTMLStyleElement | null {
  if (!isBrowser) return null;
  let el = document.querySelector("#nuclo-styles") as HTMLStyleElement;
  if (!el) {
    el = document.createElement("style");
    el.id = "nuclo-styles";
    document.head.appendChild(el);
  }
  return el;
}

function buildRulesString(styles: Record<string, string>): string {
  const entries = Object.entries(styles);
  let result = "";
  for (let i = 0; i < entries.length; i++) {
    if (i > 0) result += "; ";
    result += `${entries[i][0]}: ${entries[i][1]}`;
  }
  return result;
}

export function classExistsInDOM(
  className: string,
  condition?: string,
  atRuleType: AtRuleType = "media",
  pseudoClass?: string,
): boolean {
  if (!isBrowser) return false;
  const styleSheet = document.querySelector(
    "#nuclo-styles",
  ) as HTMLStyleElement;
  if (!styleSheet?.sheet) return false;

  const rules = styleSheet.sheet.cssRules;

  if (pseudoClass) {
    return findStyleRule(rules, `.${className}${pseudoClass}`) !== null;
  }

  if (condition) {
    for (let i = 0; i < rules.length; i++) {
      if (matchesAtRule(rules[i], atRuleType, condition)) {
        return (
          findStyleRule(
            (rules[i] as CSSGroupingRule).cssRules,
            `.${className}`,
          ) !== null
        );
      }
    }
    return false;
  }

  return findStyleRule(rules, `.${className}`) !== null;
}

export function createCSSClassWithStyles(
  className: string,
  styles: Record<string, string>,
  condition?: string,
  atRuleType: AtRuleType = "media",
  pseudoClass?: string,
): void {
  if (!isBrowser) {
    const rulesStr = buildRulesString(styles);
    let rule: string;
    if (pseudoClass) {
      rule = `.${className}${pseudoClass} { ${rulesStr} }`;
    } else if (condition) {
      const prefix =
        atRuleType === "container"
          ? "@container"
          : atRuleType === "supports"
            ? "@supports"
            : "@media";
      rule = `${prefix} ${condition} { .${className} { ${rulesStr} } }`;
    } else {
      rule = `.${className} { ${rulesStr} }`;
    }
    _ssrCollector?.(rule);
    return;
  }

  const styleSheet = getStyleSheet();
  if (!styleSheet) return;

  const sheet = styleSheet.sheet;
  if (!sheet) return;

  const rulesStr = buildRulesString(styles);

  if (pseudoClass) {
    const selector = `.${className}${pseudoClass}`;
    const allRules = sheet.cssRules;
    const rulesLength = allRules.length;

    let existingRule: CSSStyleRule | null = null;
    let insertIndex = rulesLength;

    for (let i = 0; i < rulesLength; i++) {
      const rule = allRules[i];
      if (rule instanceof CSSStyleRule) {
        if (rule.selectorText === selector) {
          existingRule = rule;
          break;
        }
        if (!rule.selectorText.includes(":")) {
          insertIndex = i + 1;
        }
      }
    }

    if (existingRule) {
      updateRuleStyles(existingRule, styles);
    } else {
      sheet.insertRule(`${selector} { ${rulesStr} }`, insertIndex);
    }
    return;
  }

  if (condition) {
    const existingRules = sheet.cssRules;
    const rulesLength = existingRules.length;
    let groupingRule: CSSGroupingRule | null = null;

    for (let i = 0; i < rulesLength; i++) {
      if (matchesAtRule(existingRules[i], atRuleType, condition)) {
        groupingRule = existingRules[i] as CSSGroupingRule;
        break;
      }
    }

    if (!groupingRule) {
      let insertIndex = rulesLength;
      for (let i = rulesLength - 1; i >= 0; i--) {
        if (
          isAtRule(existingRules[i]) ||
          existingRules[i] instanceof CSSStyleRule
        ) {
          insertIndex = i + 1;
          break;
        }
      }

      const atRulePrefix =
        atRuleType === "media"
          ? "@media"
          : atRuleType === "container"
            ? "@container"
            : atRuleType === "supports"
              ? "@supports"
              : "@media";

      sheet.insertRule(`${atRulePrefix} ${condition} {}`, insertIndex);
      groupingRule = sheet.cssRules[insertIndex] as CSSGroupingRule;
    }

    const existingRule = findStyleRule(groupingRule.cssRules, `.${className}`);
    if (existingRule) {
      updateRuleStyles(existingRule, styles);
    } else {
      groupingRule.insertRule(
        `.${className} { ${rulesStr} }`,
        groupingRule.cssRules.length,
      );
    }
  } else {
    let existingRule: CSSStyleRule | null = null;
    let insertIndex = 0;

    const allRules = sheet.cssRules;
    const rulesLength = allRules.length;
    for (let i = 0; i < rulesLength; i++) {
      const rule = allRules[i];
      if (
        rule instanceof CSSStyleRule &&
        rule.selectorText === `.${className}`
      ) {
        existingRule = rule;
        insertIndex = i;
        break;
      }
      if (!isAtRule(rule)) {
        insertIndex = i + 1;
      }
    }

    if (existingRule) {
      updateRuleStyles(existingRule, styles);
    } else {
      sheet.insertRule(`.${className} { ${rulesStr} }`, insertIndex);
    }
  }
}

export function createCSSClass(
  className: string,
  styles: Record<string, string>,
): void {
  createCSSClassWithStyles(className, styles);
}
