// src/components/duel/types.ts
export type Specs = Record<string, any>;

export type MobileWeaponLike = {
  id: number;
  code?: string;
  modelName?: string;
  name?: string;
  kana?: string;
  official?: string;
  quoteText?: string;
  quoteBy?: string;
  classification?: string;
  organization?: string;
  series?: string;
  imgUrl: string;
  wikiUrl?: string;
  tags?: string[];
  notes?: string;
  crop?: number;
  specs?: Specs;
};
