/**
 * Utilitats per a HTML produït pel RichTextEditor (TipTap).
 *
 * El editor desa HTML semi-net amb tags inline + estructurals (`<p>`,
 * `<strong>`, `<em>`, `<u>`, `<a>`, `<ul>`, `<ol>`, `<li>`, `<br>`).
 * Aquests helpers el converteixen a text pla quan cal (SEO,
 * animacions per paraules, etc.) o detecten si està buit.
 */

/**
 * Treu tots els tags HTML i decodifica entities comuns. Útil per:
 *  - meta description (SEO necessita text pla)
 *  - animacions que processen paraula a paraula (hero hero word-split)
 *  - logs/console
 *
 * Versió simple (regex) — suficient per HTML controlat pel mateix admin.
 * Si l'origen es tornés untrusted, caldria un sanitizer real (DOMPurify).
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    // Convertir <br> a salt de línia
    .replace(/<br\s*\/?>/gi, '\n')
    // Convertir final de paràgraf/llista a salt de línia
    .replace(/<\/(p|li|h[1-6])>/gi, '\n')
    // Treure la resta de tags
    .replace(/<[^>]+>/g, '')
    // Decodificar entities comuns (TipTap les emet sovint)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Collapse whitespace consecutiu
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Detecta si un HTML del RichTextEditor està "buit" — pot tenir
 * `<p></p>` o `<p><br></p>` (estat per defecte de TipTap quan no hi
 * ha contingut). Aquestes cadenes haurien de tractar-se com a buides
 * per a fallbacks i validacions.
 */
export function isHtmlEmpty(html: string | null | undefined): boolean {
  if (!html) return true
  return stripHtml(html).length === 0
}
