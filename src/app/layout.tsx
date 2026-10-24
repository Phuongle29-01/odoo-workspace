import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import './globals.css';
import './tokens.css';
import './workspace-ux.css';
export const metadata: Metadata = {
  title: 'Odoo Smart Workspace',
  description: 'Không gian làm việc kết nối Odoo 17 dành cho đội ngũ của bạn.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
