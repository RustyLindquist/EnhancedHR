export const PRICING_PLANS = {
    INDIVIDUAL_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_INDIVIDUAL || 'price_1234567890', // Replace with real ID
    ORG_SEAT_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ORG_SEAT || 'price_0987654321', // Replace with real ID
};
