import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Create Profile', description: 'Join NativeMatrimony for free. Find your match from your native district.' }
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
