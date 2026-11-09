import "./globals.css";
import { Bangers, Chakra_Petch, Press_Start_2P, Space_Grotesk } from "next/font/google";
import ironManIcon from "../public/icon.jpg";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-chakra-petch",
});

const bangers = Bangers({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-bangers",
});

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-press-start",
});

export const metadata = {
  title: "JARVIS | Application Observability",
  description: "A clear, live view of application health, performance, and telemetry.",
  icons: {
    icon: [{ url: ironManIcon.src, type: "image/jpeg" }],
    shortcut: ironManIcon.src,
    apple: ironManIcon.src,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark h-full antialiased ${spaceGrotesk.variable} ${chakraPetch.variable} ${bangers.variable} ${pressStart.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
