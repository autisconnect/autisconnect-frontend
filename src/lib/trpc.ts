// src/lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../types/AppRouter"; // opcional, ou use any

// Tipagem (use any por enquanto para evitar erro de import do backend)
type AppRouter = any;

export const trpc = createTRPCReact<AppRouter>();

// Cliente tRPC com link para o backend
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "https://autisconnect.onrender.com/api/trpc",
      headers() {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});