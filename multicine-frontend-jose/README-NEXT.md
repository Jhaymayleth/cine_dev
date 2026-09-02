# Migracion a Next.js

La copia usa Next.js con App Router.

## Comandos

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm start
```

La entrada de Next.js esta en `app/`. Las features existentes siguen en `src/` y se renderizan mediante una isla cliente transitoria en `app/legacy-app.tsx` para permitir una migracion progresiva de React Router a App Router.

## Variables

Copia `.env.example` a `.env.local` y configura `NEXT_PUBLIC_API_URL` apuntando a `multicine-backend`.

No ejecutes `git push` desde esta copia: el repositorio remoto se configurara posteriormente.
