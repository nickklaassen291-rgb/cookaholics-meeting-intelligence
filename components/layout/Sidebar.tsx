import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CheckSquare,
  FileText,
  Home,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <Home className="h-4 w-4" />,
  },
  {
    href: "/meetings",
    label: "Meetings",
    icon: <CalendarDays className="h-4 w-4" />,
  },
  {
    href: "/action-items",
    label: "Action Items",
    icon: <CheckSquare className="h-4 w-4" />,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: <FileText className="h-4 w-4" />,
  },
];

const departmentNavItems: NavItem[] = [
  {
    href: "/departments/keuken",
    label: "Keuken",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/departments/sales",
    label: "Sales",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/departments/marketing",
    label: "Marketing",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/departments/mt",
    label: "MT",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
];

const adminNavItems: NavItem[] = [
  {
    href: "/admin/users",
    label: "Users",
    icon: <Users className="h-4 w-4" />,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {item.icon}
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <Badge variant="secondary" className="ml-auto">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();
  const pathname = router.pathname;

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r bg-card",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            C
          </div>
          <span className="font-semibold">Cookaholics</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </div>

        <Separator className="my-4" />

        {/* Departments */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-medium uppercase text-muted-foreground">
            Departments
          </p>
          {departmentNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </div>

        <Separator className="my-4" />

        {/* Admin (conditionally shown based on role) */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-medium uppercase text-muted-foreground">
            Admin
          </p>
          {adminNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          Meeting Intelligence v1.0
        </p>
      </div>
    </aside>
  );
}
