import { LegalPageView, legalMetadata } from '@/components/legal-page-view'

export const generateMetadata = () => legalMetadata('delete-account')

export default function Page() {
  return <LegalPageView slug="delete-account" />
}
