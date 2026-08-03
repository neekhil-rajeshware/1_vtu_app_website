import { LegalPageView, legalMetadata } from '@/components/legal-page-view'

export const generateMetadata = () => legalMetadata('community-guidelines')

export default function Page() {
  return <LegalPageView slug="community-guidelines" />
}
