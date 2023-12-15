import Link from "next/link";
import { Gem } from "lucide-react";

const Upgrade = () => {
  return (
    <Link
      href="/pricing"
      className="flex items-center gap-2 border-2 border-zinc-900 py-1 px-4 rounded-lg"
    >
      Upgrade <Gem />
    </Link>
  );
};

export default Upgrade;
