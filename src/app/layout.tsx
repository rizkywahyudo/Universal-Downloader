import type { Metadata } from "next";
import "./globals.css";
import RegisterSW from "./register-sw";
export const metadata: Metadata = {
 title: "Universal Downloader",
 description: "Download direct-access files you are authorized to save.",
 manifest: "/manifest.webmanifest",
 themeColor: "#7652b5"
};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="id"><body><RegisterSW />{children}</body></html>;
}