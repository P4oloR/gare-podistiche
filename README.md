# RunMap Italia — Gare Podistiche

## Setup locale

```bash
npm install
npm run dev
```

## Variabili d'ambiente

Crea un file `.env` nella root con:

```
VITE_SUPABASE_URL=https://tkfxpjdeuvtxgkinbzvy.supabase.co
VITE_SUPABASE_ANON_KEY=la-tua-anon-key
```

La **anon key** la trovi su Supabase → Settings → API → "anon public"

## Deploy su Vercel

1. Carica questo progetto su GitHub (nuovo repository)
2. Vai su vercel.com → "Add New Project" → importa il repo
3. In "Environment Variables" aggiungi:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clicca Deploy — il sito è online in 2 minuti

## Aggiornare i dati

Per aggiornare le gare, vai su Supabase Studio → Table Editor → garepodistiche
- Usa "Import data from CSV" per aggiornamenti massivi
- Oppure modifica le righe direttamente dalla tabella
