export type UserRole = 'PENGURUS' | 'WARGA';
export type AccountStatus = 'AKTIF' | 'NONAKTIF';
export type HouseStatus = 'AKTIF' | 'KOSONG' | 'NONAKTIF';
export type ResidentStatus = 'PEMILIK' | 'PENGONTRAK' | 'KELUARGA';
export type BillStatus = 'BELUM_BAYAR' | 'LUNAS' | 'JATUH_TEMPO' | 'DIBATALKAN';
export type PaymentType = 'AIR' | 'SAMPAH' | 'LAINNYA';
export type PaymentMethod = 'TUNAI' | 'TRANSFER' | 'LAINNYA';
export type FundType = 'KAS_UMUM' | 'DANA_AIR' | 'DANA_SAMPAH';
export type TransactionType = 'MASUK' | 'KELUAR';
export type TransactionStatus = 'VALID' | 'VOID';
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface House {
  id: string;
  block: string;
  house_number: string;
  address?: string | null;
  status: HouseStatus;
  water_meter_number?: string | null;
  water_status: 'AKTIF' | 'NONAKTIF';
  garbage_status: 'AKTIF' | 'NONAKTIF';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resident {
  id: string;
  house_id?: string | null;
  user_id?: string | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  resident_status: ResidentStatus;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  house?: House;
}

export interface WaterBill {
  id: string;
  house_id: string;
  period: string;
  previous_meter: number;
  current_meter: number;
  usage: number;
  rate_per_m3: number;
  base_amount: number;
  penalty: number;
  discount: number;
  total_amount: number;
  due_date?: string | null;
  status: BillStatus;
  meter_image_url?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  house?: House;
}

export interface GarbageBill {
  id: string;
  house_id: string;
  period: string;
  amount: number;
  penalty: number;
  discount: number;
  total_amount: number;
  due_date?: string | null;
  status: BillStatus;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  house?: House;
}

export interface Payment {
  id: string;
  house_id: string;
  resident_id?: string | null;
  payment_type: PaymentType;
  water_bill_id?: string | null;
  garbage_bill_id?: string | null;
  period: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number?: string | null;
  proof_url?: string | null;
  notes?: string | null;
  recorded_by?: string | null;
  created_at: string;
  house?: House;
  resident?: Resident;
}

export interface CashTransaction {
  id: string;
  transaction_date: string;
  fund_type: FundType;
  transaction_type: TransactionType;
  category: string;
  amount: number;
  description: string;
  proof_url?: string | null;
  payment_id?: string | null;
  status: TransactionStatus;
  void_reason?: string | null;
  void_at?: string | null;
  void_by?: string | null;
  recorded_by?: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  attachment_url?: string | null;
  status: AnnouncementStatus;
  published_at: string;
  created_by?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  role?: string | null;
  action: string;
  module: string;
  record_id?: string | null;
  old_data?: any;
  new_data?: any;
  created_at: string;
}

export interface FinancialSummary {
  periode: string;
  fund_type: FundType;
  total_pemasukan: number;
  total_pengeluaran: number;
  saldo_periode: number;
}
