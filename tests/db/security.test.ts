import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { buildBundledSnapshot } from "@/lib/cms/bundled";
import { stableId } from "@/lib/cms/ids";
import { seedSql } from "@/lib/cms/seed-sql";
import type { CmsSnapshot } from "@/lib/cms/types";
import { as, createAdmin, createUser, failureOf } from "./harness";
import { createDatabase } from "./harness";

let db: PGlite;
let owner: string;
let editor: string;
let stranger: string;
const bundled = buildBundledSnapshot();
const heroId = stableId("section", "home.hero");
const anon = { role: "anon" } as const;
const asOwner = () => ({ role: "authenticated", userId: owner }) as const;
const asEditor = () => ({ role: "authenticated", userId: editor }) as const;
const asStranger = () => ({ role: "authenticated", userId: stranger }) as const;

const snapshotAs = (actor: Parameters<typeof as>[1], preview = false) =>
  as(db, actor, async (tx) => (await tx.query<{ s: CmsSnapshot }>(`select public.cms_snapshot($1) as s`, [preview])).rows[0].s);

beforeAll(async () => {
  db = await createDatabase();
  await db.exec(seedSql(bundled));
  owner = await createAdmin(db, "owner@clinic.test", "owner");
  editor = await createAdmin(db, "editor@clinic.test", "editor");
  stranger = await createUser(db, "someone@else.test");
});

describe("visitors (anon) and signed-in non-admins", () => {
  for (const [name, actor] of [
    ["anon", () => anon],
    ["non-admin", asStranger],
  ] as const) {
    it(`${name}: cannot change any content table`, async () => {
      for (const sql of [
        `update public.services set title_en = 'x'`,
        `update public.site_settings set doctor_name_en = 'x'`,
        `insert into public.faqs (group_key, question_en) values ('home', 'x')`,
        `delete from public.articles`,
        `update public.page_sections set content = '{}'`,
        `insert into public.media (kind, bucket, path, mime_type) values ('image', 'images', 'x.jpg', 'image/jpeg')`,
      ]) {
        const result = await as(db, actor(), async (tx) => {
          try {
            const r = await tx.query(sql);
            return r.affectedRows ?? 0;
          } catch (e) {
            return (e as Error).message;
          }
        });
        // Either refused outright, or RLS filtered every row away.
        expect(result === 0 || typeof result === "string", `${name}: ${sql}`).toBe(true);
      }
    });

    it(`${name}: cannot read drafts, administrators or the activity log`, async () => {
      const log = await as(db, actor(), async (tx) => {
        try {
          return (await tx.query(`select * from public.activity_logs`)).rows.length;
        } catch (e) {
          return (e as Error).message;
        }
      });
      // Visitors have no access at all; signed-in non-admins see no rows.
      expect(log === 0 || /permission denied/.test(String(log))).toBe(true);
      const drafts = await as(db, actor(), async (tx) => {
        try {
          return (await tx.query(`select * from public.section_drafts`)).rows.length;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(drafts === 0 || /permission denied/.test(String(drafts))).toBe(true);
      const admins = await as(db, actor(), async (tx) => {
        try {
          return (await tx.query(`select * from public.admins`)).rows.length;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(admins === 0 || /permission denied/.test(String(admins))).toBe(true);
    });

    it(`${name}: cannot upload to storage`, async () => {
      expect(await failureOf(db, actor(), (tx) => tx.query(`insert into storage.objects (bucket_id, name) values ('images', 'x.jpg')`))).toMatch(/row-level security|permission/);
    });

    it(`${name}: cannot use administrator functions`, async () => {
      expect(await failureOf(db, actor(), (tx) => tx.query(`select public.cms_dashboard_stats()`))).not.toBeNull();
      expect(await failureOf(db, actor(), (tx) => tx.query(`select public.cms_reorder('services', array[]::uuid[])`))).not.toBeNull();
      expect(await failureOf(db, actor(), (tx) => tx.query(`select public.admin_grant('someone@else.test', 'owner')`))).not.toBeNull();
      expect(await failureOf(db, actor(), (tx) => tx.query(`select public.section_publish($1)`, [heroId]))).not.toBeNull();
    });
  }

  it("visitors can read the snapshot repeatedly (generic plans never touch drafts)", async () => {
    for (let i = 0; i < 12; i++) {
      await db.transaction(async (tx) => {
        await tx.query(`select set_config('request.jwt.claims', '{"role":"anon"}', true)`);
        await tx.exec(`set local role anon`);
        for (let j = 0; j < 3; j++) await tx.query(`select public.cms_snapshot(${j % 2 === 0}) as s`);
        await tx.rollback();
      });
    }
  });

  it("preview mode gives visitors nothing extra", async () => {
    await as(db, asOwner(), async (tx) => {
      await tx.query(`update public.services set status = 'draft' where slug = 'manual'`);
    }, true);
    const normal = await snapshotAs(anon);
    const preview = await snapshotAs(anon, true);
    expect(preview.preview).toBe(false);
    expect(preview.services.map((s) => s.slug)).toEqual(normal.services.map((s) => s.slug));
    expect(normal.services.some((s) => s.slug === "manual")).toBe(false);
    await as(db, asOwner(), async (tx) => {
      await tx.query(`update public.services set status = 'published' where slug = 'manual'`);
    }, true);
  });

  it("hidden sections are not public", async () => {
    await as(db, asOwner(), async (tx) => {
      expect((await tx.query(`update public.page_sections set visible = false where id = $1`, [heroId])).affectedRows).toBe(1);
      const anonView = await tx.query(`set local role anon; select count(*)::int as n from public.page_sections where id = '${heroId}'`).catch(() => null);
      void anonView;
    });
    // Within one transaction: hide, then read as anon.
    await db.transaction(async (tx) => {
      await tx.query(`update public.page_sections set visible = false where id = $1`, [heroId]);
      await tx.query(`select set_config('request.jwt.claims', '{"role":"anon"}', true)`);
      await tx.exec(`set local role anon`);
      const { rows } = await tx.query<{ n: number }>(`select count(*)::int as n from public.page_sections where id = $1`, [heroId]);
      expect(rows[0].n).toBe(0);
      await tx.rollback();
    });
  });
});

describe("administrators", () => {
  it("drafts stay private until published, then go live — with activity logged", async () => {
    await as(db, asEditor(), async (tx) => {
      const draft = { ...bundled.sections.find((s) => s.id === heroId)!.content, titleLead: { ar: "مسودة", en: "Draft title" } };
      await tx.query(`insert into public.section_drafts (section_id, content) values ($1, $2)`, [heroId, JSON.stringify(draft)]);
    }, true);

    const publicBefore = await snapshotAs(anon);
    const previewBefore = await snapshotAs(asEditor(), true);
    const hero = (s: CmsSnapshot) => s.sections.find((x) => x.id === heroId)!.content as { titleLead: { en: string } };
    expect(hero(publicBefore).titleLead.en).toBe("Move");
    expect(previewBefore.preview).toBe(true);
    expect(hero(previewBefore).titleLead.en).toBe("Draft title");

    await as(db, asEditor(), (tx) => tx.query(`select public.section_publish($1)`, [heroId]), true);
    const publicAfter = await snapshotAs(anon);
    expect(hero(publicAfter).titleLead.en).toBe("Draft title");
    const { rows: left } = await db.query(`select * from public.section_drafts where section_id = $1`, [heroId]);
    expect(left).toHaveLength(0);

    const { rows: log } = await db.query<{ action: string; entity_label: string; actor_email: string }>(
      `select action, entity_label, actor_email from public.activity_logs where entity_id = $1 order by id`,
      [heroId],
    );
    expect(log.map((l) => l.action)).toEqual(["save_draft", "publish"]);
    expect(log[0].entity_label).toBe("home › hero");
    expect(log[0].actor_email).toBe("editor@clinic.test");
  });

  it("publishing all drafts of a page", async () => {
    const ids = [stableId("section", "about.bio"), stableId("section", "about.values")];
    const count = await as(db, asOwner(), async (tx) => {
      for (const id of ids) await tx.query(`insert into public.section_drafts (section_id, content) select id, content from public.page_sections where id = $1`, [id]);
      return (await tx.query<{ n: number }>(`select public.page_publish_all('about') as n`)).rows[0].n;
    });
    expect(count).toBe(2);
  });

  it("unpublishing an item hides it from the website, and is logged", async () => {
    await as(db, asOwner(), (tx) => tx.query(`update public.articles set status = 'draft' where slug = 'text-neck'`), true);
    expect((await snapshotAs(anon)).articles.some((a) => a.slug === "text-neck")).toBe(false);
    expect((await snapshotAs(asOwner(), true)).articles.some((a) => a.slug === "text-neck")).toBe(true);
    const { rows } = await db.query<{ action: string }>(`select action from public.activity_logs where entity_type = 'articles' order by id desc limit 1`);
    expect(rows[0].action).toBe("unpublish");
    await as(db, asOwner(), (tx) => tx.query(`update public.articles set status = 'published' where slug = 'text-neck'`), true);
  });

  it("only one article is featured at a time", async () => {
    await as(db, asOwner(), async (tx) => {
      await tx.query(`update public.articles set featured = true where slug = 'desk-posture'`);
      const { rows } = await tx.query<{ slug: string }>(`select slug from public.articles where featured`);
      expect(rows.map((r) => r.slug)).toEqual(["desk-posture"]);
    });
  });

  it("reorders a list atomically and logs it once", async () => {
    const services = bundled.services.map((s) => s.id).reverse();
    const before = (await db.query<{ n: number }>(`select count(*)::int as n from public.activity_logs`)).rows[0].n;
    await as(db, asEditor(), (tx) => tx.query(`select public.cms_reorder('services', $1::uuid[])`, [services]), true);
    const { rows } = await db.query<{ id: string }>(`select id from public.services order by sort_order`);
    expect(rows.map((r) => r.id)).toEqual(services);
    const after = (await db.query<{ n: number }>(`select count(*)::int as n from public.activity_logs`)).rows[0].n;
    expect(after - before).toBe(1);
    expect(await failureOf(db, asEditor(), (tx) => tx.query(`select public.cms_reorder('admins', array[]::uuid[])`))).toMatch(/cannot be reordered/);
  });

  it("refuses to delete a file that is still used (even inside section content)", async () => {
    const heroImage = stableId("media", "/images/photos/pexels-20860582.jpg");
    expect(await failureOf(db, asOwner(), (tx) => tx.query(`delete from public.media where id = $1`, [heroImage]))).toMatch(/still used/);
    await as(db, asOwner(), async (tx) => {
      const { rows } = await tx.query<{ id: string }>(`insert into public.media (kind, bucket, path, mime_type) values ('image', 'images', 'website/2026/11/abc-x.jpg', 'image/jpeg') returning id`);
      const usage = await tx.query(`select * from public.media_usages($1)`, [rows[0].id]);
      expect(usage.rows).toHaveLength(0);
      expect((await tx.query(`delete from public.media where id = $1`, [rows[0].id])).affectedRows).toBe(1);
    });
  });

  it("lists where a file is used", async () => {
    const id = stableId("media", "/images/photos/pexels-20860607.jpg"); // kneeHands
    const rows = await as(db, asOwner(), async (tx) => (await tx.query<{ source: string; label: string }>(`select * from public.media_usages($1)`, [id])).rows);
    expect(rows.map((r) => r.label)).toEqual(expect.arrayContaining(["about › hero", "home › stats"]));
  });

  it("can upload to storage", async () => {
    await as(db, asEditor(), async (tx) => {
      await tx.query(`insert into storage.objects (bucket_id, name) values ('images', 'website/2026/11/abc-x.jpg')`);
      await tx.query(`insert into storage.objects (bucket_id, name) values ('videos', 'videos/2026/11/abc-x.mp4')`);
    });
  });

  it("reads dashboard figures and the activity log", async () => {
    const stats = await as(db, asEditor(), async (tx) => (await tx.query<{ s: Record<string, unknown> }>(`select public.cms_dashboard_stats() as s`)).rows[0].s);
    expect(stats.pages).toBe(6);
    expect((stats.collections as Record<string, { published: number }>).videos.published).toBe(9);
    expect(stats.activityByDay).toHaveLength(14);
    expect(await failureOf(db, asEditor(), (tx) => tx.query(`select * from public.activity_logs limit 1`))).toBeNull();
  });

  it("cannot write the activity log directly, only record known events", async () => {
    expect(await failureOf(db, asEditor(), (tx) => tx.query(`insert into public.activity_logs (action, entity_type) values ('update', 'x')`))).toMatch(/permission denied/);
    expect(await failureOf(db, asEditor(), (tx) => tx.query(`select public.log_event('sign_in', 'session')`))).toBeNull();
    expect(await failureOf(db, asEditor(), (tx) => tx.query(`select public.log_event('delete', 'services')`))).toMatch(/Unknown activity/);
  });

  it("rejects unsafe links", async () => {
    expect(await failureOf(db, asOwner(), (tx) => tx.query(`update public.navigation_items set href = 'javascript:alert(1)' where key = 'home'`))).toMatch(/check/);
    expect(await failureOf(db, asOwner(), (tx) => tx.query(`update public.social_links set url = 'http://insecure.example' where platform = 'facebook'`))).toMatch(/check/);
  });
});

describe("administrator management", () => {
  it("editors cannot grant, revoke or list administrators", async () => {
    expect(await failureOf(db, asEditor(), (tx) => tx.query(`select public.admin_grant('someone@else.test', 'editor')`))).toMatch(/Only owners/);
    expect(await failureOf(db, asEditor(), (tx) => tx.query(`select public.admin_revoke($1)`, [owner]))).toMatch(/Only owners/);
    const list = await as(db, asEditor(), async (tx) => (await tx.query(`select * from public.admin_list()`)).rows);
    expect(list).toHaveLength(0);
    expect(await failureOf(db, asEditor(), (tx) => tx.query(`update public.admins set role = 'owner' where user_id = $1`, [editor]))).toMatch(/row-level security|violates/);
  });

  it("owners grant access to existing users, and the change is logged", async () => {
    await as(db, asOwner(), async (tx) => {
      const { rows } = await tx.query<{ role: string }>(`select (public.admin_grant('SOMEONE@else.test', 'editor', 'Someone')).role as role`);
      expect(rows[0].role).toBe("editor");
      const list = (await tx.query(`select * from public.admin_list()`)).rows;
      expect(list).toHaveLength(3);
      const log = (await tx.query<{ action: string; entity_label: string }>(`select action, entity_label from public.activity_logs where entity_type = 'admins' order by id desc limit 1`)).rows[0];
      expect(log).toEqual({ action: "grant", entity_label: "someone@else.test" });
    });
    expect(await failureOf(db, asOwner(), (tx) => tx.query(`select public.admin_grant('nobody@nowhere.test', 'editor')`))).toMatch(/No Supabase Auth user/);
  });

  it("the last owner can never be removed or demoted", async () => {
    expect(await failureOf(db, asOwner(), (tx) => tx.query(`select public.admin_revoke($1)`, [owner]))).toMatch(/at least one owner/);
    expect(await failureOf(db, asOwner(), (tx) => tx.query(`update public.admins set role = 'editor' where user_id = $1`, [owner]))).toMatch(/at least one owner/);
  });

  it("an administrator may rename themself but not change their role", async () => {
    await as(db, asEditor(), async (tx) => {
      expect((await tx.query(`update public.admins set display_name = 'Ed' where user_id = $1`, [editor])).affectedRows).toBe(1);
    });
    expect(await failureOf(db, asEditor(), (tx) => tx.query(`update public.admins set role = 'owner' where user_id = $1`, [editor]))).not.toBeNull();
  });
});
