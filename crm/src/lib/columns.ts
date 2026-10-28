/**
 * THE COLUMN LIST — change columns here.
 *
 * Adding a column = 1) add it in Supabase (see README), 2) add one line below.
 * `key` must match the database column name.
 *
 * types: text | email | phone | select | owner | date | number | notes | user | timestamp
 *   user / timestamp are read-only (filled in by the database).
 *   aliases = extra header names recognised when importing a spreadsheet.
 */
export type ColumnType = 'text' | 'email' | 'phone' | 'select' | 'owner' | 'date' | 'number' | 'notes' | 'user' | 'timestamp'

export interface ColumnDef {
  key: string
  label: string
  type: ColumnType
  width: number
  options?: string[]
  aliases?: string[]
}

export const STATUS_OPTIONS = ['Lead', 'Contacted', 'Proposal sent', 'Negotiation', 'Won', 'Lost']
/** Rows with these statuses are never highlighted as "follow-up due". */
export const CLOSED_STATUSES = ['Won', 'Lost']
export const DEFAULT_STATUS = 'Lead'

export const COLUMNS: ColumnDef[] = [
  { key: 'company_name', label: 'Company name', type: 'text', width: 220,
    aliases: ['company', 'client', 'client name', 'name', 'organization', 'اسم الشركة', 'الشركة', 'العميل'] },
  { key: 'contact_person', label: 'Contact person', type: 'text', width: 170,
    aliases: ['contact', 'contact name', 'person', 'اسم جهة الاتصال', 'جهة الاتصال', 'الشخص المسؤول'] },
  { key: 'phone', label: 'Phone', type: 'phone', width: 150,
    aliases: ['mobile', 'tel', 'telephone', 'phone number', 'الهاتف', 'الجوال', 'رقم الجوال', 'رقم الهاتف'] },
  { key: 'email', label: 'Email', type: 'email', width: 220,
    aliases: ['e-mail', 'email address', 'البريد', 'البريد الإلكتروني', 'البريد الالكتروني'] },
  { key: 'city', label: 'City', type: 'text', width: 130, aliases: ['town', 'المدينة'] },
  { key: 'status', label: 'Status', type: 'select', width: 150, options: STATUS_OPTIONS,
    aliases: ['stage', 'deal status', 'الحالة'] },
  { key: 'owner_id', label: 'Owner', type: 'owner', width: 160,
    aliases: ['assigned to', 'sales rep', 'account manager', 'rep', 'المسؤول', 'المالك'] },
  { key: 'last_contact_date', label: 'Last contact', type: 'date', width: 130,
    aliases: ['last contact date', 'last contacted', 'آخر تواصل', 'تاريخ آخر تواصل'] },
  { key: 'next_followup_date', label: 'Next follow-up', type: 'date', width: 135,
    aliases: ['next follow up', 'next followup', 'follow up', 'follow-up', 'follow-up date', 'المتابعة القادمة', 'موعد المتابعة'] },
  { key: 'deal_value', label: 'Deal value (SAR)', type: 'number', width: 150,
    aliases: ['deal value', 'value', 'amount', 'deal', 'القيمة', 'قيمة الصفقة'] },
  { key: 'notes', label: 'Notes', type: 'notes', width: 260,
    aliases: ['note', 'comments', 'comment', 'remarks', 'ملاحظات'] },
  { key: 'created_by', label: 'Created by', type: 'user', width: 150 },
  { key: 'updated_by', label: 'Last updated by', type: 'user', width: 150 },
  { key: 'updated_at', label: 'Last updated at', type: 'timestamp', width: 150 },
]

export const isImportable = (c: ColumnDef) => c.type !== 'user' && c.type !== 'timestamp'
/** Cells you can type into (Tab moves between these). */
export const isTypable = (c: ColumnDef) => ['text', 'email', 'phone', 'date', 'number'].includes(c.type)
