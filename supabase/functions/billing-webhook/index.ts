// Centrid AI Filesystem - Billing Webhook Edge Function (Mercado Pago)
// Version: 3.1 - Supabase Plus MVP Architecture

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature",
};

interface MercadoPagoWebhook {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: number;
  user_id: string;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

interface SubscriptionData {
  id: string;
  status: string;
  external_reference: string; // This should contain our user_id
  auto_recurring: {
    frequency: number;
    frequency_type: string;
    start_date: string;
    end_date?: string;
  };
  back_url?: string;
  collector_id: number;
  date_created: string;
  last_modified: string;
  payer_id: number;
  reason: string;
  subscription_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify webhook signature
    const signature = req.headers.get("x-signature");
    const body = await req.text();

    if (!verifyWebhookSignature(body, signature)) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const webhookData: MercadoPagoWebhook = JSON.parse(body);

    // Log webhook receipt
    console.log("Received Mercado Pago webhook:", {
      id: webhookData.id,
      type: webhookData.type,
      action: webhookData.action,
      dataId: webhookData.data.id,
    });

    // Handle different webhook types
    switch (webhookData.type) {
      case "subscription":
        await handleSubscriptionWebhook(supabase, webhookData);
        break;

      case "payment":
        await handlePaymentWebhook(supabase, webhookData);
        break;

      default:
        console.log(`Unhandled webhook type: ${webhookData.type}`);
    }

    return new Response(JSON.stringify({ success: true, processed: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Billing webhook error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper functions

function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  const webhookSecret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.warn("MERCADO_PAGO_WEBHOOK_SECRET not configured");
    return true; // Allow in development
  }

  try {
    // Mercado Pago signature format: ts=timestamp,v1=signature
    const parts = signature.split(",");
    const timestamp = parts
      .find((part) => part.startsWith("ts="))
      ?.split("=")[1];
    const receivedSignature = parts
      .find((part) => part.startsWith("v1="))
      ?.split("=")[1];

    if (!timestamp || !receivedSignature) {
      return false;
    }

    // Create expected signature
    const payload = `${timestamp}.${body}`;
    const expectedSignature = Array.from(
      new Uint8Array(
        crypto.subtle
          .importKey(
            "raw",
            new TextEncoder().encode(webhookSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
          )
          .then((key) =>
            crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
          )
      )
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expectedSignature === receivedSignature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

async function handleSubscriptionWebhook(
  supabase: any,
  webhookData: MercadoPagoWebhook
): Promise<void> {
  try {
    // Fetch subscription details from Mercado Pago
    const subscriptionData = await fetchSubscriptionData(webhookData.data.id);

    if (!subscriptionData || !subscriptionData.external_reference) {
      console.error("No external_reference found in subscription data");
      return;
    }

    const userId = subscriptionData.external_reference;

    // Map Mercado Pago status to our subscription status
    const subscriptionStatus = mapSubscriptionStatus(subscriptionData.status);
    const plan = inferPlanFromSubscription(subscriptionData);

    // Update user profile with subscription information
    const { error } = await supabase
      .from("user_profiles")
      .update({
        subscription_status: subscriptionStatus,
        subscription_id: subscriptionData.id,
        plan: plan,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Failed to update user profile:", error);
      return;
    }

    // Log the subscription event
    await supabase.from("usage_events").insert({
      user_id: userId,
      event_type: "subscription_change",
      metadata: {
        subscription_id: subscriptionData.id,
        status: subscriptionStatus,
        plan: plan,
        webhook_action: webhookData.action,
        mp_status: subscriptionData.status,
      },
    });

    console.log(
      `Updated subscription for user ${userId}: ${subscriptionStatus} (${plan})`
    );
  } catch (error) {
    console.error("Error handling subscription webhook:", error);
  }
}

async function handlePaymentWebhook(
  supabase: any,
  webhookData: MercadoPagoWebhook
): Promise<void> {
  try {
    // Fetch payment details from Mercado Pago
    const paymentData = await fetchPaymentData(webhookData.data.id);

    if (!paymentData) {
      console.error("No payment data found");
      return;
    }

    // Extract user ID from external_reference or subscription
    let userId = paymentData.external_reference;
    if (!userId && paymentData.subscription_id) {
      // Try to get userId from subscription
      const subscriptionData = await fetchSubscriptionData(
        paymentData.subscription_id
      );
      userId = subscriptionData?.external_reference;
    }

    if (!userId) {
      console.error("No user ID found for payment");
      return;
    }

    // Log payment event
    await supabase.from("usage_events").insert({
      user_id: userId,
      event_type: "payment_received",
      cost_usd: paymentData.transaction_amount || 0,
      metadata: {
        payment_id: paymentData.id,
        status: paymentData.status,
        payment_method: paymentData.payment_method_id,
        subscription_id: paymentData.subscription_id,
        webhook_action: webhookData.action,
      },
    });

    // If payment is approved, ensure subscription is active
    if (paymentData.status === "approved" && paymentData.subscription_id) {
      await supabase
        .from("user_profiles")
        .update({
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .eq("subscription_id", paymentData.subscription_id);
    }

    console.log(
      `Processed payment ${paymentData.id} for user ${userId}: ${paymentData.status}`
    );
  } catch (error) {
    console.error("Error handling payment webhook:", error);
  }
}

async function fetchSubscriptionData(
  subscriptionId: string
): Promise<SubscriptionData | null> {
  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const response = await fetch(
      `https://api.mercadopago.com/preapproval/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch subscription data:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching subscription data:", error);
    return null;
  }
}

async function fetchPaymentData(paymentId: string): Promise<any> {
  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch payment data:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching payment data:", error);
    return null;
  }
}

function mapSubscriptionStatus(mpStatus: string): string {
  const statusMap: { [key: string]: string } = {
    authorized: "active",
    paused: "inactive",
    cancelled: "canceled",
    finished: "canceled",
    pending: "past_due",
  };

  return statusMap[mpStatus] || "inactive";
}

function inferPlanFromSubscription(subscriptionData: SubscriptionData): string {
  // This would typically be based on the subscription amount or product ID
  // For now, we'll use a simple heuristic or external_reference format
  if (subscriptionData.reason?.toLowerCase().includes("pro")) {
    return "pro";
  } else if (subscriptionData.reason?.toLowerCase().includes("enterprise")) {
    return "enterprise";
  }

  return "free"; // Default fallback
}

/* To deploy this function, run:
 * supabase functions deploy billing-webhook --no-verify-jwt
 *
 * Environment variables needed:
 * - MERCADO_PAGO_ACCESS_TOKEN
 * - MERCADO_PAGO_WEBHOOK_SECRET
 */
