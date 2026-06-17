/**
 * @deprecated Aquest fitxer s'ha buidat. El theme init ja no es fa via script
 * inline (causava warnings de Next 16/Turbopack). Ara el RootLayout llegeix
 * la cookie `theme` al servidor i aplica la classe `dark`/`light` a <html>
 * directament al primer paint. Pots eliminar aquest fitxer amb seguretat.
 */
export default function ThemeInitScript() {
  return null;
}
