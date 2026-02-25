import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    timezone: v.optional(v.string()),
    defaultCurrency: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_clerk_id', ['clerkId']),

  institutions: defineTable({
    plaidInstitutionId: v.string(),
    name: v.string(),
    logoUrl: v.optional(v.string()),
  }).index('by_plaid_institution_id', ['plaidInstitutionId']),

  items: defineTable({
    userId: v.id('users'),
    institutionId: v.id('institutions'),
    plaidItemId: v.string(),
    encryptedAccessToken: v.string(),
    status: v.union(
      v.literal('healthy'),
      v.literal('degraded'),
      v.literal('needs_reauth'),
      v.literal('disconnected'),
    ),
    cursor: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    lastWebhookAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user_id', ['userId'])
    .index('by_plaid_item_id', ['plaidItemId']),

  accounts: defineTable({
    userId: v.id('users'),
    itemId: v.id('items'),
    plaidAccountId: v.string(),
    name: v.string(),
    type: v.string(),
    subtype: v.optional(v.string()),
    mask: v.optional(v.string()),
    currentBalanceCents: v.optional(v.number()),
    availableBalanceCents: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user_id', ['userId'])
    .index('by_item_id', ['itemId'])
    .index('by_plaid_account_id', ['plaidAccountId']),

  categories: defineTable({
    userId: v.id('users'),
    name: v.string(),
    groupName: v.string(),
    kind: v.union(v.literal('income'), v.literal('expense'), v.literal('transfer')),
    isSystem: v.boolean(),
    createdAt: v.number(),
  }).index('by_user_id', ['userId']),

  transactions: defineTable({
    userId: v.id('users'),
    accountId: v.id('accounts'),
    plaidTransactionId: v.optional(v.string()),
    pendingTransactionId: v.optional(v.string()),
    amountCents: v.number(),
    isoCurrencyCode: v.string(),
    merchantNameRaw: v.optional(v.string()),
    nameRaw: v.string(),
    authorizedDate: v.optional(v.string()),
    postedDate: v.optional(v.string()),
    pending: v.boolean(),
    categoryId: v.optional(v.id('categories')),
    notes: v.optional(v.string()),
    isTransfer: v.boolean(),
    excludeFromBudget: v.boolean(),
    manual: v.boolean(),
    reviewStatus: v.union(
      v.literal('none'),
      v.literal('needs_review'),
      v.literal('reviewed'),
    ),
    hashFingerprint: v.string(),
    removedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user_id', ['userId'])
    .index('by_account_id', ['accountId'])
    .index('by_plaid_transaction_id', ['plaidTransactionId'])
    .index('by_posted_date', ['postedDate']),

  transactionOverrides: defineTable({
    transactionId: v.id('transactions'),
    fieldName: v.string(),
    overrideJson: v.string(),
    source: v.literal('user'),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_transaction_id', ['transactionId']),

  splitTransactions: defineTable({
    parentTransactionId: v.id('transactions'),
    categoryId: v.id('categories'),
    amountCents: v.number(),
    note: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_parent_transaction_id', ['parentTransactionId']),

  budgetMonths: defineTable({
    userId: v.id('users'),
    month: v.string(), // YYYY-MM
    plannedIncomeCents: v.number(),
    notes: v.optional(v.string()),
    status: v.union(v.literal('draft'), v.literal('active'), v.literal('closed')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user_id', ['userId'])
    .index('by_user_id_month', ['userId', 'month']),

  budgetCategoryAllocations: defineTable({
    budgetMonthId: v.id('budgetMonths'),
    categoryId: v.id('categories'),
    plannedCents: v.number(),
    rolloverInCents: v.optional(v.number()),
    rolloverOutCents: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_budget_month_id', ['budgetMonthId'])
    .index('by_category_id', ['categoryId']),

  rules: defineTable({
    userId: v.id('users'),
    priority: v.number(),
    conditionsJson: v.string(),
    actionsJson: v.string(),
    active: v.boolean(),
    applyToExisting: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user_id', ['userId']),

  recurringSeries: defineTable({
    userId: v.id('users'),
    categoryId: v.optional(v.id('categories')),
    accountId: v.optional(v.id('accounts')),
    name: v.string(),
    merchantPattern: v.optional(v.string()),
    expectedAmountCents: v.number(),
    cadence: v.union(
      v.literal('weekly'),
      v.literal('biweekly'),
      v.literal('monthly'),
      v.literal('quarterly'),
      v.literal('yearly'),
    ),
    nextDueDate: v.string(),
    reminderDaysBefore: v.number(),
    autoDetected: v.boolean(),
    confidenceScore: v.optional(v.number()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user_id', ['userId']),

  billInstances: defineTable({
    userId: v.id('users'),
    recurringSeriesId: v.id('recurringSeries'),
    dueDate: v.string(),
    expectedAmountCents: v.number(),
    status: v.union(
      v.literal('upcoming'),
      v.literal('due_soon'),
      v.literal('paid'),
      v.literal('overdue'),
      v.literal('skipped'),
    ),
    paidTransactionId: v.optional(v.id('transactions')),
    paidDate: v.optional(v.string()),
    reminderSentAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user_id', ['userId'])
    .index('by_recurring_series_id', ['recurringSeriesId'])
    .index('by_due_date', ['dueDate']),

  webhookEvents: defineTable({
    source: v.literal('plaid'),
    eventType: v.string(),
    idempotencyKey: v.string(),
    payloadJson: v.string(),
    processedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_idempotency_key', ['idempotencyKey']),

  syncRuns: defineTable({
    userId: v.id('users'),
    itemId: v.id('items'),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    status: v.union(v.literal('running'), v.literal('success'), v.literal('failed')),
    cursorBefore: v.optional(v.string()),
    cursorAfter: v.optional(v.string()),
    addedCount: v.number(),
    modifiedCount: v.number(),
    removedCount: v.number(),
    errorMessage: v.optional(v.string()),
  })
    .index('by_item_id', ['itemId'])
    .index('by_user_id', ['userId']),
})
