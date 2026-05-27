import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AppChrome } from "@/components/AppChrome";

export const metadata: Metadata = {
  title: "Raincat Wiki",
  description: "一只把日常、灵感和小小作品收进玻璃罐里的雨猫。",
  icons: {
    icon: "/favicon.png",
    apple: "/icon-192.png"
  },
  manifest: "/manifest.json"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.cn" />
        <link rel="preconnect" href="https://fonts.gstatic.cn" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.cn/css2?family=Averia+Gruesa+Libre&family=ZCOOL+XiaoWei&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Script id="windows-scrollbar" strategy="beforeInteractive">
          {`if (/windows|win32/i.test(navigator.userAgent)) document.documentElement.classList.add('windows');`}
        </Script>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
