"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { Menu, House, Calculator, Power, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SidebarItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

type NavbarProps = {
  variant?: "default" | "withSidebar";
};

const formatUserName = (fullName: string): string => {
  if (!fullName) return "";
  const nameParts = fullName.trim().split(/\s+/);
  return nameParts.length >= 2
    ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase()
    : fullName.slice(0, 2).toUpperCase();
};

const NAV_LINKS = [
  { path: "/", name: "HOME" },
  { path: "/simulate", name: "SIMULATE" },
  { path: "/pricing", name: "PRICING" },
];

const SIDEBAR_ITEMS: SidebarItem[] = [
  { href: "/", icon: <House className="w-5 h-5" />, label: "Home" },
  {
    href: "/calculator",
    icon: <Calculator className="w-5 h-5" />,
    label: "Calculator",
  },
  {
    href: "/settings",
    icon: <Settings className="w-5 h-5" />,
    label: "Settings",
  },
];

export function Navbar({ variant = "default" }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [userName, setUserName] = useState("");

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();

        setUserName(formatUserName(profile?.full_name || ""));
      }

      setLoadingSession(false);
    };

    fetchSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (event === "SIGNED_IN" && session?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();
        setUserName(formatUserName(profile?.full_name || ""));
      } else if (event === "SIGNED_OUT") {
        setUserName("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loadingSession) return null;

  const renderLoggedInView = () => {
    if (isMobile) {
      return (
        <>
          <Avatar className="fixed top-5 left-5 w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center z-50">
            {userName}
          </Avatar>
          <div className="flex justify-self-center fixed w-fit px-6 bottom-5 left-0 right-0 rounded-4xl bg-accent/25 border-t transpar md:hidden z-50">
            <div className="flex gap-10 justify-center py-2">
              {SIDEBAR_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center  p-2 text-sm"
                >
                  {item.icon}
                  <span className="text-xs mt-1 tracking-[0.1em]">
                    {item.label}
                  </span>
                </Link>
              ))}
              <button
                onClick={logout}
                className="flex flex-col items-center p-2 text-destructive text-sm"
              >
                <Power className="w-5 h-5" />
                <span className="text-xs mt-1 tracking-[0.1em]">Logout</span>
              </button>
            </div>
          </div>
        </>
      );
    }

    if (variant === "withSidebar") {
      return (
        <Sidebar
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          variant="floating"
          className={cn(
            "fixed top-[26%] all-unset left-0 flex flex-col h-[25em] text-sidebar-foreground border-sidebar-border",
            "transition-all duration-200 ",
            isHovered ? "w-56" : "w-24"
          )}
        >
          <SidebarHeader className="flex items-center justify-center p-4">
            <Avatar className="w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center">
              {userName}
            </Avatar>
          </SidebarHeader>
          <SidebarContent className="flex-grow p-4 justify-center items-center overflow-hidden">
            <div className="flex flex-col space-y-2 gap-10 items-center">
              {SIDEBAR_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  {item.icon}
                  <span
                    className={cn(
                      "text-sm font-medium transition-[width] duration-200 ml-2",
                      !isHovered && "hidden"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <Button
              onClick={logout}
              className="flex items-center bg-transparent rounded-md text-destructive hover:bg-sidebar-accent "
            >
              <Power className="w-5 h-5" />
              <span
                className={cn(
                  "text-sm font-medium transition-[width] duration-200 ml-2",
                  !isHovered && "hidden"
                )}
              >
                Logout
              </span>
            </Button>
          </SidebarFooter>
        </Sidebar>
      );
    }
  };

  const renderLoggedOutView = () => (
    <nav className="font-orbitron border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-50 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-20">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <Link
                      href="/"
                      className="text-xl font-bold text-primary tracking-wider"
                    >
                      GRADECALC
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-6 px-4 py-8 mt-5">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={cn(
                        "text-2xl transition-colors duration-300",
                        isActive(link.path)
                          ? "text-primary font-bold"
                          : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <div className="pt-8 border-t border-border">
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30"
                    >
                      <Link href="/register">SIGN UP</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="ml-4 md:ml-0">
              <span className="text-xl md:text-2xl font-bold text-primary tracking-wider">
                GRADECALC
              </span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                href={link.path}
                active={isActive(link.path)}
              >
                {link.name}
              </NavLink>
            ))}
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <NavLink
              href="/login"
              active={isActive("/login")}
              className="px-4 py-2"
            >
              LOGIN
            </NavLink>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30">
              <Link href="/register">SIGN UP</Link>
            </Button>
          </div>
          <div className="flex md:hidden items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link
                href="/login"
                className={cn(
                  "text-lg",
                  isActive("/login") ? "text-primary" : "text-muted-foreground"
                )}
              >
                LOGIN
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );

  return session ? renderLoggedInView() : renderLoggedOutView();
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

function NavLink({
  href,
  children,
  active = false,
  className = "",
}: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "uppercase text-lg tracking-wider transition-colors duration-300",
        active
          ? "text-primary font-bold"
          : "text-muted-foreground hover:text-primary",
        className
      )}
    >
      {children}
    </Link>
  );
}
