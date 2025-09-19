import { cn } from '@/lib/utils';

interface SidebarItem {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  onItemClick?: (href: string) => void;
}

export function Sidebar({ items, onItemClick }: SidebarProps) {
  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen">
      <div className="p-6">
        <nav className="space-y-2">
          {items.map((item, index) => (
            <a
              key={index}
              href={item.href}
              onClick={(e) => {
                if (onItemClick) {
                  e.preventDefault();
                  onItemClick(item.href);
                }
              }}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                item.active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <i className={`${item.icon} mr-3 w-4`}></i>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
