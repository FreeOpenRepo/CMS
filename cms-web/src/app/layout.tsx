import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Enterprise Headless CMS & News Engine',
  description: 'Next.js 16 (PPR & ISR) + .NET 10 SixLabors.ImageSharp Headless Publishing Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
