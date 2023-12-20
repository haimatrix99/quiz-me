import { currentUser } from "@clerk/nextjs";

import { db } from "@/lib/db";
import Dashboard from "@/components/dashboard/Dashboard";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { redirect } from "next/navigation";

const Page = async () => {
  const user = await currentUser();

  if (!user || !user.id) redirect("/auth-callback?origin=dashboard");

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=dashboard");
  
  const { isSubscribed } = await getUserSubscriptionPlan();
  
  return <Dashboard isSubscribed={isSubscribed} />;
};

export default Page;
