import Subscription from "@/components/subscription/Subscription";
import { getUserSubscriptionPlan } from "@/lib/stripe";

const Page = async () => {
  const subscriptionPlan = await getUserSubscriptionPlan()

  return <Subscription subscriptionPlan={subscriptionPlan} />;
};

export default Page;
