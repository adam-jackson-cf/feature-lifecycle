'use client';

import { LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const navItems = [
  { href: '/', label: 'Case Studies' },
  { href: '/import/new', label: 'New Import' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 glass shadow-glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 group transition-colors">
          <div className="p-1.5 rounded-lg bg-gradient-primary text-primary-foreground transition-transform group-hover:scale-105">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold font-display tracking-tight text-foreground">
            Feature Lifecycle
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative px-3 py-2 text-sm font-medium rounded-lg
                  transition-all duration-200
                  ${
                    isActive
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}

          <div className="ml-2 pl-2 border-l border-border/50">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
