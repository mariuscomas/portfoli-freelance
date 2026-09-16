"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"
import { GA_MEASUREMENT_ID, CONSENT_STORAGE_KEY } from "@/lib/analytics"

/**
 * Càrrega de GA4 amb Consent Mode.
 *
 * No es carrega a /admin.
 *
 * L'ordre importa: primer el consentiment per defecte (denegat), i només
 * després la llibreria. Així gtag no envia res mentre el visitant no decideix,
 * i si ja havia acceptat abans, la decisió es restaura a la mateixa passada.
 */
export default function Analytics() {
  // L'admin no es mesura: la meva pròpia feina d'edició no és una visita i
  // embrutaria l'embut. Prou amb no muntar res: sense gtag no hi ha dades.
  const pathname = usePathname()
  if (pathname?.startsWith("/admin")) return null

  return (
    <>
      <Script id="ga-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });
          try {
            if (window.localStorage.getItem('${CONSENT_STORAGE_KEY}') === 'granted') {
              gtag('consent', 'update', { analytics_storage: 'granted' });
            }
          } catch (e) {}
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  )
}
