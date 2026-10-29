import { Geist, Geist_Mono, Instrument_Serif, Inter } from "next/font/google";

/**
 * Font registry.
 *
 * Kept intentionally small: every entry is preloaded on every request, so the
 * previous 18-font set cost real bandwidth for a personalisation feature nobody
 * used. Geist is the product UI font, Inter is the landing page font and
 * Instrument Serif provides the display face.
 */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

export const fontRegistry = {
  geist: {
    label: "Geist",
    font: geist,
  },
  inter: {
    label: "Inter",
    font: inter,
  },
  geistMono: {
    label: "Geist Mono",
    font: geistMono,
  },
  instrumentSerif: {
    label: "Instrument Serif",
    font: instrumentSerif,
  },
} as const;

export type FontKey = keyof typeof fontRegistry;

export const fontKeys = Object.keys(fontRegistry) as FontKey[];

export const fontVars = Object.values(fontRegistry)
  .map(({ font }) => font.variable)
  .join(" ");

export const fontOptions = fontKeys.map((key) => ({
  key,
  label: fontRegistry[key].label,
}));
