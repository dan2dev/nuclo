import 'nuclo';
import { registerGlobalStyles } from './styles/global.ts';

// Color tokens - CSS custom properties toggled by [data-theme] on <html>.
export const colors = {
  primary:         'var(--c-primary)',
  primaryHover:    'var(--c-primary-hover)',
  primaryText:     'var(--c-primary-text)',
  primaryGlow:     'var(--c-primary-glow)',
  primaryAlpha08:  'var(--c-primary-alpha-08)',
  primaryAlpha13:  'var(--c-primary-alpha-13)',
  primaryAlpha19:  'var(--c-primary-alpha-19)',
  primaryDark:     'var(--c-primary-dark)',
  primaryInk:      'var(--c-primary-ink)', // accent text that passes AA on bg

  bg:           'var(--c-bg)',
  bgCard:       'var(--c-bg-card)',
  bgSecondary:  'var(--c-bg-secondary)',
  bgLight:      'var(--c-bg-light)',
  bgCode:       'var(--c-bg-code)',
  bgNav:        'var(--c-bg-nav)',
  bgIcon:       'var(--c-bg-icon)',
  bgFooter:     'var(--c-bg-footer)',

  text:          'var(--c-text)',
  textDim:       'var(--c-text-dim)',
  textMuted:     'var(--c-text-muted)',
  textSubtitle:  'var(--c-text-subtitle)',

  border:         'var(--c-border)',
  borderLight:    'var(--c-border-light)',
  borderGlow:     'var(--c-border-glow)',
  borderPrimary:  'var(--c-border-primary)',

  accentSecondary: 'var(--c-accent-secondary)',
  accentWarm:      'var(--c-accent-warm)',
  accentCool:      'var(--c-accent-cool)',
  shadow:          'var(--c-shadow)',
};

export { registerGlobalStyles };

export const { css, cx } = createCss({
  screens: {
    small:  '(min-width: 341px)',
    medium: '(min-width: 601px)',
    large:  '(min-width: 1025px)',
  },
});

// Shared style helpers.
export const s = {
  container: css("styles-container", { maxWidth: '1240px', margin: '0 auto', padding: '0 22px', medium: { padding: '0 30px' } }),

  sectionLabel: css("styles-sectionLabel", { fontSize: '0.875rem', fontWeight: '600', color: colors.primaryInk, marginBottom: '12px' }),

  sectionTitle: css("styles-sectionTitle", { fontSize: '2rem', fontWeight: '700', lineHeight: '1.15', letterSpacing: '-0.02em', marginBottom: '14px', medium: { fontSize: '2.5rem' } }),

  sectionSub: css("styles-sectionSub", { fontSize: '1.0625rem', color: colors.textDim, maxWidth: '600px', lineHeight: '1.65' }),

  divider: css("styles-divider", { height: '1px', backgroundColor: colors.border, margin: '0' }),

  btn: css("styles-btn", { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '44px', padding: '0 24px', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '800', transition: 'transform 0.18s ease', whiteSpace: 'nowrap' }),

  btnSecondary: css("styles-btnSecondary", { backgroundColor: colors.bgSecondary, color: colors.text, boxShadow: '0 10px 26px -24px rgba(0,0,0,0.28)', hover: { color: colors.primary, boxShadow: '0 16px 34px -26px var(--c-primary-glow)' } }),

  installCmd: css("styles-installCmd", { display: 'inline-flex', alignItems: 'center', gap: '10px', backgroundColor: colors.bgSecondary, borderRadius: '14px', padding: '11px 14px 11px 16px', fontFamily: "ui-monospace, monospace", fontSize: '0.875rem', color: colors.text, boxShadow: 'var(--c-shadow)' }),

  codeBlockFrame: css("styles-codeBlockFrame", { backgroundColor: colors.bgCode, border: `1px solid ${colors.border}`, borderRadius: '10px', overflow: 'hidden' }),

  codeBlockHeader: css("styles-codeBlockHeader", { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', minHeight: '40px', padding: '0 8px 0 18px', borderBottom: `1px solid ${colors.border}` }),

  codeBlockFilename: css("styles-codeBlockFilename", { fontFamily: "ui-monospace, monospace", fontSize: '0.75rem', color: colors.textMuted }),

  codeBlockBody: css("styles-codeBlockBody", { padding: '16px 18px', overflow: 'auto', fontFamily: "ui-monospace, monospace", fontSize: '0.8125rem', lineHeight: '1.7' }),

  // "01 Label" step row: the number in s.cardCornerBadge, the label as plain text.
  cardHeadRow: css("styles-cardHeadRow", { display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px', fontSize: '0.8125rem', fontWeight: '500', color: colors.textMuted }),

  cardCornerBadge: css("styles-cardCornerBadge", { fontFamily: "ui-monospace, monospace", color: colors.primaryInk }),

  // One panel, steps split by 1px dividers (same layout as the home pipeline).
  stepsGrid: css("styles-stepsGrid", { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden', '& > * + *': { raw: { 'border-top': '1px solid var(--c-border)' } }, '@media (min-width: 901px)': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', '& > * + *': { raw: { 'border-top': 'none', 'border-left': '1px solid var(--c-border)' } } } }),

  stepTitle: css("styles-stepTitle", { fontSize: '1.0625rem', fontWeight: '600', marginBottom: '8px' }),

  stepDesc: css("styles-stepDesc", { fontSize: '0.9375rem', color: colors.textDim, lineHeight: '1.65', marginBottom: '16px' }),
};
