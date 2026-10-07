import { IBM_Plex_Mono, IBM_Plex_Sans_Thai, Space_Grotesk } from "next/font/google";

// Fonts for the public-facing pages (landing, login, route loader).
const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const landingFonts = `${grotesk.variable} ${plexThai.variable} ${plexMono.variable}`;
