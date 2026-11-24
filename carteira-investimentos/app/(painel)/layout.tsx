import SidebarCarteira from "@/components/SidebarCarteira";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900">
      <SidebarCarteira />
      <div className="flex-1 min-w-0 px-8 py-8">{children}</div>
    </div>
  );
}