// Auto-generated from /tmp/nuclo-styling.html to preserve original styling docs code examples
export const stylingCode = {
  overviewQuickExample: { lang: 'typescript', code: `import 'nuclo';

// Create style queries helper (usually done once)
const cn = createStyleQueries({
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)'
});

// Define styles by chaining methods
const buttonStyle = cn(
  bg('#3b82f6')
    .color('white')
    .padding('0.75rem 1.5rem')
    .borderRadius('8px')
    .border('none')
    .cursor('pointer')
    .fontWeight('600')
    .transition('all 0.2s ease')
);

// Use in your component
button(buttonStyle, 'Click me');` },
  styleBuilderUsage: { lang: 'typescript', code: `// Each helper returns a StyleBuilder
const builder = bg('#FF0000');

// Chain more properties
const styles = bg('#FF0000')
  .padding('1rem')
  .fontSize('16px')
  .borderRadius('4px');

// Get the class name directly
const className = styles.getClassName();  // Returns: "n3a7f2b1"

// Or use with cn() for responsive support
const responsive = cn(styles);` },
  styleBuilderMethods: { lang: 'typescript', code: `// Get accumulated styles as object
builder.getStyles()  // { 'background-color': '#FF0000', ... }

// Generate CSS class name
builder.getClassName()  // "n3a7f2b1"
builder.getClassName('btn')  // "btn-3a7f2b1" (with prefix)

// Add custom CSS property
builder.add('custom-property', 'value')

// Convert to string (same as getClassName)
builder.toString()  // "n3a7f2b1"` },
  styleBuilderClass: { lang: 'typescript', code: `// This creates a <style> tag in <head> with:
// .n3a7f2b1 { background-color: #3b82f6; padding: 1rem; }

const style = cn(bg('#3b82f6').padding('1rem'));
div(style, 'Content');` },
  styleHelpersBasic: { lang: 'typescript', code: `// Start with any helper, chain the rest
const cardStyle = cn(
  bg('white')
    .padding('1.5rem')
    .borderRadius('12px')
    .boxShadow('0 4px 6px rgba(0,0,0,0.1)')
);

div(cardStyle, 'Card content');` },
  styleHelpersList: { lang: 'typescript', code: `// Layout & Display (14 helpers)
display(), position(), top(), right(), bottom(), left(), zIndex(),
width(), height(), minWidth(), maxWidth(), minHeight(), maxHeight(), boxSizing()

// Spacing (18 helpers)
padding(), paddingTop(), paddingRight(), paddingBottom(), paddingLeft(),
margin(), marginTop(), marginRight(), marginBottom(), marginLeft(),
gap()

// Typography (30+ helpers)
fontSize(), fontWeight(), fontFamily(), fontStyle(), lineHeight(), letterSpacing(),
textAlign(), textDecoration(), textTransform(), textIndent(), textOverflow(), textShadow(),
whiteSpace(), wordSpacing(), wordWrap(), overflowWrap(), verticalAlign(),
fontVariant(), fontStretch(), textAlignLast(), textJustify(),
textDecorationLine(), textDecorationColor(), textDecorationStyle(),
textDecorationThickness(), textUnderlineOffset(),
bold() // shorthand for fontWeight('bold')

// Colors & Backgrounds (10 helpers)
color(), bg(), backgroundColor(), accentColor(),
backgroundImage(), backgroundRepeat(), backgroundPosition(), backgroundSize(),
backgroundAttachment(), backgroundClip(), backgroundOrigin()

// Borders & Outlines (20+ helpers)
border(), borderTop(), borderRight(), borderBottom(), borderLeft(),
borderWidth(), borderStyle(), borderColor(),
borderRadius(), borderTopLeftRadius(), borderTopRightRadius(),
borderBottomLeftRadius(), borderBottomRightRadius(),
outline(), outlineWidth(), outlineStyle(), outlineColor(), outlineOffset()

// Flexbox (15 helpers)
flex(), flexDirection(), flexWrap(), flexGrow(), flexShrink(), flexBasis(),
alignItems(), justifyContent(), alignSelf(), alignContent(),
justifySelf(), justifyItems(),
center() // shorthand for alignItems('center') + justifyContent('center')

// CSS Grid (17 helpers)
grid(), gridTemplateColumns(), gridTemplateRows(), gridTemplateAreas(),
gridColumn(), gridRow(), gridColumnStart(), gridColumnEnd(),
gridRowStart(), gridRowEnd(), gridArea(),
gridAutoColumns(), gridAutoRows(), gridAutoFlow()

// Effects & Transforms (15 helpers)
boxShadow(), opacity(), filter(), backdropFilter(),
transform(), transformOrigin(), transformStyle(), perspective(), perspectiveOrigin(),
backfaceVisibility()

// Transitions & Animations (13 helpers)
transition(), transitionProperty(), transitionDuration(),
transitionTimingFunction(), transitionDelay(),
animation(), animationName(), animationDuration(), animationTimingFunction(),
animationDelay(), animationIterationCount(), animationDirection(),
animationFillMode(), animationPlayState()

// Other Properties (20+ helpers)
overflow(), overflowX(), overflowY(), visibility(), objectFit(), objectPosition(),
cursor(), userSelect(), pointerEvents(), resize(), scrollBehavior(),
listStyle(), listStyleType(), listStylePosition(), listStyleImage(),
borderCollapse(), borderSpacing(), captionSide(), emptyCells(), tableLayout(),
content(), quotes(), counterReset(), counterIncrement(),
appearance(), clip(), clipPath(), isolation(), mixBlendMode(), willChange(), contain(),
pageBreakBefore(), pageBreakAfter(), pageBreakInside(),
breakBefore(), breakAfter(), breakInside(), orphans(), widows(),
columnCount(), columnFill(), columnGap(), columnRule(), columnRuleColor(),
columnRuleStyle(), columnRuleWidth(), columnSpan(), columnWidth(), columns()

// Example usage - chain any helpers together:
bg('#f0f0f0').color('#333').padding('1rem').borderRadius('8px')` },
  styleHelpersShorthand: { lang: 'typescript', code: `// bold() - shorthand for fontWeight('bold')
bold()

// center() - centers content on both axes
center()  // alignItems('center') + justifyContent('center')

// flex() - can be shorthand or take a value
flex()  // display: flex
flex('1')  // flex: 1

// grid() - shorthand for display: grid
grid()` },
  styleQueriesSetup: { lang: 'typescript', code: `// Create once, typically in a styles.ts file
// New syntax with explicit @media prefix (recommended)
export const cn = createStyleQueries({
  small: '@media (min-width: 480px)',
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)',
  xl: '@media (min-width: 1280px)'
});

// Backward compatible: without prefix (treated as @media)
export const cn = createStyleQueries({
  small: '(min-width: 480px)',
  medium: '(min-width: 768px)',
  large: '(min-width: 1024px)',
});` },
  styleQueriesDefaults: { lang: 'typescript', code: `// Default styles only
const style = cn(
  padding('1rem').bg('white')
);

// With responsive overrides
const responsiveStyle = cn(
  // Default (mobile-first)
  padding('1rem')
    .fontSize('14px')
    .width('100%'),
  // Breakpoint overrides
  {
    medium: padding('1.5rem').fontSize('16px'),
    large: padding('2rem').fontSize('18px').maxWidth('800px')
  }
);` },
  styleQueriesGeneratedCss: { lang: 'typescript', code: `// This generates CSS like:
// .n3a7f2b1 { padding: 1rem; font-size: 14px; width: 100%; }
// @media (min-width: 768px) {
//   .n3a7f2b1 { padding: 1.5rem; font-size: 16px; }
// }
// @media (min-width: 1024px) {
//   .n3a7f2b1 { padding: 2rem; font-size: 18px; max-width: 800px; }
// }

const style = cn(
  padding('1rem').fontSize('14px').width('100%'),
  {
    medium: padding('1.5rem').fontSize('16px'),
    large: padding('2rem').fontSize('18px').maxWidth('800px')
  }
);` },
  styleQueriesQueriesOnly: { lang: 'typescript', code: `// You can also use just queries without default styles
const hideOnMobile = cn({
  small: display('block'),
  // Implicitly hidden on smaller screens
});` },
  styleQueriesContainer: { lang: 'typescript', code: `const cn = createStyleQueries({
  containerSmall: '@container (min-width: 300px)',
  containerMedium: '@container (min-width: 500px)',
  containerLarge: '@container (min-width: 800px)',
});

const cardStyle = cn(
  padding('1rem').fontSize('14px'),
  {
    containerSmall: fontSize('16px'),
    containerMedium: padding('1.5rem').fontSize('18px'),
    containerLarge: padding('2rem').fontSize('20px'),
  }
);` },
  styleQueriesPseudoClasses: { lang: 'typescript', code: `// Pseudo-classes are automatically available - no need to define them!
const cn = createStyleQueries({
  small: '@media (min-width: 341px)',
  medium: '@media (min-width: 601px)',
  large: '@media (min-width: 1025px)',
});

// Use hover, focus, active, etc. directly
const buttonStyle = cn(
  padding('12px 24px')
    .borderRadius('8px')
    .backgroundColor('blue')
    .color('white')
    .transition('all 0.2s'),
  {
    hover: backgroundColor('darkblue'),
    focus: outline('2px solid lightblue'),
    active: transform('scale(0.98)')
  }
);

button(buttonStyle, 'Click me');

// Works with responsive queries too
const navLink = cn(
  color('gray').fontSize('14px').transition('all 0.2s'),
  {
    medium: fontSize('15px'),
    hover: color('blue')
  }
);` },
  styleQueriesFeature: { lang: 'typescript', code: `const cn = createStyleQueries({
  hasGrid: '@supports (display: grid)',
  hasSubgrid: '@supports (grid-template-columns: subgrid)',
  hasContainerQuery: '@supports (container-type: inline-size)',
});

const layoutStyle = cn(
  display('flex').flexWrap('wrap'),  // Fallback
  {
    hasGrid: display('grid').gridTemplateColumns('repeat(3, 1fr)'),
  }
);` },
  styleQueriesExamples: { lang: 'typescript', code: `const cn = createStyleQueries({
  // Media queries for viewport-based responsive design
  small: '@media (min-width: 480px)',
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)',

  // Container queries for component-based responsive design
  containerWide: '@container (min-width: 600px)',

  // Feature queries for progressive enhancement
  hasGrid: '@supports (display: grid)',
});

const componentStyle = cn(
  width('100%').padding('1rem'),
  {
    medium: maxWidth('800px').margin('0 auto'),
    containerWide: padding('2rem'),
    hasGrid: display('grid').gap('1rem'),
  }
);` },
  layoutDisplayPosition: { lang: 'typescript', code: `display('flex')
display('grid')
display('block')
display('inline-block')
display('none')

position('relative')
position('absolute')
position('fixed')
position('sticky')

top('0')
right('10px')
bottom('auto')
left('50%')
zIndex('100')` },
  layoutSizing: { lang: 'typescript', code: `width('100%')
height('200px')
minWidth('300px')
maxWidth('800px')
minHeight('100vh')
maxHeight('500px')
boxSizing('border-box')` },
  layoutSpacing: { lang: 'typescript', code: `// Padding
padding('1rem')
padding('1rem 2rem')  // vertical | horizontal
paddingTop('10px')
paddingRight('15px')
paddingBottom('10px')
paddingLeft('15px')

// Margin
margin('auto')
margin('0 auto')
marginTop('20px')
marginBottom('20px')` },
  layoutOverflow: { lang: 'typescript', code: `overflow('hidden')
overflow('auto')
overflow('scroll')
overflowX('auto')
overflowY('hidden')` },
  typographyFont: { lang: 'typescript', code: `fontSize('16px')
fontSize('1.25rem')
fontWeight('bold')
fontWeight('600')
fontFamily("'Inter', system-ui, sans-serif")
fontStyle('italic')
lineHeight('1.5')
letterSpacing('0.05em')` },
  typographyText: { lang: 'typescript', code: `color('#333')
textAlign('center')
textAlign('left')
textDecoration('underline')
textDecoration('none')
textTransform('uppercase')
whiteSpace('nowrap')
wordBreak('break-word')` },
  typographySystem: { lang: 'typescript', code: `const cn = createStyleQueries({
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)'
});

const heading = cn(
  fontSize('1.5rem')
    .fontWeight('700')
    .lineHeight('1.2')
    .color('#1a1a2e')
    .margin('0 0 1rem 0'),
  {
    medium: fontSize('2rem'),
    large: fontSize('2.5rem')
  }
);

const bodyText = cn(
  fontSize('1rem')
    .lineHeight('1.6')
    .color('#4a4a4a')
);

h1(heading, 'Page Title');
p(bodyText, 'Body content here...');` },
  colorsBasic: { lang: 'typescript', code: `color('red')
color('#ff0000')
color('rgb(255, 0, 0)')
color('rgba(255, 0, 0, 0.5)')

bg('blue')
bg('#3b82f6')
bg('transparent')
backgroundColor('white')` },
  colorsGradients: { lang: 'typescript', code: `// Linear gradient
bg('linear-gradient(to right, #667eea, #764ba2)')
bg('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')

// Radial gradient
bg('radial-gradient(circle, #ff0000, #0000ff)')` },
  colorsBackground: { lang: 'typescript', code: `backgroundImage('url(/images/bg.jpg)')
backgroundRepeat('no-repeat')
backgroundPosition('center')
backgroundSize('cover')` },
  flexContainer: { lang: 'typescript', code: `// Enable flexbox
flex()  // display: flex

// Direction
flexDirection('row')
flexDirection('column')
flexDirection('row-reverse')

// Wrapping
flexWrap('wrap')
flexWrap('nowrap')

// Alignment
justifyContent('flex-start')
justifyContent('center')
justifyContent('space-between')
justifyContent('space-around')

alignItems('stretch')
alignItems('center')
alignItems('flex-start')
alignItems('flex-end')

// Shorthand for centering
center()  // alignItems + justifyContent center

// Gap
gap('1rem')
gap('10px 20px')  // row | column` },
  flexItem: { lang: 'typescript', code: `flexGrow('1')
flexShrink('0')
flexBasis('200px')
alignSelf('center')` },
  flexNavbarExample: { lang: 'typescript', code: `const navbar = cn(
  flex()
    .justifyContent('space-between')
    .alignItems('center')
    .padding('1rem 2rem')
    .bg('#1a1a2e')
);

const navLinks = cn(
  flex()
    .gap('1rem')
    .alignItems('center')
);

nav(navbar,
  div('Logo'),
  div(navLinks,
    a('Home'),
    a('About'),
    a('Contact')
  )
);` },
  gridContainer: { lang: 'typescript', code: `// Enable grid
grid()  // display: grid

// Template
gridTemplateColumns('1fr 1fr 1fr')
gridTemplateColumns('repeat(3, 1fr)')
gridTemplateColumns('repeat(auto-fill, minmax(250px, 1fr))')
gridTemplateRows('auto 1fr auto')

// Gap
gap('1rem')
gap('1rem 2rem')  // row | column` },
  gridItem: { lang: 'typescript', code: `gridColumn('1 / 3')
gridColumn('span 2')
gridRow('1 / 2')
gridArea('header')` },
  gridResponsiveExample: { lang: 'typescript', code: `const cn = createStyleQueries({
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)'
});

const cardGrid = cn(
  grid()
    .gridTemplateColumns('1fr')
    .gap('1.5rem')
    .padding('2rem'),
  {
    medium: gridTemplateColumns('repeat(2, 1fr)'),
    large: gridTemplateColumns('repeat(3, 1fr)')
  }
);

const card = cn(
  bg('white')
    .borderRadius('12px')
    .padding('1.5rem')
    .boxShadow('0 2px 8px rgba(0,0,0,0.1)')
);

div(cardGrid,
  list(() => products, product =>
    div(card, product.name)
  )
);` },
  effectsShadows: { lang: 'typescript', code: `boxShadow('0 2px 4px rgba(0,0,0,0.1)')
boxShadow('0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)')
boxShadow('inset 0 2px 4px rgba(0,0,0,0.1)')
boxShadow('none')` },
  effectsVisibility: { lang: 'typescript', code: `opacity('1')
opacity('0.5')
opacity('0')
visibility('hidden')
visibility('visible')` },
  effectsTransitions: { lang: 'typescript', code: `transition('all 0.3s ease')
transition('opacity 0.3s, transform 0.3s')
transition('background-color 0.2s ease-in-out')` },
  effectsTransforms: { lang: 'typescript', code: `transform('translateX(10px)')
transform('translateY(-50%)')
transform('rotate(45deg)')
transform('scale(1.1)')
transform('translate(-50%, -50%) rotate(45deg)')
transformOrigin('center')` },
  effectsFilters: { lang: 'typescript', code: `filter('blur(4px)')
filter('brightness(1.2)')
filter('grayscale(100%)')
backdropFilter('blur(10px)')` },
  effectsHover: { lang: 'typescript', code: `// For hover effects, use pseudo-classes (recommended)
const cardBase = cn(
  bg('white')
    .borderRadius('12px')
    .padding('1.5rem')
    .transition('all 0.3s ease')
    .boxShadow('0 2px 8px rgba(0,0,0,0.1)'),
  {
    hover: boxShadow('0 10px 40px rgba(0,0,0,0.15)').transform('translateY(-4px)')
  }
);

div(cardBase, 'Hover me');

// Alternative: reactive style function (for complex logic)
let isHovered = false;
div(
  cardBase,
  {
    style: () => ({
      boxShadow: isHovered
        ? '0 10px 40px rgba(0,0,0,0.15)'
        : '0 2px 8px rgba(0,0,0,0.1)',
      transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
    })
  },
  on('mouseenter', () => { isHovered = true; update(); }),
  on('mouseleave', () => { isHovered = false; update(); }),
  'Hover me'
);` },
  organizingTheme: { lang: 'typescript', code: `// styles.ts
import 'nuclo';

// Theme constants
export const theme = {
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    text: '#1f2937',
    textLight: '#6b7280',
    bg: '#ffffff',
    bgAlt: '#f9fafb',
    border: '#e5e7eb',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
  }
};

// Create style queries
export const cn = createStyleQueries({
  sm: '@media (min-width: 640px)',
  md: '@media (min-width: 768px)',
  lg: '@media (min-width: 1024px)',
  xl: '@media (min-width: 1280px)',
});` },
  organizingStyles: { lang: 'typescript', code: `// styles.ts (continued)
export const styles = {
  // Layout
  container: cn(
    width('100%')
      .maxWidth('1200px')
      .margin('0 auto')
      .padding(theme.spacing.md),
    {
      md: padding(theme.spacing.lg),
      lg: padding(theme.spacing.xl),
    }
  ),

  // Card
  card: cn(
    bg(theme.colors.bg)
      .borderRadius(theme.borderRadius.lg)
      .padding(theme.spacing.lg)
      .boxShadow(theme.shadows.md)
  ),

  // Button variants
  btnPrimary: cn(
    bg(theme.colors.primary)
      .color('white')
      .padding(\`\${theme.spacing.sm} \${theme.spacing.lg}\`)
      .borderRadius(theme.borderRadius.md)
      .border('none')
      .fontWeight('600')
      .cursor('pointer')
      .transition('all 0.2s ease')
  ),

  btnSecondary: cn(
    bg('transparent')
      .color(theme.colors.primary)
      .padding(\`\${theme.spacing.sm} \${theme.spacing.lg}\`)
      .borderRadius(theme.borderRadius.md)
      .border(\`2px solid \${theme.colors.primary}\`)
      .fontWeight('600')
      .cursor('pointer')
      .transition('all 0.2s ease')
  ),

  // Form elements
  input: cn(
    width('100%')
      .padding(theme.spacing.md)
      .border(\`1px solid \${theme.colors.border}\`)
      .borderRadius(theme.borderRadius.md)
      .fontSize('1rem')
      .transition('border-color 0.2s')
  ),

  // Typography
  h1: cn(
    fontSize('1.875rem')
      .fontWeight('700')
      .color(theme.colors.text)
      .lineHeight('1.2')
      .margin('0'),
    {
      md: fontSize('2.25rem'),
      lg: fontSize('3rem'),
    }
  ),

  text: cn(
    fontSize('1rem')
      .color(theme.colors.textLight)
      .lineHeight('1.6')
  ),
};` },
  organizingUsage: { lang: 'typescript', code: `// app.ts
import { cn, theme, styles as s } from './styles';

const app = div(
  s.container,

  div(s.card,
    h1(s.h1, 'Welcome'),
    p(s.text, 'This is styled with nuclo CSS-in-JS'),

    div(
      flex().gap(theme.spacing.md),
      button(s.btnPrimary, 'Primary'),
      button(s.btnSecondary, 'Secondary')
    )
  )
);

render(app, document.body);` },
  advancedAnimation: { lang: 'typescript', code: `const cn = createStyleQueries({
  medium: '@media (min-width: 768px)'
});

// Animated card with keyframe animation
const pulseCard = cn(
  bg('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
    .color('white')
    .padding('2rem')
    .borderRadius('16px')
    .animation('pulse 2s ease-in-out infinite')
    .animationDirection('alternate')
    .willChange('transform, opacity')
    .transform('scale(1)')
    .transition('all 0.3s ease'),
  {
    hover: transform('scale(1.05)').animationPlayState('paused')
  }
);

// Define the keyframe animation in your CSS or via a style tag
const style = document.createElement('style');
style.textContent = \`
  @keyframes pulse {
    from { transform: scale(1); opacity: 0.9; }
    to { transform: scale(1.02); opacity: 1; }
  }
\`;
document.head.appendChild(style);

div(pulseCard, 'Animated Card');` },
  advancedTransforms: { lang: 'typescript', code: `// 3D transforms and perspective
const card3D = cn(
  bg('white')
    .padding('2rem')
    .borderRadius('12px')
    .transformStyle('preserve-3d')
    .perspective('1000px')
    .transition('transform 0.6s ease'),
  {
    hover: transform('rotateY(10deg) rotateX(5deg) translateZ(20px)')
  }
);

// Multiple transforms combined
const complexTransform = cn(
  transform('translate(-50%, -50%) rotate(45deg) scale(1.2)')
    .transformOrigin('center center')
);

// Backdrop blur (glassmorphism)
const glassCard = cn(
  bg('rgba(255, 255, 255, 0.1)')
    .backdropFilter('blur(10px) saturate(180%)')
    .border('1px solid rgba(255, 255, 255, 0.2)')
    .borderRadius('16px')
    .padding('2rem')
    .boxShadow('0 8px 32px rgba(0, 0, 0, 0.1)')
);` },
  advancedGrid: { lang: 'typescript', code: `const cn = createStyleQueries({
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)'
});

// Advanced grid layout with areas
const dashboardLayout = cn(
  grid()
    .gridTemplateColumns('1fr')
    .gridTemplateRows('auto 1fr auto')
    .gridTemplateAreas(\`
      "header"
      "main"
      "footer"
    \`)
    .minHeight('100vh')
    .gap('1rem'),
  {
    medium: gridTemplateColumns('200px 1fr')
      .gridTemplateAreas(\`
        "header header"
        "sidebar main"
        "footer footer"
      \`),
    large: gridTemplateColumns('250px 1fr 300px')
      .gridTemplateAreas(\`
        "header header header"
        "sidebar main aside"
        "footer footer footer"
      \`)
  }
);

const headerStyle = cn(gridArea('header'));
const sidebarStyle = cn(gridArea('sidebar'));
const mainStyle = cn(gridArea('main'));
const asideStyle = cn(gridArea('aside'));
const footerStyle = cn(gridArea('footer'));

div(dashboardLayout,
  div(headerStyle, 'Header'),
  div(sidebarStyle, 'Sidebar'),
  div(mainStyle, 'Main Content'),
  div(asideStyle, 'Aside'),
  div(footerStyle, 'Footer')
);` },
  advancedTypography: { lang: 'typescript', code: `// Elegant typography with advanced properties
const heading = cn(
  fontSize('3rem')
    .fontWeight('800')
    .lineHeight('1.1')
    .letterSpacing('-0.03em')
    .textShadow('0 2px 10px rgba(0,0,0,0.1)')
    .fontVariant('small-caps')
);

const bodyText = cn(
  fontSize('1.125rem')
    .lineHeight('1.7')
    .letterSpacing('0.01em')
    .textAlign('justify')
    .textJustify('inter-word')
    .overflowWrap('break-word')
    .whiteSpace('pre-wrap')
);

const decoratedText = cn(
  textDecoration('underline')
    .textDecorationColor('#3b82f6')
    .textDecorationStyle('wavy')
    .textDecorationThickness('2px')
    .textUnderlineOffset('4px')
);

// Truncate text with ellipsis
const truncated = cn(
  overflow('hidden')
    .textOverflow('ellipsis')
    .whiteSpace('nowrap')
    .maxWidth('300px')
);` },
  advancedColors: { lang: 'typescript', code: `// Modern color palette with CSS variables
const theme = {
  // Use CSS custom properties for dynamic theming
  primary: 'var(--color-primary, #3b82f6)',
  secondary: 'var(--color-secondary, #8b5cf6)',
  accent: 'var(--color-accent, #f59e0b)',
};

// Gradient backgrounds
const gradientCard = cn(
  bg('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
    .color('white')
    .padding('2rem')
);

const radialGradient = cn(
  bg('radial-gradient(circle at top right, #667eea, #764ba2)')
);

// Multiple backgrounds
const multiBackground = cn(
  backgroundImage(\`
    linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)),
    url('/images/hero.jpg')
  \`)
    .backgroundSize('cover')
    .backgroundPosition('center')
    .backgroundRepeat('no-repeat')
    .backgroundAttachment('fixed')
);

// Accent color for form controls
const styledInput = cn(
  accentColor('#3b82f6')
    .border('2px solid #e5e7eb')
    .borderRadius('8px')
);` },
} as const;
