import { notFound } from "next/navigation";

/** Any unknown path under /ar or /en renders the branded 404 page. */
export default function CatchAll() {
  notFound();
}
