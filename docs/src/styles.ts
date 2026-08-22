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

  section: css("styles-section", { padding: '96px 0' }),

  sectionLabel: css("styles-sectionLabel", { display: 'inline-flex', alignItems: 'center', fontFamily: "ui-monospace, monospace", fontSize: '0.72rem', fontWeight: '700', color: colors.primary, letterSpacing: '0', textTransform: 'uppercase', marginBottom: '14px' }),

  sectionTitle: css("styles-sectionTitle", { fontSize: '2rem', fontWeight: '800', lineHeight: '1.12', letterSpacing: '0', marginBottom: '16px', medium: { fontSize: '2.55rem' } }),

  sectionSub: css("styles-sectionSub", { fontSize: '1.03rem', color: colors.textDim, maxWidth: '600px', lineHeight: '1.72' }),

  divider: css("styles-divider", { height: '1px', backgroundColor: colors.border, margin: '0' }),

  btn: css("styles-btn", { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '44px', padding: '0 24px', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '800', transition: 'transform 0.18s ease', whiteSpace: 'nowrap' }),

  btnPrimary: css("styles-btnPrimary", { backgroundColor: colors.primary, color: '#fff', boxShadow: '0 14px 28px -18px var(--c-primary-glow)', hover: { backgroundColor: colors.primaryHover, boxShadow: '0 18px 34px -18px var(--c-primary-glow)', transform: 'translateY(-1px)' } }),

  btnSecondary: css("styles-btnSecondary", { backgroundColor: colors.bgSecondary, color: colors.text, boxShadow: '0 10px 26px -24px rgba(0,0,0,0.28)', hover: { color: colors.primary, boxShadow: '0 16px 34px -26px var(--c-primary-glow)' } }),

  installCmd: css("styles-installCmd", { display: 'inline-flex', alignItems: 'center', gap: '10px', backgroundColor: colors.bgSecondary, borderRadius: '14px', padding: '11px 14px 11px 16px', fontFamily: "ui-monospace, monospace", fontSize: '0.875rem', color: colors.text, boxShadow: 'var(--c-shadow)' }),

  codeBlockFrame: css("styles-codeBlockFrame", { backgroundColor: colors.bgCode, borderRadius: '14px', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }),

  codeBlockHeader: css("styles-codeBlockHeader", { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: colors.bgSecondary }),

  codeBlockFilename: css("styles-codeBlockFilename", { fontFamily: "ui-monospace, monospace", fontSize: '0.75rem', color: colors.textMuted }),

  codeBlockBody: css("styles-codeBlockBody", { padding: '20px 22px', overflow: 'auto', fontFamily: "ui-monospace, monospace", fontSize: '0.8125rem', lineHeight: '1.7' }),

  demoCard: css("styles-demoCard", { backgroundColor: colors.bgCard, borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--c-shadow)' }),

  demoCardBar: css("styles-demoCardBar", { display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', backgroundColor: colors.bgSecondary }),

  demoDots: css("styles-demoDots", { display: 'flex', gap: '6px' }),

  demoTabs: css("styles-demoTabs", { display: 'flex', borderBottom: `1px solid ${colors.border}`, padding: '0 16px', backgroundColor: colors.bgCard }),

  demoTab: css("styles-demoTab", { fontSize: '0.8rem', fontWeight: '500', color: colors.textMuted, padding: '10px 14px', borderBottom: '2px solid transparent', cursor: 'pointer' }),

  demoTabActive: css("styles-demoTabActive", { color: colors.primary, borderBottomColor: colors.primary }),

  featureGrid: css("styles-featureGrid", { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }),

  featureCard: css("styles-featureCard", { backgroundColor: colors.bgCard, borderRadius: '20px', padding: '28px 26px', transition: 'transform 0.18s ease', hover: { transform: 'translateY(-2px)', boxShadow: '0 18px 46px -34px var(--c-primary-glow)' } }),

  cardHeadRow: css("styles-cardHeadRow", { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }),

  cardCornerBadge: css("styles-cardCornerBadge", { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, minWidth: '30px', height: '26px', padding: '0 9px', borderRadius: '9999px', backgroundColor: colors.primaryAlpha08, color: colors.primary, fontFamily: "ui-monospace, monospace", fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0' }),

  featureTitle: css("styles-featureTitle", { fontSize: '1.05rem', fontWeight: '600', marginBottom: '10px' }),

  featureDesc: css("styles-featureDesc", { fontSize: '0.9rem', color: colors.textDim, lineHeight: '1.65' }),

  stepsGrid: css("styles-stepsGrid", { display: 'grid', gridTemplateColumns: '1fr', gap: '16px', medium: { gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' } }),

  stepTitle: css("styles-stepTitle", { fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }),

  stepDesc: css("styles-stepDesc", { fontSize: '0.875rem', color: colors.textDim, marginBottom: '16px' }),

  badge: css("styles-badge", { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0', textTransform: 'uppercase', color: colors.primary, padding: '5px 12px', borderRadius: '999px', backgroundColor: colors.primaryAlpha08 }),

  statsRow: css("styles-statsRow", { display: 'flex', gap: '40px', flexWrap: 'wrap', padding: '40px 0', borderTop: `1px solid ${colors.border}`, marginTop: '24px' }),

  statNum: css("styles-statNum", { fontSize: '1.8rem', fontWeight: '700', color: colors.text, lineHeight: '1', marginBottom: '4px' }),

  statLabel: css("styles-statLabel", { fontSize: '0.8rem', color: colors.textMuted }),

  codeInline: css("styles-codeInline", { fontFamily: "ui-monospace, monospace", fontSize: '0.82em', backgroundColor: colors.bgLight, padding: '1px 5px', borderRadius: '3px', color: colors.primaryHover }),
};
