import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b bg-white dark:bg-black">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Feature Lifecycle Dashboard
        </Link>
        <nav className="flex gap-4">
          <Link
            href="/"
            className="text-sm font-medium hover:text-zinc-600 dark:hover:text-zinc-400"
          >
            Case Studies
          </Link>
          <Link
            href="/import/new"
            className="text-sm font-medium hover:text-zinc-600 dark:hover:text-zinc-400"
          >
            New Import
          </Link>
          <Link
            href="/rules"
            className="text-sm font-medium hover:text-zinc-600 dark:hover:text-zinc-400"
          >
            Rules
          </Link>
        </nav>
      </div>
    </header>
  );
}
