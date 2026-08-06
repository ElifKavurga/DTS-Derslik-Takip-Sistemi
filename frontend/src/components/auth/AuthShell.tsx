import { ReactNode } from 'react';
import dtsLogo from '@/assets/dts-logo.png';

type AuthShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
};

export const AuthShell = ({ eyebrow, title, description, children }: AuthShellProps) => {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f8fb] px-4 py-8 text-slate-950 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,100,130,0.08),transparent_34%),linear-gradient(315deg,rgba(250,185,0,0.09),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />

      <section className="relative w-full max-w-[480px] animate-[auth-card-enter_560ms_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="absolute -inset-px rounded-[34px] bg-[linear-gradient(135deg,rgba(0,100,130,0.32),rgba(250,185,0,0.28),rgba(148,163,184,0.18))] opacity-80" />
        <div className="relative overflow-hidden rounded-[34px] border border-white/80 bg-white/95 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur">
          <div className="h-1.5 bg-[linear-gradient(90deg,#004b62,#006482,#fabc07)]" />

          <div className="px-6 pb-8 pt-9 sm:px-10 sm:pb-10 sm:pt-10">
            <header className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-slate-200 bg-[#f8fafc] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_28px_rgba(15,23,42,0.08)]">
                <img src={dtsLogo} alt="DTS Logo" className="h-[74px] w-[74px] object-contain" />
              </div>

              {eyebrow && (
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-[#006482]">
                  {eyebrow}
                </p>
              )}
              <h1 className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.01em] text-slate-950">
                {title}
              </h1>
              <p className="mx-auto mt-3 max-w-[330px] text-sm leading-6 text-slate-500">
                {description}
              </p>
            </header>

            <div className="mt-8">{children}</div>
          </div>
        </div>

        <footer className="mt-6 text-center text-xs leading-5 text-slate-500">
          <p>© 2026 DTS</p>
          <p className="font-medium text-slate-600">Derslik Takip Sistemi</p>
        </footer>
      </section>
    </main>
  );
};
