import 'nuclo';
import { registerGlobalStyles } from './styles/global.ts';

// Color tokens — CSS custom properties toggled by [data-theme] on <html>.
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
  container: css({ maxWidth: '1180px', margin: '0 auto', padding: '0 24px', medium: { padding: '0 28px' } }),

  section: css({ padding: '96px 0' }),

  sectionLabel: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: '500', color: colors.primary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px' }),

  sectionTitle: css({ fontSize: '1.9rem', fontWeight: '700', lineHeight: '1.2', marginBottom: '16px', medium: { fontSize: '2.35rem' } }),

  sectionSub: css({ fontSize: '1.05rem', color: colors.textDim, maxWidth: '540px', lineHeight: '1.7' }),

  divider: css({ height: '1px', backgroundColor: colors.border, margin: '0' }),

  btn: css({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', minHeight: '40px', padding: '0 20px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '700', transition: 'all 0.18s ease', whiteSpace: 'nowrap' }),

  btnPrimary: css({ backgroundColor: colors.primary, backgroundImage: 'linear-gradient(115deg, var(--c-primary-hover) -20%, var(--c-primary) 46%, var(--c-accent-cool) 175%)', color: '#fff', boxShadow: `0 0 0 0 ${colors.primaryGlow}`, hover: { boxShadow: `0 6px 26px ${colors.primaryGlow}`, transform: 'translateY(-1px)', filter: 'brightness(1.08)' } }),

  btnSecondary: css({ backgroundColor: 'transparent', border: `1px solid ${colors.borderLight}`, color: colors.textDim, hover: { color: colors.text, borderColor: colors.textMuted } }),

  installCmd: css({ display: 'inline-flex', alignItems: 'center', gap: '10px', backgroundColor: colors.bgSecondary, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '11px 18px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', color: colors.text }),

  codeBlockFrame: css({ backgroundColor: colors.bgCode, border: `1px solid ${colors.border}`, borderRadius: '8px', overflow: 'hidden' }),

  codeBlockHeader: css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary }),

  codeBlockFilename: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: colors.textMuted }),

  codeBlockBody: css({ padding: '20px 22px', overflow: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', lineHeight: '1.7' }),

  demoCard: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '8px', overflow: 'hidden', boxShadow: `0 28px 60px rgba(0,0,20,0.35), 0 0 0 1px ${colors.border}` }),

  demoCardBar: css({ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', backgroundColor: colors.bgSecondary, borderBottom: `1px solid ${colors.border}` }),

  demoDots: css({ display: 'flex', gap: '6px' }),

  demoTabs: css({ display: 'flex', borderBottom: `1px solid ${colors.border}`, padding: '0 16px', backgroundColor: colors.bgCard }),

  demoTab: css({ fontSize: '0.8rem', fontWeight: '500', color: colors.textMuted, padding: '10px 14px', borderBottom: '2px solid transparent', transition: 'all 0.18s ease', cursor: 'pointer' }),

  demoTabActive: css({ color: colors.primary, borderBottomColor: colors.primary }),

  featureGrid: css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1px', backgroundColor: colors.border, border: `1px solid ${colors.border}`, borderRadius: '8px', overflow: 'hidden' }),

  featureCard: css({ backgroundColor: colors.bgCard, padding: '32px 28px', transition: 'background 0.18s ease', hover: { backgroundColor: colors.bgSecondary } }),

  featureNum: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: '500', color: colors.primary, letterSpacing: '0.05em', marginBottom: '18px' }),

  featureTitle: css({ fontSize: '1.05rem', fontWeight: '600', marginBottom: '10px' }),

  featureDesc: css({ fontSize: '0.9rem', color: colors.textDim, lineHeight: '1.65' }),

  stepsGrid: css({ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', medium: { gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' } }),

  stepNum: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: '500', color: colors.primary, letterSpacing: '0.06em', marginBottom: '12px' }),

  stepTitle: css({ fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }),

  stepDesc: css({ fontSize: '0.875rem', color: colors.textDim, marginBottom: '16px' }),

  badge: css({ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: colors.primary, padding: '4px 11px', borderRadius: '999px', backgroundColor: colors.primaryAlpha08, border: `1px solid ${colors.borderPrimary}` }),

  statsRow: css({ display: 'flex', gap: '40px', flexWrap: 'wrap', padding: '40px 0', borderTop: `1px solid ${colors.border}`, marginTop: '24px' }),

  statNum: css({ fontSize: '1.8rem', fontWeight: '700', color: colors.text, lineHeight: '1', marginBottom: '4px' }),

  statLabel: css({ fontSize: '0.8rem', color: colors.textMuted }),

  codeInline: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82em', backgroundColor: colors.bgLight, padding: '1px 5px', borderRadius: '3px', color: colors.primaryHover }),
};
