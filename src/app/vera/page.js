// src/app/vera/page.js
"use client";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import VeraChat from "@/components/vera/VeraChat";

export default function VeraPage() {
  const router = useRouter();
  return (
    <DashboardLayout>
      <VeraChat onLogout={() => router.replace("/login")} />
    </DashboardLayout>
  );
}
