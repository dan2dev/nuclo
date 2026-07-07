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
  container: css({ maxWidth: '1240px', margin: '0 auto', padding: '0 22px', medium: { padding: '0 30px' } }),

  section: css({ padding: '96px 0' }),

  sectionLabel: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: '700', color: colors.primary, letterSpacing: '0', textTransform: 'uppercase', marginBottom: '12px' }),

  sectionTitle: css({ fontSize: '2rem', fontWeight: '800', lineHeight: '1.12', letterSpacing: '0', marginBottom: '16px', medium: { fontSize: '2.55rem' } }),

  sectionSub: css({ fontSize: '1.03rem', color: colors.textDim, maxWidth: '600px', lineHeight: '1.72' }),

  divider: css({ height: '1px', backgroundColor: colors.border, margin: '0' }),

  btn: css({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '44px', padding: '0 22px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '800', transition: 'transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, color 0.18s ease', whiteSpace: 'nowrap' }),

  btnPrimary: css({ backgroundColor: colors.primary, backgroundImage: 'linear-gradient(135deg, var(--c-accent-warm) 0%, var(--c-primary) 48%, var(--c-accent-secondary) 122%)', color: '#fff', boxShadow: '0 14px 28px -18px var(--c-primary-glow)', hover: { boxShadow: '0 18px 34px -18px var(--c-primary-glow)', transform: 'translateY(-1px)', filter: 'brightness(1.04)' } }),

  btnSecondary: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, color: colors.text, boxShadow: '0 10px 26px -24px rgba(0,0,0,0.28)', hover: { color: colors.primary, borderColor: colors.borderPrimary, boxShadow: '0 16px 34px -26px var(--c-primary-glow)' } }),

  installCmd: css({ display: 'inline-flex', alignItems: 'center', gap: '10px', backgroundColor: colors.bgCard, border: `1px solid ${colors.borderLight}`, borderRadius: '10px', padding: '11px 14px 11px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', color: colors.text, boxShadow: 'var(--c-shadow)' }),

  codeBlockFrame: css({ backgroundColor: colors.bgCode, border: `1px solid ${colors.border}`, borderRadius: '8px', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }),

  codeBlockHeader: css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary }),

  codeBlockFilename: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: colors.textMuted }),

  codeBlockBody: css({ padding: '20px 22px', overflow: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', lineHeight: '1.7' }),

  demoCard: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--c-shadow)' }),

  demoCardBar: css({ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', backgroundColor: colors.bgSecondary, borderBottom: `1px solid ${colors.border}` }),

  demoDots: css({ display: 'flex', gap: '6px' }),

  demoTabs: css({ display: 'flex', borderBottom: `1px solid ${colors.border}`, padding: '0 16px', backgroundColor: colors.bgCard }),

  demoTab: css({ fontSize: '0.8rem', fontWeight: '500', color: colors.textMuted, padding: '10px 14px', borderBottom: '2px solid transparent', transition: 'all 0.18s ease', cursor: 'pointer' }),

  demoTabActive: css({ color: colors.primary, borderBottomColor: colors.primary }),

  featureGrid: css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }),

  featureCard: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '30px 26px', transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease', hover: { transform: 'translateY(-2px)', borderColor: colors.borderPrimary, boxShadow: '0 18px 46px -34px var(--c-primary-glow)' } }),

  featureNum: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: '700', color: colors.primary, letterSpacing: '0', marginBottom: '16px' }),

  featureTitle: css({ fontSize: '1.05rem', fontWeight: '600', marginBottom: '10px' }),

  featureDesc: css({ fontSize: '0.9rem', color: colors.textDim, lineHeight: '1.65' }),

  stepsGrid: css({ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', medium: { gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' } }),

  stepNum: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: '700', color: colors.primary, letterSpacing: '0', marginBottom: '12px' }),

  stepTitle: css({ fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }),

  stepDesc: css({ fontSize: '0.875rem', color: colors.textDim, marginBottom: '16px' }),

  badge: css({ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0', textTransform: 'uppercase', color: colors.primary, padding: '5px 12px', borderRadius: '999px', backgroundColor: colors.primaryAlpha08, border: `1px solid ${colors.borderPrimary}` }),

  statsRow: css({ display: 'flex', gap: '40px', flexWrap: 'wrap', padding: '40px 0', borderTop: `1px solid ${colors.border}`, marginTop: '24px' }),

  statNum: css({ fontSize: '1.8rem', fontWeight: '700', color: colors.text, lineHeight: '1', marginBottom: '4px' }),

  statLabel: css({ fontSize: '0.8rem', color: colors.textMuted }),

  codeInline: css({ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82em', backgroundColor: colors.bgLight, padding: '1px 5px', borderRadius: '3px', color: colors.primaryHover }),
};
