import type { Metadata } from "next";
import { appCopy } from "@/lib/appContent";
import "./globals.css";

export const metadata: Metadata = {
  title: appCopy.metadata.title,
  description: appCopy.metadata.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily:
            '"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
