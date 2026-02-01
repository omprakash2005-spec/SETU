import Stripe from "stripe";
import "dotenv/config";

import {
  createDonation,
  updateDonationStatus,
  getDonationBySessionId,
  getRecentDonations,
  getTotalDonations,
  getAlumniDonationTotal,
  getDonationsByAlumni,
} from "../models/donationModel.js";

// Safety check
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("❌ STRIPE_SECRET_KEY is missing in .env");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Create checkout session
export const createCheckoutSession = async (req, res) => {
  try {
    const { amount, alumniId, alumniName, alumniEmail } = req.body;

    // Validate input
    if (!amount || amount < 50) {
      return res.status(400).json({
        success: false,
        message: "Invalid donation amount. Minimum ₹50 required (Stripe minimum is $0.50 USD)",
      });
    }

    if (!alumniId || !alumniEmail) {
      return res.status(400).json({
        success: false,
        message: "Alumni information required",
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "SETU Alumni Donation",
              description: "Support SETU Alumni Network",
            },
            unit_amount: Math.round(amount * 100), // INR -> paise
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/donations?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/donations?cancelled=true`,

      // Stripe metadata (optional)
      metadata: {
        alumni_id: String(alumniId),
        alumni_name: alumniName || "Anonymous",
        alumni_email: alumniEmail,
      },
    });

    // Create pending donation record in DB
    const donation = await createDonation({
      alumni_id: alumniId,
      alumni_name: alumniName || "Anonymous",
      alumni_email: alumniEmail,
      amount,
      currency: "INR",
      // In test mode without webhooks, mark as success immediately
      // In production with webhooks, this will be 'pending' and updated by webhook
      status: process.env.NODE_ENV === 'production' ? 'pending' : 'success',
      stripe_session_id: session.id,
      stripe_payment_intent_id: null,
    });

    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
      error: error.message,
    });
  }
};

// ✅ Stripe webhook handler
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // Mark donation as success
        const donation = await updateDonationStatus(session.id, "success");

        if (donation) {
          console.log("✅ Donation confirmed:", donation.donation_id);
        }
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object;

        // Mark donation as failed
        await updateDonationStatus(session.id, "failed");
        console.log("❌ Donation failed/expired:", session.id);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
};

// ✅ Verify payment status
export const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const donation = await getDonationBySessionId(sessionId);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    return res.json({
      success: true,
      donation,
      paymentStatus: session.payment_status,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

// ✅ Get recent donations
export const getRecentDonationsController = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const donations = await getRecentDonations(limit);

    return res.json({
      success: true,
      donations,
    });
  } catch (error) {
    console.error("Error fetching recent donations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent donations",
      error: error.message,
    });
  }
};

// ✅ Get donation analytics
export const getDonationAnalytics = async (req, res) => {
  try {
    const { alumniId } = req.query;

    const totalStats = await getTotalDonations();
    let alumniStats = { total_amount: 0, total_count: 0 };

    if (alumniId) {
      alumniStats = await getAlumniDonationTotal(alumniId);
    }

    return res.json({
      success: true,
      analytics: {
        totalDonations: parseFloat(totalStats.total_amount || 0),
        totalCount: parseInt(totalStats.total_count || 0),

        alumniDonations: parseFloat(alumniStats.total_amount || 0),
        alumniCount: parseInt(alumniStats.total_count || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching donation analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch donation analytics",
      error: error.message,
    });
  }
};

// ✅ Get alumni donations (by alumniId)
export const getAlumniDonationsController = async (req, res) => {
  try {
    const { alumniId } = req.params;

    const donations = await getDonationsByAlumni(alumniId);

    return res.json({
      success: true,
      donations,
    });
  } catch (error) {
    console.error("Error fetching alumni donations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch alumni donations",
      error: error.message,
    });
  }
};
