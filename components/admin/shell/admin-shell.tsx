"use client";

import { Bell, ChevronRight, ExternalLink, LogOut, Menu, Plus, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { signOut } from "@/lib/cms/admin/actions/auth";
import { searchDashboard } from "@/lib/cms/admin/actions/search";
import type { NotificationItem, ShellUser } from "@/lib/cms/admin/shapes";
import { FeedbackProvider } from "../ui/feedback";
import { Spinner, TimeAgo } from "../ui/primitives";
import { activeNavHref, NAV_GROUPS, NAV_ITEMS, QUICK_LINKS, SEGMENT_LABELS } from "./nav";
import { previewHref } from "./preview";

/* ---- Preferences: which language titles and previews use ---------------------------------- */

type Lang = "ar" | "en";
const PrefsContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void; user: ShellUser }>({ lang: "en", setLang: () => undefined, user: { email: "", displayName: "", role: "editor", mode: "supabase" } });
export const useAdminPrefs = () => useContext(PrefsContext);


function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return [open, setOpen, ref] as const;
}

/* ---- Sidebar ------------------------------------------------------------------------------- */

function Sidebar({ user, onNavigate }: { user: ShellUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = activeNavHref(pathname);
  return (
    <div className="ad-sidebar flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <span className="grid size-10 place-items-center rounded-xl bg-white/10 font-display text-sm font-semibold text-aqua-400 shadow-[inset_0_1px_0_rgba(255,255,255,.15)]">MG</span>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-white">Dr. Mohamed Gamal</p>
          <p className="text-[0.72rem] text-white/50">Content dashboard</p>
        </div>
      </div>
      <nav aria-label="Dashboard" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-color:rgba(255,255,255,.15)_transparent] [scrollbar-width:thin]">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.ownerOnly || user.role === "owner");
          if (!items.length) return null;
          return (
            <div key={group.label}>
              <p className="ad-nav-group">{group.label}</p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="ad-nav-link" aria-current={active === item.href ? "page" : undefined} onClick={onNavigate}>
                      <item.icon size={17} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      {user.mode === "local" ? (
        <div className="mx-3 mb-3 rounded-xl border border-aqua-500/30 bg-aqua-500/10 px-3 py-2 text-[0.72rem] leading-snug text-aqua-200">
          <strong className="block text-aqua-400">Local development mode</strong>
          Changes are saved to a local test database, not to Supabase.
        </div>
      ) : null}
    </div>
  );
}

/* ---- Breadcrumbs ----------------------------------------------------------------------------- */

function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean).slice(1);
  const crumbs = [{ label: "Dashboard", href: "/admin" }];
  parts.forEach((part, i) => {
    const href = `/admin/${parts.slice(0, i + 1).join("/")}`;
    const label = SEGMENT_LABELS[part] ?? (/^[0-9a-f-]{36}$/.test(part) ? "Edit" : part.replace(/-/g, " "));
    crumbs.push({ label, href });
  });
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
      <ol className="flex items-center gap-1 text-sm">
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex min-w-0 items-center gap-1">
            {i > 0 ? <ChevronRight size={14} className="ad-muted shrink-0" /> : null}
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="truncate font-semibold">
                {c.label}
              </span>
            ) : (
              <Link href={c.href} className="ad-muted truncate hover:text-ink-900">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---- Search palette (Ctrl / ⌘ K) -------------------------------------------------------------- */

function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ title: string; subtitle: string; href: string }[]>([]);
  const [active, setActive] = useState(0);
  const [loading, startLoading] = useTransition();
  const { user } = useAdminPrefs();

  const destinations = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = [...NAV_ITEMS.filter((i) => !i.ownerOnly || user.role === "owner").map((i) => ({ title: i.label, subtitle: "Go to", href: i.href })), ...QUICK_LINKS.map((q) => ({ title: q.label, subtitle: "Quick action", href: q.href }))];
    return q ? all.filter((d) => d.title.toLowerCase().includes(q)) : all.slice(0, 8);
  }, [query, user.role]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = setTimeout(
      () =>
        startLoading(async () => {
          const result = await searchDashboard(q);
          setResults(result.ok ? result.data : []);
        }),
      220,
    );
    return () => clearTimeout(timer);
  }, [query]);

  const list = [...destinations, ...(query.trim().length >= 2 ? results : [])];
  const go = (href: string) => {
    onClose();
    setQuery("");
    router.push(href);
  };

  if (!open) return null;
  return (
    <div className="ad-overlay !items-start pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Search the dashboard" className="ad-dialog ad-dialog-md overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4">
          <Search size={18} className="ad-muted" />
          <input
            autoFocus
            className="h-14 flex-1 bg-transparent text-base outline-none"
            placeholder="Search pages, sections, articles, videos, files…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(list.length - 1, a + 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              }
              if (e.key === "Enter" && list[active]) go(list[active].href);
            }}
            aria-label="Search"
          />
          {loading ? <Spinner /> : <span className="ad-kbd">Esc</span>}
        </div>
        <ul className="max-h-[52vh] overflow-y-auto p-2" role="listbox" aria-label="Results">
          {list.map((r, i) => (
            <li key={`${r.href}-${i}`} role="option" aria-selected={i === active}>
              <button type="button" className="ad-menu-item" data-active={i === active} onMouseEnter={() => setActive(i)} onClick={() => go(r.href)}>
                <span className="min-w-0 flex-1 truncate">{r.title}</span>
                <span className="ad-muted shrink-0 text-xs">{r.subtitle}</span>
              </button>
            </li>
          ))}
          {!list.length && !loading ? <li className="ad-muted px-3 py-8 text-center text-sm">Nothing found for “{query}”.</li> : null}
        </ul>
      </div>
    </div>
  );
}

/* ---- Top bar ------------------------------------------------------------------------------------ */

function TopBar({ user, notifications, onMenu, onSearch }: { user: ShellUser; notifications: NotificationItem[]; onMenu: () => void; onSearch: () => void }) {
  const { lang, setLang } = useAdminPrefs();
  const [quickOpen, setQuickOpen, quickRef] = usePopover();
  const [bellOpen, setBellOpen, bellRef] = usePopover();
  const [profileOpen, setProfileOpen, profileRef] = usePopover();
  const alerts = notifications.filter((n) => n.tone !== "neutral").length;

  return (
    <header className="ad-glass sticky top-0 z-40 flex h-16 items-center gap-2 rounded-none border-x-0 border-t-0 px-3 md:px-6">
      <button type="button" className="ad-btn ad-btn-quiet ad-btn-icon lg:hidden" onClick={onMenu} aria-label="Open the menu">
        <Menu size={20} />
      </button>
      <Breadcrumbs />
      <div className="flex-1" />

      <button type="button" onClick={onSearch} className="ad-btn ad-btn-ghost hidden w-64 justify-start font-normal sm:inline-flex" aria-label="Search (Ctrl+K)">
        <Search size={16} className="ad-muted" />
        <span className="ad-muted flex-1 text-start">Search…</span>
        <span className="ad-kbd">Ctrl K</span>
      </button>
      <button type="button" onClick={onSearch} className="ad-btn ad-btn-quiet ad-btn-icon sm:hidden" aria-label="Search">
        <Search size={18} />
      </button>

      <div className="ad-tabs hidden md:inline-flex" role="group" aria-label="Content language shown in lists and previews">
        {(["ar", "en"] as const).map((l) => (
          <button key={l} type="button" className="ad-tab !h-7 !px-2.5 text-xs" aria-pressed={lang === l} onClick={() => setLang(l)} title={l === "ar" ? "Show Arabic titles and preview in Arabic" : "Show English titles and preview in English"}>
            {l === "ar" ? "ع" : "EN"}
          </button>
        ))}
      </div>

      <div ref={quickRef} className="relative">
        <button type="button" className="ad-btn ad-btn-primary ad-btn-sm hidden sm:inline-flex" aria-expanded={quickOpen} onClick={() => setQuickOpen(!quickOpen)}>
          <Plus size={15} /> New
        </button>
        {quickOpen ? (
          <div className="ad-popover end-0 top-full mt-2 w-60 p-1.5">
            {QUICK_LINKS.map((q) => (
              <Link key={q.href} href={q.href} className="ad-menu-item" onClick={() => setQuickOpen(false)}>
                <q.icon size={16} className="text-aqua-700" /> {q.label}
              </Link>
            ))}
            <a href={previewHref(lang, "/")} target="_blank" rel="noreferrer" className="ad-menu-item" onClick={() => setQuickOpen(false)}>
              <ExternalLink size={16} className="text-aqua-700" /> Preview the website
            </a>
          </div>
        ) : null}
      </div>

      <div ref={bellRef} className="relative">
        <button type="button" className="ad-btn ad-btn-quiet ad-btn-icon relative" aria-label={`Notifications (${notifications.length})`} aria-expanded={bellOpen} onClick={() => setBellOpen(!bellOpen)}>
          <Bell size={18} />
          {alerts ? <span className="absolute end-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-aqua-500 px-1 text-[0.62rem] font-bold text-ink-900">{alerts}</span> : null}
        </button>
        {bellOpen ? (
          <div className="ad-popover end-0 top-full mt-2 w-[min(24rem,92vw)] p-2">
            <p className="px-2 pt-1 pb-2 text-sm font-semibold">Notifications</p>
            {notifications.length ? (
              <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <Link href={n.href} className="ad-menu-item !items-start" onClick={() => setBellOpen(false)}>
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.tone === "warning" ? "bg-[var(--warn)]" : n.tone === "info" ? "bg-aqua-600" : "bg-ink-300"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{n.title}</span>
                        {n.text ? <span className="ad-muted block text-xs">{n.text}</span> : null}
                        {n.at ? (
                          <span className="ad-muted block text-[0.7rem]">
                            <TimeAgo value={n.at} />
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ad-muted px-2 py-6 text-center text-sm">You are all caught up.</p>
            )}
          </div>
        ) : null}
      </div>

      <div ref={profileRef} className="relative">
        <button type="button" className="flex items-center gap-2 rounded-xl p-1 pe-2 hover:bg-ink-900/5" aria-expanded={profileOpen} aria-label="Account menu" onClick={() => setProfileOpen(!profileOpen)}>
          <span className="grid size-8 place-items-center rounded-lg bg-ink-900 text-xs font-semibold text-aqua-400">{(user.displayName || user.email).slice(0, 1).toUpperCase()}</span>
          <span className="hidden max-w-36 truncate text-sm font-medium lg:block">{user.displayName || user.email}</span>
        </button>
        {profileOpen ? (
          <div className="ad-popover end-0 top-full mt-2 w-64 p-1.5">
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-semibold">{user.displayName || "Administrator"}</p>
              <p className="ad-muted truncate text-xs">{user.email}</p>
              <span className="ad-badge ad-badge-aqua mt-1.5">{user.role === "owner" ? "Owner" : "Editor"}</span>
            </div>
            <div className="ad-divider my-1" />
            <Link href="/admin/account" className="ad-menu-item" onClick={() => setProfileOpen(false)}>
              <UserRound size={16} /> My account
            </Link>
            <a href={previewHref(lang, "/")} target="_blank" rel="noreferrer" className="ad-menu-item">
              <ExternalLink size={16} /> View the website
            </a>
            <form action={signOut}>
              <button type="submit" className="ad-menu-item text-[var(--danger)]">
                <LogOut size={16} /> Sign out
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}

/* ---- Shell ---------------------------------------------------------------------------------------- */

export function AdminShell({ user, notifications, initialLang, children }: { user: ShellUser; notifications: NotificationItem[]; initialLang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawer(false);
  }

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      document.cookie = `cms_admin_lang=${next}; path=/admin; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <PrefsContext.Provider value={{ lang, setLang, user }}>
      <FeedbackProvider>
        <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <aside className="fixed inset-y-0 start-0 z-50 hidden w-[var(--sidebar-w)] lg:block">
          <Sidebar user={user} />
        </aside>
        {drawer ? (
          <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 start-0 w-[min(85vw,var(--sidebar-w))] shadow-2xl">
              <Sidebar user={user} onNavigate={() => setDrawer(false)} />
              <button type="button" className="absolute end-3 top-5 grid size-9 place-items-center rounded-lg text-white/80 hover:bg-white/10" onClick={() => setDrawer(false)} aria-label="Close the menu">
                <X size={18} />
              </button>
            </div>
          </div>
        ) : null}
        <div className="lg:ps-[var(--sidebar-w)]">
          <TopBar user={user} notifications={notifications} onMenu={() => setDrawer(true)} onSearch={() => setSearch(true)} />
          <main id="admin-main" className="mx-auto w-full max-w-[1400px] px-4 pt-6 pb-16 md:px-8 md:pt-8">
            {children}
          </main>
        </div>
        <SearchPalette open={search} onClose={() => setSearch(false)} />
      </FeedbackProvider>
    </PrefsContext.Provider>
  );
}
