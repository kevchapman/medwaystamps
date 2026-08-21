export type StampCondition = "mint" | "mounted_mint" | "used" | "fine_used";
export type StampStatus = "available" | "reserved" | "sold";

export interface StampImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface Stamp {
  id: string;
  title: string;
  description: string;
  country: string;
  era: string;
  issueYear: number | null;
  issueYearEnd: number | null;
  sgNumber: string;
  condition: StampCondition;
  grade: string | null;
  pricePence: number;
  quantity: number;
  status: StampStatus;
  images: StampImage[];
  tags: string[];
}

export interface StampListResponse {
  items: Stamp[];
  total: number;
  page: number;
  limit: number;
}

export interface StampSearchParams {
  q?: string;
  era?: string;
  condition?: StampCondition;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest";
  page?: number;
  limit?: number;
}

export interface CartLine {
  stampId: string;
  title: string;
  pricePence: number;
  quantity: number;
}
