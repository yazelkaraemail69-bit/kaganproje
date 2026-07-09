import { AccountDashboard } from "@/components/account/AccountDashboard";

export default function HesapPage() {
  return (
    <main className="flex-1 py-10 sm:py-14">
      <div className="container-app">
        <AccountDashboard />
      </div>
    </main>
  );
}
