"use client";

import { ArrowRight } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

const UpgradeButton = () => {
  const router = useRouter();
  const { mutate: createStripeSession } = trpc.createStripeSession.useMutation({
    onSuccess: ({ url }) => {
      url ? router.push(url) : router.push("/dashboard");
    },
  });

  return (
    <Button onClick={() => createStripeSession()} className="w-full">
      Upgrade now <ArrowRight className="h-5 w-5 ml-1.5" />
    </Button>
  );
};

export default UpgradeButton;
