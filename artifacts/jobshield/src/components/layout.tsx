import { Link, useLocation } from "wouter";
import { Shield, Home, LayoutDashboard, History, BookOpen, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Scanner", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/history", label: "History", icon: History },
    { href: "/indicators", label: "Indicators", icon: BookOpen },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium", isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground hover:text-foreground")}>
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2 text-primary">
          <Shield className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight uppercase">JobShield</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-6 border-b border-border flex items-center gap-3 text-primary">
              <Shield className="w-6 h-6" />
              <span className="font-bold text-lg tracking-tight uppercase">JobShield</span>
            </div>
            <nav className="p-4 space-y-2">
              <NavLinks />
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex-shrink-0 flex-col hidden md:flex">
        <div className="p-6 border-b border-border flex items-center gap-3 text-primary">
          <Shield className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight uppercase">JobShield</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavLinks />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
