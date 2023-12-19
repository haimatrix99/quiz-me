import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import Dashboard from "@/components/dashboard/Dashboard";
import { getUserSubscriptionPlan } from "@/lib/stripe";

const Page = async () => {
  const user = await currentUser();
  const { isSubscribed } = await getUserSubscriptionPlan();
  if (!user || !user.id) redirect("/auth-callback?origin=dashboard");

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=dashboard");
  return <Dashboard isSubscribed={isSubscribed} />;
};

export default Page;
