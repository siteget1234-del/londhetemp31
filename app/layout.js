import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'श्री ॲग्रो कृषी केंद्र - सायगाव (बगळी) चाळीसगांव जळगाव ',
  description: 'कृषी उत्पादने, बियाणे, खते, संरक्षण साधने - जळगाव, महाराष्ट्र',
};

export default function RootLayout({ children }) {
  return (
    <html lang="mr">
    <head>
        <meta
          name="google-site-verification"
          content="u-r9HkP998MQZv_is0kOAseLjYitBbQIETaoxPGVl64"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
