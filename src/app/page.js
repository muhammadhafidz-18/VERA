"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadSession } from "@/lib/session";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = loadSession();
    if (session?.stage === "dashboard") {
      router.replace("/vera");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
