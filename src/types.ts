// src/types.ts
export type Classification = "MS" | "MA" | "MD" | "MW" | string;

export type MobileWeapon = {
  id: number;
  name: string;
  classification: Classification;
  series?: string;
  imgUrl: string;
  wikiUrl?: string;
  tags?: string[];
  notes?: string;
  crop?: number; // 0-100：0=最左/最上；50=居中；100=最右/最下
};

export type SeriesEntry = {
  name: string;
  logoUrl?: string;
  logo_url?: string;
};
