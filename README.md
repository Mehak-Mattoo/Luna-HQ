# AI Workspace

A Notion-inspired note-taking app with AI built in. Capture ideas in folders, chat with **Luna** about your notes, share with collaborators or public links, and track AI usage from a personal dashboard.

Built with **Next.js**, **Supabase**, and the **Vercel AI SDK** (Google Gemini).

---

## Overview

AI Workspace is a full-stack knowledge workspace where each note can be organized, favorited, attached with files, summarized, and discussed with an AI assistant. Authentication and data live in Supabase; AI features run through secured API routes with rate limiting.

The app is designed around three ideas:

1. **Notes first** — fast CRUD, folders, favorites, grid/list views, and global search (`⌘K`).
2. **AI where you work** — Luna opens in a side panel and answers questions grounded in the current note’s content.
3. **Sharing with control** — invite people by email, copy view-only links, or browse notes shared with you.

---


## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | React 19, [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), Radix UI |
| Data | [Supabase](https://supabase.com/) (Postgres, Auth, Storage, RLS) |
| Client state | [TanStack Query](https://tanstack.com/query), React Context |
| AI | [Vercel AI SDK](https://sdk.vercel.ai/), Google Gemini (`gemini-2.5-flash`) |
| Rate limiting | [Upstash Redis](https://upstash.com/) |
| Testing | [Vitest](https://vitest.dev/), Testing Library |

---
