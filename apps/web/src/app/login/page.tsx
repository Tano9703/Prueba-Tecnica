"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setAuthToken } from "@/lib/cookies";
import { authService } from "@/services/auth.service";

const schema = z.object({
  email: z.string().email("Ingresa un correo válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();

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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-[760px] rounded-xl border border-border bg-slate-50 p-10">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="mx-auto mb-8 w-fit text-center">
          <div className="text-2xl font-black uppercase tracking-wide text-[#F97316]">Tennis <span className="text-[#EF4444]">Star</span></div>
          <h1 className="mt-6 text-6xl font-black tracking-tight text-[#0B1739]">Inicia Sesión</h1>
          <p className="mt-2 text-xl text-slate-600">Ingresa a tu cuenta para continuar</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
          <div className="space-y-1">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" {...register("email")} placeholder="ejemplo@mail.com" />
            {errors.email ? <p className="text-xs text-[#B42318]">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" {...register("password")} placeholder="********" />
            {errors.password ? <p className="text-xs text-[#B42318]">{errors.password.message}</p> : null}
          </div>

          <button type="button" className="text-sm text-slate-700 underline">
            ¿Olvidaste tu contraseña?
          </button>

          <Controller
            name="remember"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={Boolean(field.value)} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                Mantener sesión iniciada
              </label>
            )}
          />

          {loginMutation.error ? (
            <p className="text-sm text-[#B42318]">{(loginMutation.error as Error).message}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Enviando..." : "Ingresar"}
          </Button>
        </form>
        </div>
      </div>
    </main>
  );
}
