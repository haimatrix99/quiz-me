export const PLANS = [
  {
    name: "Free",
    slug: "free",
    quota: 5,
    maxFileSize: "32MB",
    price: {
      amount: 0,
      priceIds: {
        test: "",
        production: "",
      },
    },
  },
  {
    name: "Pro",
    slug: "pro",
    quota: 20,
    maxFileSize: "256MB",
    price: {
      amount: 20,
      priceIds: {
        test: process.env.STRIPE_PRICE_ID,
        production: "",
      },
    },
  },
];
