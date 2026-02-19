"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/cookies";
import { authService } from "@/services/auth.service";

const schema = z.object({
  email: z.string().email("Ingresa un correo válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    let cancelled = false;
    authService
      .me()
      .then(() => {
        if (!cancelled) {
          router.replace("/");
        }
      })
      .catch(() => {
        clearAuthToken();
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: (values: FormValues) => authService.login({ email: values.email, password: values.password }),
    onSuccess: (response, values) => {
      setAuthToken(response.accessToken, Boolean(values.remember));
      router.push("/");
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-tertiary/18 p-4">
      <div className="w-full max-w-[760px] rounded-xl border border-tertiary/35 bg-secondary p-5 sm:p-8 md:p-10">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="mx-auto mb-8 w-fit text-center">
            <div className="text-xl font-black uppercase tracking-wide text-quaternary sm:text-2xl">
              Tennis <span className="text-quinary">Star</span>
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-primary sm:mt-6 sm:text-5xl md:text-6xl">Inicia Sesión</h1>
            <p className="mt-2 text-base text-tertiary sm:text-lg md:text-xl">Ingresa a tu cuenta para continuar</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
            <div className="space-y-1">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" {...register("email")} placeholder="ejemplo@mail.com" />
              {errors.email ? <p className="text-xs text-quinary">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...register("password")} placeholder="********" />
              {errors.password ? <p className="text-xs text-quinary">{errors.password.message}</p> : null}
            </div>

            <button type="button" className="text-sm text-tertiary underline">
              ¿Olvidaste tu contraseña?
            </button>

            <Controller
              name="remember"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm text-primary">
                  <Checkbox checked={Boolean(field.value)} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                  Mantener sesión iniciada
                </label>
              )}
            />

            {loginMutation.error ? <p className="text-sm text-quinary">{(loginMutation.error as Error).message}</p> : null}

            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Enviando..." : "Ingresar"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

