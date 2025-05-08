// app/components/Navbar.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // importă useRouter pentru redirecționare
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js"; // Import the Session type
import { usePathname } from "next/navigation";
import { Menu, House, Calculator, Power, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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

function formatUserName(fullName: string): string {
  if (!fullName) return "";
  const nameParts = fullName.trim().split(/\s+/);

  if (nameParts.length >= 2) {
    return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
  }

  return fullName.slice(0, 2).toUpperCase();
}

export function Navbar({ variant = "default" }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter(); // inițializează router-ul
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true); // Adaugă starea de încărcare
  const [isHovered, setIsHovered] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const checkSessionAndFetchProfile = async () => {
      // Verifică sesiunea
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      // Dacă există sesiune, obține profilul utilizatorului
      if (session?.user?.id) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();

        if (!error && profile) {
          const fullName = profile.full_name || "";
          const formattedName = formatUserName(fullName);
          setUserName(formattedName);
        }
      }

      setLoadingSession(false);
    };

    checkSessionAndFetchProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        // La schimbarea stării de autentificare, actualizează și profilul
        if (event === "SIGNED_IN" && session?.user?.id) {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", session.user.id)
            .single();

          if (!error && profile) {
            const fullName = profile.full_name || "";
            // Formatăm numele conform cerințelor
            const formattedName = formatUserName(fullName);
            setUserName(formattedName);
          }
        } else if (event === "SIGNED_OUT") {
          setUserName("");
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Funcția de logout cu redirecționare
  const logout = async () => {
    await supabase.auth.signOut(); // Deconectează utilizatorul
    router.push("/"); // Redirecționează către pagina principală
  };
  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { path: "/", name: "HOME" },
    { path: "/simulate", name: "SIMULATE" },
    { path: "/pricing", name: "PRICING" },
  ];
  const navItems: SidebarItem[] = [
    {
      href: "/",
      icon: <House className="w-5 h-5 mr-2" />,
      label: "Home",
    },
    {
      href: "/calculator", // Înlocuiește cu ruta ta reală
      icon: <Calculator className="w-5 h-5 mr-2" />,
      label: "Calculator",
    },
    {
      href: "/settings", // Înlocuiește cu ruta ta reală
      icon: <Settings className="w-5 h-5 mr-2" />,
      label: "Settings",
    },
  ];
  if (loadingSession) {
    return null; // Sau poți returna un indicator de încărcare specific pentru navbar
  }
  return (
    <>
      {session ? (
        variant === "withSidebar" && (
          <Sidebar
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            variant="floating"
            className={cn(
              "fixed top-[26%] left-0 flex flex-col h-1/2 text-sidebar-foreground  border-sidebar-border transition-all duration-200",
              isHovered && "w-64"
            )}
          >
            <SidebarHeader className="flex items-center justify-center p-4">
              <Avatar className="w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center">
                {userName}
              </Avatar>
            </SidebarHeader>
            <SidebarContent className="flex-grow p-4 justify-center items-center ">
              <div className="flex flex-col space-y-2 gap-10 items-center">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {item.icon}
                    <span
                      className={cn(
                        "text-sm font-medium  transition-all duration-200",
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
                className="flex items-center bg-transparent rounded-md text-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Power className="w-5 h-5 mr-2 " />
                <span
                  className={cn(
                    "text-sm font-medium  transition-all duration-200",
                    !isHovered && "hidden"
                  )}
                >
                  Logout
                </span>
              </Button>
            </SidebarFooter>
          </Sidebar>
        )
      ) : (
        <nav className="font-orbitron border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-50 transition-colors duration-300">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between md:h-20">
              {/* Logo + Mobile menu button */}
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
                      <SheetDescription className="sr-only">
                        Navigation menu
                      </SheetDescription>
                    </SheetHeader>

                    <div className="flex flex-col space-y-6 px-4 py-8 mt-5">
                      {navLinks.map((link) => (
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

              {/* Desktop Navigation - Centered */}
              <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    href={link.path}
                    active={isActive(link.path)}
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center space-x-4">
                <NavLink
                  href="/login"
                  active={isActive("/login")}
                  className="px-4 py-2"
                >
                  LOGIN
                </NavLink>
                {session ? (
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30"
                    onClick={logout}
                  >
                    LOG OUT
                  </Button>
                ) : (
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30">
                    <Link href="/register">SIGN UP</Link>
                  </Button>
                )}
              </div>

              {/* Mobile Auth Buttons */}
              <div className="flex md:hidden items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link
                    href="/login"
                    className={cn(
                      "text-lg",
                      isActive("/login")
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    LOGIN
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}
    </>
  );
}

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
};

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
