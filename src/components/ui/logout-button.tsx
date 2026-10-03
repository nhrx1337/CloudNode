"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon } from "@/components/ui/icons";
import { buttonClasses } from "@/components/ui/button-styles";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-zinc-800/60 hover:text-red-400"
    >
      <LogOutIcon width={17} height={17} />
    </button>
  );
}
