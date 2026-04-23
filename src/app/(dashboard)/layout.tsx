import { Navbar } from "@/components/layout/navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="md:ml-60 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
