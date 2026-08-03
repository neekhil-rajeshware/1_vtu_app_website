import { LegalPageView, legalMetadata } from '@/components/legal-page-view'

export const generateMetadata = () => legalMetadata('privacy-policy')

export default function Page() {
  return <LegalPageView slug="privacy-policy" />
}
