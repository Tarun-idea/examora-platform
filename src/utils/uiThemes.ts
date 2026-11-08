export type UiThemeId = 'amethyst-cobalt';

export interface UiThemeDefinition {
  id: UiThemeId;
  name: string;
  subtitle: string;
  isLight: boolean;
  preview: {
    outerBg: string;
    sidebarBg: string;
    cardBg: string;
    cardBorder: string;
    accentPrimary: string;
    accentSecondary: string;
    textMain: string;
    textMuted: string;
    bars: [string, string, string];
  };
}

export const UI_THEME_TEMPLATES: UiThemeDefinition[] = [
  {
    id: 'amethyst-cobalt',
    name: 'Amethyst & Cobalt',
    subtitle: '(Purple & Royal Blue)',
    isLight: false,
    preview: {
      outerBg: 'linear-gradient(135deg, #07081C 0%, #141242 55%, #24155E 100%)',
      sidebarBg: 'rgba(11, 14, 43, 0.94)',
      cardBg: 'rgba(18, 22, 64, 0.88)',
      cardBorder: 'rgba(139, 92, 246, 0.45)',
      accentPrimary: '#7C3AED',
      accentSecondary: '#38BDF8',
      textMain: '#F8FAFC',
      textMuted: '#C4B5FD',
      bars: ['#6366F1', '#8B5CF6', '#38BDF8'],
    },
  },
];

export const DEFAULT_UI_THEME: UiThemeId = 'amethyst-cobalt';

export function resolveUiTheme(_themeId?: string | null): UiThemeDefinition {
  return UI_THEME_TEMPLATES[0];
}
