import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b bg-card/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-semibold text-foreground">
          Feature Lifecycle Dashboard
        </Link>
        <nav className="flex gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Case Studies
          </Link>
          <Link
            href="/aggregate"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Overview
          </Link>
          <Link
            href="/data-explorer"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Data Explorer
          </Link>
          <Link
            href="/import/new"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            New Import
          </Link>
        </nav>
      </div>
    </header>
  );
}
