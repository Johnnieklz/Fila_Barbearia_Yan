"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ErrorBanner } from "@/components/ErrorBanner";

type Mode = "login" | "signup";

const FRIENDLY_ERRORS: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "User already registered":
    "Este e-mail já está cadastrado. Faça login.",
};

function friendlyError(message: string) {
  return (
    FRIENDLY_ERRORS[message] ??
    "Algo deu errado. Tente novamente em instantes."
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      if (mode === "login") {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (signInError) {
          throw signInError;
        }
      } else {
        const { error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: fullName.trim(),
              },
            },
          });

        if (signUpError) {
          throw signUpError;
        }
      }

      router.push("/painel");
      router.refresh();
    } catch (err) {
      console.error("Erro de autenticação:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Erro desconhecido";

      setError(friendlyError(message));
    } finally {
      setSubmitting(false);
    }
  }

  function toggleMode() {
    setMode((current) =>
      current === "login" ? "signup" : "login"
    );

    setError(null);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-cream">
        {mode === "login"
          ? "Entrar"
          : "Criar conta de barbeiro"}
      </h1>

      <p className="mt-1 text-sm text-muted">
        {mode === "login"
          ? "Acesse o painel da sua barbearia."
          : "Leva menos de um minuto."}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-3"
      >
        {mode === "signup" && (
          <div>
            <label
              htmlFor="full_name"
              className="mb-1.5 block text-sm text-muted"
            >
              Seu nome
            </label>

            <input
              id="full_name"
              type="text"
              required
              value={fullName}
              onChange={(e) =>
                setFullName(e.target.value)
              }
              className="field-input"
              placeholder="Ex: João Barbeiro"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm text-muted"
          >
            E-mail
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="field-input"
            placeholder="voce@email.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm text-muted"
          >
            Senha
          </label>

          <input
            id="password"
            type="password"
            autoComplete={
              mode === "login"
                ? "current-password"
                : "new-password"
            }
            required
            minLength={6}
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="field-input"
            placeholder="••••••••"
          />
        </div>

        {error && <ErrorBanner message={error} />}

        <button
          type="submit"
          className="btn-primary mt-2"
          disabled={submitting}
        >
          {submitting
            ? "Aguarde..."
            : mode === "login"
              ? "Entrar"
              : "Criar conta"}
        </button>
      </form>

      <button
        type="button"
        onClick={toggleMode}
        className="mt-5 text-center text-sm text-gold-400 underline underline-offset-4"
      >
        {mode === "login"
          ? "Ainda não tem conta? Cadastre-se"
          : "Já tem conta? Entrar"}
      </button>
    </main>
  );
}