# BE-07: Mercado Pago Webhook Integration

**Status**: `pending`  
**Estimate**: 2 hours  
**Priority**: Medium  
**Dependencies**: BE-02

## Description

Implement Mercado Pago webhook handler to process subscription events (payment success, failure, cancellation) and update user subscription status.

## Tasks

- [ ] Create webhook Edge Function
- [ ] Implement signature verification
- [ ] Handle payment success events
- [ ] Handle payment failure events
- [ ] Handle cancellation events
- [ ] Update user_profiles table
- [ ] Send notification emails
- [ ] Test with Mercado Pago sandbox

## Tech Spec

### Webhook Handler

```typescript
// supabase/functions/billing-webhook/index.ts
import { createHmac } from "node:crypto";

Deno.serve(async (req) => {
  const signature = req.headers.get("x-signature");
  const body = await req.text();

  // Verify webhook signature
  const expectedSig = createHmac("sha256", MERCADOPAGO_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (signature !== expectedSig) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);

  // Handle different event types
  switch (event.type) {
    case "payment":
      if (event.data.status === "approved") {
        await handlePaymentSuccess(event.data);
      } else if (event.data.status === "rejected") {
        await handlePaymentFailure(event.data);
      }
      break;

    case "subscription":
      if (event.action === "updated") {
        await handleSubscriptionUpdate(event.data);
      }
      break;
  }

  return new Response("OK", { status: 200 });
});

async function handlePaymentSuccess(payment: any) {
  await supabase
    .from("user_profiles")
    .update({
      plan_type: "pro",
      subscription_status: "active",
      current_period_end: new Date(payment.date_approved).toISOString(),
    })
    .eq("customer_id", payment.payer.id);
}
```

### Event Types to Handle

- `payment.approved` - Payment successful
- `payment.rejected` - Payment failed
- `subscription.updated` - Subscription status changed
- `subscription.cancelled` - Subscription cancelled

## Acceptance Criteria

- [ ] Webhook receives events correctly
- [ ] Signature verification working
- [ ] Payment success updates user plan
- [ ] Payment failure handled properly
- [ ] Subscription cancellation works
- [ ] Idempotent (duplicate events handled)
- [ ] Tested with sandbox

## Notes

- Webhook URL: `https://xxx.supabase.co/functions/v1/billing-webhook`
- Configure in Mercado Pago dashboard
- Store webhook secret securely
- Handle rate limiting

