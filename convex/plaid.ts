import { action } from './_generated/server'
import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { v } from 'convex/values'
import { CountryCode, Products } from 'plaid'
import { getPlaidClient } from './plaidClient'
import { decryptToken, encryptToken } from './security'

type SyncSummary = {
  addedCount: number
  modifiedCount: number
  removedCount: number
  cursor: string | undefined
}

type SyncActionContext = {
  runQuery: (ref: unknown, args: unknown) => Promise<any>
  runMutation: (ref: unknown, args: unknown) => Promise<any>
}

async function runTransactionsSyncForItem(
  ctx: SyncActionContext,
  itemId: Id<'items'>,
): Promise<SyncSummary> {
  const item: {
    _id: Id<'items'>
    userId: Id<'users'>
    encryptedAccessToken: string
    cursor?: string
  } | null = await ctx.runQuery(api.plaidPersistence.getItemForSync, { itemId })

  if (!item) {
    throw new Error('Item not found')
  }

  const plaid = getPlaidClient()
  const accessToken = decryptToken(item.encryptedAccessToken)

  const syncRunId: Id<'syncRuns'> = await ctx.runMutation(
    api.plaidPersistence.createSyncRun,
    {
      userId: item.userId,
      itemId: item._id,
      cursorBefore: item.cursor,
    },
  )

  let cursor: string | undefined = item.cursor
  let hasMore = true
  let addedCount = 0
  let modifiedCount = 0
  let removedCount = 0

  try {
    while (hasMore) {
      const response = await plaid.transactionsSync({
        access_token: accessToken,
        cursor,
        count: 100,
      })

      const page = response.data
      cursor = page.next_cursor
      hasMore = page.has_more

      const added = page.added.map((tx) => ({
        transactionId: tx.transaction_id,
        accountId: tx.account_id,
        pendingTransactionId: tx.pending_transaction_id ?? undefined,
        amountCents: Math.round(tx.amount * 100),
        isoCurrencyCode: tx.iso_currency_code ?? 'USD',
        merchantNameRaw: tx.merchant_name ?? undefined,
        nameRaw: tx.name,
        authorizedDate: tx.authorized_date ?? undefined,
        postedDate: tx.date,
        pending: tx.pending,
      }))

      const modified = page.modified.map((tx) => ({
        transactionId: tx.transaction_id,
        accountId: tx.account_id,
        pendingTransactionId: tx.pending_transaction_id ?? undefined,
        amountCents: Math.round(tx.amount * 100),
        isoCurrencyCode: tx.iso_currency_code ?? 'USD',
        merchantNameRaw: tx.merchant_name ?? undefined,
        nameRaw: tx.name,
        authorizedDate: tx.authorized_date ?? undefined,
        postedDate: tx.date,
        pending: tx.pending,
      }))

      const removed = page.removed.map((tx) => ({
        transactionId: tx.transaction_id,
      }))

      addedCount += added.length
      modifiedCount += modified.length
      removedCount += removed.length

      await ctx.runMutation(api.plaidPersistence.applyTransactionsSyncPage, {
        userId: item.userId,
        itemId: item._id,
        added,
        modified,
        removed,
      })
    }

    await ctx.runMutation(api.plaidPersistence.finalizeSyncRun, {
      syncRunId,
      itemId: item._id,
      status: 'success',
      cursorAfter: cursor,
      addedCount,
      modifiedCount,
      removedCount,
    })

    return { addedCount, modifiedCount, removedCount, cursor }
  } catch (error) {
    await ctx.runMutation(api.plaidPersistence.finalizeSyncRun, {
      syncRunId,
      itemId: item._id,
      status: 'failed',
      cursorAfter: cursor,
      addedCount,
      modifiedCount,
      removedCount,
      errorMessage: error instanceof Error ? error.message : 'Unknown sync error',
    })

    throw error
  }
}

export const createLinkToken = action({
  args: {
    userId: v.id('users'),
    userClientId: v.string(),
  },
  handler: async (_ctx, args) => {
    const plaid = getPlaidClient()
    const response = await plaid.linkTokenCreate({
      user: { client_user_id: args.userClientId },
      client_name: 'Northstar Finance',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
      redirect_uri: process.env.PLAID_REDIRECT_URI,
      webhook: process.env.PLAID_WEBHOOK_URL,
    })

    return {
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
      requestId: response.data.request_id,
    }
  },
})

export const exchangePublicTokenAndSync = action({
  args: {
    userId: v.id('users'),
    publicToken: v.string(),
  },
  handler: async (ctx, args) => {
    const plaid = getPlaidClient()

    const exchange = await plaid.itemPublicTokenExchange({
      public_token: args.publicToken,
    })

    const plaidItemId = exchange.data.item_id
    const accessToken = exchange.data.access_token

    const itemInfo = await plaid.itemGet({ access_token: accessToken })
    const institutionId = itemInfo.data.item.institution_id
    if (!institutionId) {
      throw new Error('Institution ID not returned from Plaid')
    }

    const institution = await plaid.institutionsGetById({
      institution_id: institutionId,
      country_codes: [CountryCode.Us],
      options: { include_optional_metadata: true },
    })

    const itemDocId: Id<'items'> = await ctx.runMutation(
      api.plaidPersistence.upsertItemWithInstitution,
      {
        userId: args.userId,
        plaidItemId,
        plaidInstitutionId: institutionId,
        institutionName: institution.data.institution.name,
        institutionLogoUrl: institution.data.institution.logo ?? undefined,
        encryptedAccessToken: encryptToken(accessToken),
      },
    )

    const accounts = await plaid.accountsGet({ access_token: accessToken })
    await ctx.runMutation(api.plaidPersistence.upsertAccounts, {
      userId: args.userId,
      itemId: itemDocId,
      accounts: accounts.data.accounts.map((account) => ({
        plaidAccountId: account.account_id,
        name: account.name,
        type: account.type,
        subtype: account.subtype ?? undefined,
        mask: account.mask ?? undefined,
        currentBalanceCents:
          account.balances.current == null
            ? undefined
            : Math.round(account.balances.current * 100),
        availableBalanceCents:
          account.balances.available == null
            ? undefined
            : Math.round(account.balances.available * 100),
      })),
    })

    const syncSummary = await runTransactionsSyncForItem(ctx, itemDocId)

    return { itemId: itemDocId, syncSummary }
  },
})

export const runTransactionsSync = action({
  args: { itemId: v.id('items') },
  handler: async (ctx, args): Promise<SyncSummary> => {
    return await runTransactionsSyncForItem(ctx, args.itemId)
  },
})
