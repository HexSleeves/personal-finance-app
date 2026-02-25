import type { BillSeriesDraft, CategoryAllocation, TransactionView } from './domain'

export const mockBudgetMonth = {
  month: '2026-02',
  plannedIncomeCents: 520000,
}

export const mockAllocations: CategoryAllocation[] = [
  {
    categoryId: 'rent',
    groupName: 'Housing',
    categoryName: 'Rent',
    plannedCents: 180000,
    actualCents: 180000,
  },
  {
    categoryId: 'groceries',
    groupName: 'Living',
    categoryName: 'Groceries',
    plannedCents: 65000,
    actualCents: 48750,
  },
  {
    categoryId: 'utilities',
    groupName: 'Housing',
    categoryName: 'Utilities',
    plannedCents: 25000,
    actualCents: 21120,
  },
  {
    categoryId: 'transport',
    groupName: 'Living',
    categoryName: 'Transport',
    plannedCents: 40000,
    actualCents: 35640,
  },
  {
    categoryId: 'fun',
    groupName: 'Lifestyle',
    categoryName: 'Fun Money',
    plannedCents: 25000,
    actualCents: 31480,
  },
]

export const mockBills: BillSeriesDraft[] = [
  {
    name: 'Electric Utility',
    cadence: 'monthly',
    expectedAmountCents: 14250,
    nextDueDate: '2026-02-28',
    reminderDaysBefore: 3,
  },
  {
    name: 'Internet',
    cadence: 'monthly',
    expectedAmountCents: 7500,
    nextDueDate: '2026-03-01',
    reminderDaysBefore: 2,
  },
  {
    name: 'Phone',
    cadence: 'monthly',
    expectedAmountCents: 8200,
    nextDueDate: '2026-03-04',
    reminderDaysBefore: 2,
  },
]

export const mockTransactions: TransactionView[] = [
  {
    id: 'tx-1',
    accountName: 'Checking',
    postedDate: '2026-02-20',
    amountCents: -8420,
    merchantName: 'Whole Foods',
    categoryName: 'Groceries',
    pending: false,
    needsReview: false,
  },
  {
    id: 'tx-2',
    accountName: 'Credit Card',
    postedDate: '2026-02-20',
    amountCents: -1549,
    merchantName: 'Coffee Shop',
    categoryName: 'Dining Out',
    pending: true,
    needsReview: true,
  },
  {
    id: 'tx-3',
    accountName: 'Checking',
    postedDate: '2026-02-19',
    amountCents: 260000,
    merchantName: 'Payroll',
    categoryName: 'Income',
    pending: false,
    needsReview: false,
  },
  {
    id: 'tx-4',
    accountName: 'Credit Card',
    postedDate: '2026-02-18',
    amountCents: -6125,
    merchantName: 'Gas Station',
    categoryName: 'Transport',
    pending: false,
    needsReview: false,
  },
]

export function formatDollars(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}
