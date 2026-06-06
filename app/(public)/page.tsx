/**
 * app/(public)/page.tsx — Homepage SAA public page.
 *
 * Route: /
 * Layout: app/(public)/layout.tsx provides AppHeader, AppFooter, FloatingWidgetButton.
 */
import { HomepageContent } from "./_components/homepage/homepage-content";

export default function PublicHomePage() {
  return <HomepageContent />;
}

