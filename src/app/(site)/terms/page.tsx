import { LegalPageView, legalMetadata } from '@/components/legal-page-view'

export const generateMetadata = () => legalMetadata('terms')

export default function Page() {
  return <LegalPageView slug="terms" />
}
