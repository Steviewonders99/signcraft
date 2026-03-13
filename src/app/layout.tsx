import type { Metadata } from 'next';
import { Inter, Dancing_Script } from 'next/font/google';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const dancingScript = Dancing_Script({ subsets: ['latin'], variable: '--font-signature' });

export const metadata: Metadata = {
  title: 'SignCraft',
  description: 'AI-assisted contract drafting and e-signature platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${dancingScript.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
