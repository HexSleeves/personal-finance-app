export type EntryKind = 'income' | 'expense' | 'transfer'

export type BillStatus =
  | 'upcoming'
  | 'due_soon'
  | 'paid'
  | 'overdue'
  | 'skipped'

export interface BudgetSummary {
  month: string
  plannedIncomeCents: number
  allocatedCents: number
  spentCents: number
  unassignedCents: number
}

export interface CategoryAllocation {
  categoryId: string
  groupName: string
  categoryName: string
  plannedCents: number
  actualCents: number
}

export interface BillSeriesDraft {
  name: string
  cadence: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  expectedAmountCents: number
  nextDueDate: string
  reminderDaysBefore: number
}

export interface TransactionView {
  id: string
  accountName: string
  postedDate: string
  amountCents: number
  merchantName: string
  categoryName?: string
  pending: boolean
  needsReview: boolean
}
