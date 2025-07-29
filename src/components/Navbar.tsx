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

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/dashboard") return true;
    return pathname === path;
  };

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
          <Avatar
            className="fixed top-5 left-5 w-12 h-12 rounded-full z-50 
            bg-black/5 dark:bg-white/10 backdrop-blur-xl border border-black/10 dark:border-white/20 
            flex items-center justify-center text-foreground dark:text-white font-medium
            shadow-lg shadow-black/10
            before:absolute before:inset-0 before:rounded-full 
            before:bg-gradient-to-br before:from-black/10 before:to-transparent dark:before:from-white/20 dark:before:to-transparent before:opacity-50
            overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-pink-400/20 rounded-full" />
            <span className="relative z-10">{userName}</span>
          </Avatar>

          <div className="fixed inset-x-0 bottom-5 z-50 mx-auto w-max">
            <div className="relative">
              {/* Main liquid glass background */}
              <div
                className="absolute inset-0 
              bg-black/5 dark:bg-white/5 
              backdrop-blur-2xl rounded-[28px] 
              border border-black/10 dark:border-white/10 
              shadow-2xl shadow-black/10 dark:shadow-black/20
              before:absolute before:inset-0 before:rounded-[28px] 
              before:bg-gradient-to-br before:from-black/8 before:via-black/3 before:to-transparent dark:before:from-white/30 dark:before:via-white/10 dark:before:to-transparent before:opacity-60
              after:absolute after:inset-[1px] after:rounded-[27px] 
              after:bg-gradient-to-br after:from-transparent after:via-black/2 after:to-black/3 dark:after:via-white/5 dark:after:to-white/10"
              />

              {/* Animated liquid effect */}
              <div className="absolute inset-0 rounded-[28px] overflow-hidden">
                <div className="absolute -inset-10 opacity-30 dark:opacity-30">
                  <div
                    className="absolute top-0 -left-4 w-24 h-24 bg-gradient-to-r from-blue-400/40 to-purple-400/40 dark:from-blue-400/40 dark:to-purple-400/40 rounded-full blur-xl animate-pulse"
                    style={{ animationDelay: "0s", animationDuration: "4s" }}
                  />
                  <div
                    className="absolute bottom-0 -right-4 w-20 h-20 bg-gradient-to-r from-purple-400/40 to-pink-400/40 dark:from-purple-400/40 dark:to-pink-400/40 rounded-full blur-xl animate-pulse"
                    style={{ animationDelay: "2s", animationDuration: "3s" }}
                  />
                </div>
              </div>

              <div className="relative px-4 py-3">
                <div className="flex gap-2 xs:gap-3 sm:gap-4 justify-center">
                  {SIDEBAR_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center p-3 text-sm transition-all duration-300 rounded-2xl relative group",
                        "hover:scale-110 hover:shadow-lg hover:shadow-white/20",
                        isActive(item.href)
                          ? "bg-white/20 text-primary font-medium shadow-inner backdrop-blur-sm border border-white/30"
                          : "hover:bg-white/15 text-primary/90 hover:text-primary"
                      )}
                    >
                      {isActive(item.href) && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl opacity-50" />
                      )}
                      <div className="relative z-10">{item.icon}</div>
                      <span className="text-xs mt-1 tracking-wide relative z-10">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                  <button
                    onClick={logout}
                    className="flex flex-col items-center p-3 text-red-300 text-sm transition-all duration-300 
                      hover:bg-red-500/20 hover:text-red-200 rounded-2xl hover:scale-110 hover:shadow-lg hover:shadow-red-500/20"
                  >
                    <Power className="w-5 h-5" />
                    <span className="text-xs mt-1 tracking-wide">Logout</span>
                  </button>
                </div>
              </div>
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
            "transition-all duration-200",
            isHovered ? "w-56" : "w-24"
          )}
        >
          <div className="relative h-full">
            {/* Main liquid glass background - adaptive for light/dark themes */}
            <div
              className="absolute inset-0 
              bg-black/5 dark:bg-white/5 
              backdrop-blur-2xl rounded-t-4xl rounded-b-4xl 
              border border-black/10 dark:border-white/10 
              shadow-2xl shadow-black/10 dark:shadow-black/20
              before:absolute before:inset-0 before:rounded-4xl 
              before:bg-gradient-to-br before:from-black/8 before:via-black/3 before:to-transparent dark:before:from-white/15 dark:before:via-white/5 dark:before:to-transparent before:opacity-40
              after:absolute after:inset-[1px] after:rounded-4xl 
              after:bg-gradient-to-br after:from-transparent after:via-black/2 after:to-black/3 dark:after:via-white/3 dark:after:to-white/5"
            />

            {/* Animated liquid effects */}
            <div className="absolute inset-0 rounded-4xl overflow-hidden">
              <div className="absolute -inset-10 opacity-15 dark:opacity-10">
                <div
                  className="absolute top-10 -left-4 w-32 h-32 bg-gradient-to-r from-blue-400/30 to-purple-400/30 dark:from-blue-400/20 dark:to-purple-400/20 rounded-full blur-2xl animate-pulse"
                  style={{ animationDelay: "0s", animationDuration: "6s" }}
                />
                <div
                  className="absolute bottom-10 -left-6 w-28 h-28 bg-gradient-to-r from-purple-400/30 to-pink-400/30 dark:from-purple-400/20 dark:to-pink-400/20 rounded-full blur-2xl animate-pulse"
                  style={{ animationDelay: "3s", animationDuration: "5s" }}
                />
                <div
                  className="absolute top-1/2 -left-2 w-20 h-20 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 dark:from-cyan-400/20 dark:to-blue-400/20 rounded-full blur-xl animate-pulse"
                  style={{ animationDelay: "4s", animationDuration: "4s" }}
                />
              </div>
            </div>

            <SidebarHeader className="relative z-10 flex items-center justify-center p-4 rounded-t-4xl">
              <Avatar
                className="w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center 
                backdrop-blur-xl border border-black/10 dark:border-white/10 
                shadow-lg shadow-black/10
                before:absolute before:inset-0 before:rounded-full 
                before:bg-gradient-to-br before:from-black/5 before:to-transparent dark:before:from-white/10 dark:before:to-transparent before:opacity-30
                relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/15 via-purple-400/15 to-pink-400/15 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-pink-400/10 rounded-full" />
                <span className="relative z-10 text-foreground">
                  {userName}
                </span>
              </Avatar>
            </SidebarHeader>

            <SidebarContent className="relative z-10 flex-grow p-4 justify-center items-center overflow-hidden">
              <div className="flex flex-col space-y-2 gap-3 items-center">
                {SIDEBAR_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center p-4 rounded-md transition-all duration-300 relative",
                      "hover:scale-105 hover:shadow-lg hover:shadow-primary/10",
                      isActive(item.href)
                        ? "bg-sidebar-accent/30 dark:bg-sidebar-accent/20 rounded-4xl text-primary font-medium shadow-inner backdrop-blur-sm border border-black/10 dark:border-white/10"
                        : "hover:bg-sidebar-accent/30 dark:hover:bg-sidebar-accent/20 hover:rounded-4xl hover:text-sidebar-accent-foreground text-muted-foreground dark:text-white/90"
                    )}
                  >
                    {isActive(item.href) && (
                      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/2 dark:from-white/10 dark:to-white/3 rounded-4xl opacity-30" />
                    )}
                    <div className="relative z-10">{item.icon}</div>
                    <span
                      className={cn(
                        "text-sm font-medium transition-[width] duration-200 ml-2 relative z-10",
                        !isHovered && "hidden"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </SidebarContent>

            <SidebarFooter className="relative z-10 p-4 border-t border-sidebar-border rounded-b-4xl">
              <Button
                onClick={logout}
                className="flex items-center bg-transparent rounded-md text-destructive 
                  hover:bg-sidebar-accent/30 dark:hover:bg-sidebar-accent/20 hover:rounded-4xl transition-all duration-300 
                  hover:scale-105 hover:shadow-lg hover:shadow-red-500/10"
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
          </div>
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
