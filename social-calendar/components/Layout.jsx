import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-pink-100 p-6 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-pink-600 mb-4">Menu</h2>
        <nav className="flex flex-col gap-2">
          <Link href="/">
            <span className="hover:underline cursor-pointer">Calendar</span>
          </Link>
          <Link href="/competitors">
            <span className="hover:underline cursor-pointer">Competitor Gallery</span>
          </Link>
        </nav>
      </aside>
      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}