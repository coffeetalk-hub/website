import { getSetting } from "@/core/settings";

export type CompanyProfile = {
  nameEn: string;
  nameAr: string;
  vatNumber: string; // 15 digits
  crNumber: string;
  address: string;
  phone: string;
  email: string;
  bankDetails: string;
  defaultVatRate: number;
  quoteValidityDays: number;
  paymentTermsDays: number;
  footerNote: string;
};

export const DEFAULT_PROFILE: CompanyProfile = {
  nameEn: "",
  nameAr: "",
  vatNumber: "",
  crNumber: "",
  address: "",
  phone: "",
  email: "",
  bankDetails: "",
  defaultVatRate: 15,
  quoteValidityDays: 30,
  paymentTermsDays: 30,
  footerNote: "",
};

export const getCompanyProfile = () => getSetting<CompanyProfile>("company", DEFAULT_PROFILE);

export const isValidVatNumber = (v: string) => /^\d{15}$/.test(v);
