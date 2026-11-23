/** Opens a page of the website in preview mode (unpublished drafts visible to administrators). */
export const previewHref = (lang: "ar" | "en", path: string | null | undefined) => `/admin/preview?path=${encodeURIComponent(`/${lang}${path && path !== "/" ? path : ""}`)}`;
