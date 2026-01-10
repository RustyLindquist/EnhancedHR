# Billing & Stripe — Foundation Doc

## Overview

This document covers the cross-cutting concerns of billing and payments in EnhancedHR.ai, including Stripe integration, subscription management, and entitlements.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BILLING SYSTEM                            │
│                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │  Stripe     │   │  Webhook    │   │  Entitle-   │       │
│  │  Checkout   │   │  Handler    │   │  ments      │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
│                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │  Seat       │   │  Credits    │   │  Invoice    │       │
│  │  Management │   │  System     │   │  Tracking   │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
        ┌──────────┐
        │  Stripe  │
        │   API    │
        └──────────┘
```

## Security Invariants

1. **Server-Side Validation**: NEVER trust client-side payment state
2. **Webhook Verification**: Always verify Stripe webhook signatures
3. **Entitlement Checks**: Check subscription status before granting access
4. **Idempotency**: Use idempotency keys for Stripe operations
5. **PCI Compliance**: Never store card details — let Stripe handle it

## Subscription Model

### Tiers

| Tier | Billing | Features |
|------|---------|----------|
| Individual | Per user/month | Basic access |
| Team | Per seat/month | Team features |
| Enterprise | Custom | Full platform |

### Seat Management

- Seats are pre-purchased (not auto-added)
- Org admin manages seat allocation
- Unused seats still billed
- Downgrade requires removing users first

## Stripe Integration

### Checkout Flow

1. User clicks upgrade/subscribe
2. Server creates Checkout Session
3. Redirect to Stripe Checkout
4. Stripe handles payment
5. Webhook notifies of success
6. Database updated, access granted

### Webhook Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create subscription record |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Revoke access |
| `invoice.payment_failed` | Mark as past due |
| `invoice.paid` | Restore access if suspended |

### Webhook Security

```typescript
// Always verify webhook signature
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

## Entitlements

### Checking Access

```typescript
// Server-side entitlement check
async function hasAccess(userId: string, feature: string) {
  const subscription = await getActiveSubscription(userId);
  if (!subscription) return false;
  if (subscription.status !== 'active') return false;
  return subscription.features.includes(feature);
}
```

### Grace Periods

- Payment failed: 7-day grace period
- Subscription canceled: Access until period end
- Downgrade: Immediate or end of period (configurable)

## Tables Involved

| Table | Purpose |
|-------|---------|
| `subscriptions` | Subscription records |
| `subscription_items` | Line items (seats, add-ons) |
| `invoices` | Invoice tracking |
| `payments` | Payment records |
| `credits` | Credit/token balances |

## RLS Considerations

- Users see only their subscription data
- Org admins see org subscription
- Admin client needed for webhook processing
- Billing portal accessible only to billing admins

## Credit System

### Credit Types

| Type | Usage | Refresh |
|------|-------|---------|
| AI Tokens | AI chat usage | Monthly |
| Certificate | Generate certs | Per purchase |
| Storage | File storage | Monthly |

### Credit Tracking

- Deduct on usage (atomic)
- Check balance before operation
- Handle insufficient credits gracefully
- Allow overage in some cases (configured)

## Error Handling

| Error | Response |
|-------|----------|
| Card declined | Show user-friendly message |
| Webhook failed | Retry, then alert |
| Subscription expired | Grace period, then revoke |
| Double-charge attempt | Idempotency key prevents |

## Testing

### Test Mode

- Use Stripe test keys in development
- Test card numbers: 4242 4242 4242 4242
- Test webhook with Stripe CLI

### Testing Checklist

- [ ] Checkout flow completes
- [ ] Webhook processes correctly
- [ ] Entitlements update on subscription change
- [ ] Grace period works as expected
- [ ] Cancellation revokes access properly
- [ ] Seat limits enforced

## Integration Points

| Feature | Integration |
|---------|-------------|
| Auth | User must be authenticated |
| Organization | Org billing for teams |
| AI Features | Credit-gated |
| Course Access | Subscription-gated |

## Related Docs

- `docs/features/membership-billing.md` — Feature-level documentation
- `docs/features/organizations.md` — Org billing
- `docs/foundation/auth-roles-rls.md` — Permission model
