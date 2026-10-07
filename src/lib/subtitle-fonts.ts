import {
  Anuphan,
  Athiti,
  Bai_Jamjuree,
  Chakra_Petch,
  Charm,
  Charmonman,
  Chonburi,
  Fahkwang,
  IBM_Plex_Sans_Thai,
  Itim,
  K2D,
  Kodchasan,
  Krub,
  Mali,
  Mitr,
  Niramit,
  Noto_Sans_Thai,
  Noto_Serif_Thai,
  Pattaya,
  Pridi,
  Sriracha,
  Srisakdi,
  Taviraj,
  Thasadith,
  Trirong,
} from "next/font/google";

// Subtitle fonts. None are preloaded: a font file is only downloaded once
// something on the page is actually rendered in it. next/font needs every
// option written out as a literal, so the options can't be shared.
const mitr = Mitr({ weight: ["400", "600"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const notoSansThai = Noto_Sans_Thai({ subsets: ["thai", "latin"], preload: false, display: "swap" });
const plexThai = IBM_Plex_Sans_Thai({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const anuphan = Anuphan({ subsets: ["thai", "latin"], preload: false, display: "swap" });
const baiJamjuree = Bai_Jamjuree({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const chakraPetch = Chakra_Petch({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const k2d = K2D({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const krub = Krub({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const athiti = Athiti({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const niramit = Niramit({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const kodchasan = Kodchasan({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const fahkwang = Fahkwang({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const thasadith = Thasadith({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const mali = Mali({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const itim = Itim({ weight: "400", subsets: ["thai", "latin"], preload: false, display: "swap" });
const sriracha = Sriracha({ weight: "400", subsets: ["thai", "latin"], preload: false, display: "swap" });
const pattaya = Pattaya({ weight: "400", subsets: ["thai", "latin"], preload: false, display: "swap" });
const chonburi = Chonburi({ weight: "400", subsets: ["thai", "latin"], preload: false, display: "swap" });
const charm = Charm({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const charmonman = Charmonman({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const srisakdi = Srisakdi({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const notoSerifThai = Noto_Serif_Thai({ subsets: ["thai", "latin"], preload: false, display: "swap" });
const pridi = Pridi({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const taviraj = Taviraj({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });
const trirong = Trirong({ weight: ["400", "700"], subsets: ["thai", "latin"], preload: false, display: "swap" });

export type SubtitleFont = {
  value: string;
  label: string;
  /** A CSS font-family value, usable in both `style` and canvas `ctx.font`. */
  family: string;
  group: "ทันสมัย" | "เป็นกันเอง" | "ลายมือ" | "ทางการ";
};

export const SUBTITLE_FONTS: SubtitleFont[] = [
  // Kanit, Prompt and Sarabun are loaded by the root layout.
  { value: "kanit", label: "Kanit", family: "var(--font-kanit)", group: "ทันสมัย" },
  { value: "prompt", label: "Prompt", family: "var(--font-prompt)", group: "ทันสมัย" },
  { value: "mitr", label: "Mitr", family: mitr.style.fontFamily, group: "ทันสมัย" },
  { value: "noto-sans-thai", label: "Noto Sans Thai", family: notoSansThai.style.fontFamily, group: "ทันสมัย" },
  { value: "plex-thai", label: "IBM Plex Thai", family: plexThai.style.fontFamily, group: "ทันสมัย" },
  { value: "anuphan", label: "Anuphan", family: anuphan.style.fontFamily, group: "ทันสมัย" },
  { value: "bai-jamjuree", label: "Bai Jamjuree", family: baiJamjuree.style.fontFamily, group: "ทันสมัย" },
  { value: "chakra-petch", label: "Chakra Petch", family: chakraPetch.style.fontFamily, group: "ทันสมัย" },
  { value: "k2d", label: "K2D", family: k2d.style.fontFamily, group: "ทันสมัย" },
  { value: "krub", label: "Krub", family: krub.style.fontFamily, group: "ทันสมัย" },
  { value: "athiti", label: "Athiti", family: athiti.style.fontFamily, group: "ทันสมัย" },
  { value: "kodchasan", label: "Kodchasan", family: kodchasan.style.fontFamily, group: "ทันสมัย" },
  { value: "fahkwang", label: "Fahkwang", family: fahkwang.style.fontFamily, group: "ทันสมัย" },

  { value: "mali", label: "Mali", family: mali.style.fontFamily, group: "เป็นกันเอง" },
  { value: "itim", label: "Itim", family: itim.style.fontFamily, group: "เป็นกันเอง" },
  { value: "sriracha", label: "Sriracha", family: sriracha.style.fontFamily, group: "เป็นกันเอง" },
  { value: "pattaya", label: "Pattaya", family: pattaya.style.fontFamily, group: "เป็นกันเอง" },
  { value: "chonburi", label: "Chonburi", family: chonburi.style.fontFamily, group: "เป็นกันเอง" },
  { value: "thasadith", label: "Thasadith", family: thasadith.style.fontFamily, group: "เป็นกันเอง" },

  { value: "charm", label: "Charm", family: charm.style.fontFamily, group: "ลายมือ" },
  { value: "charmonman", label: "Charmonman", family: charmonman.style.fontFamily, group: "ลายมือ" },
  { value: "srisakdi", label: "Srisakdi", family: srisakdi.style.fontFamily, group: "ลายมือ" },

  { value: "sarabun", label: "Sarabun", family: "var(--font-sarabun)", group: "ทางการ" },
  { value: "niramit", label: "Niramit", family: niramit.style.fontFamily, group: "ทางการ" },
  { value: "noto-serif-thai", label: "Noto Serif Thai", family: notoSerifThai.style.fontFamily, group: "ทางการ" },
  { value: "pridi", label: "Pridi", family: pridi.style.fontFamily, group: "ทางการ" },
  { value: "taviraj", label: "Taviraj", family: taviraj.style.fontFamily, group: "ทางการ" },
  { value: "trirong", label: "Trirong", family: trirong.style.fontFamily, group: "ทางการ" },
];

export function subtitleFontFamily(value: string) {
  return (SUBTITLE_FONTS.find((f) => f.value === value) ?? SUBTITLE_FONTS[0]).family;
}
