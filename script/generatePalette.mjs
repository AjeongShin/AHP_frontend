import {
  argbFromHex, themeFromSourceColor, hexFromArgb
} from '@material/material-color-utilities';

const SEED = '#325D88'; 
const t = themeFromSourceColor(argbFromHex(SEED));

const palette = {
  seed: SEED,
  light: {
    primary: hexFromArgb(t.schemes.light.primary),
    onPrimary: hexFromArgb(t.schemes.light.onPrimary),
    secondary: hexFromArgb(t.schemes.light.secondary),
    tertiary: hexFromArgb(t.schemes.light.tertiary),
    surface: hexFromArgb(t.schemes.light.surface),
    onSurface: hexFromArgb(t.schemes.light.onSurface),
  },
  dark: {
    primary: hexFromArgb(t.schemes.dark.primary),
    onPrimary: hexFromArgb(t.schemes.dark.onPrimary),
    secondary: hexFromArgb(t.schemes.dark.secondary),
    tertiary: hexFromArgb(t.schemes.dark.tertiary),
    surface: hexFromArgb(t.schemes.dark.surface),
    onSurface: hexFromArgb(t.schemes.dark.onSurface),
  }
};

console.log(JSON.stringify(palette, null, 2));
