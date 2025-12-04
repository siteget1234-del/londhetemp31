import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'श्री ॲग्रो कृषी केंद्र - सायगाव (बगळी) चाळीसगांव जळगाव',
  description: 'कृषी उत्पादने, बियाणे, खते, संरक्षण साधने - जळगाव, महाराष्ट्र',

  // 👇 Favicon + Icons + Manifest
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },

  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="mr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
