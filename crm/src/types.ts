export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'member'
  created_at: string
}

export type CellValue = string | number | null

/** One row of the `clients` table. Extra columns you add in SQL are picked up via the index signature. */
export interface Client {
  id: string
  company_name: string
  [key: string]: CellValue
}

export const profileName = (p?: Profile | null) => (p ? p.full_name || p.email : '')
