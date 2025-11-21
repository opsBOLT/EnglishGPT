import { Navbar1 } from "@/components/ui/navbar-1";
import { AuthComponent } from "@/components/ui/sign-up";

const Landing = () => {
  return (
    <div className="relative min-h-screen bg-white text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-36 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(170,128,243,0.45),transparent_55%)] blur-3xl" />
        <div className="absolute right-0 top-12 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(170,128,243,0.3),transparent_52%)] blur-2xl" />
        <div className="absolute left-1/2 bottom-[-8rem] h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(170,128,243,0.28),transparent_60%)] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_10%,#ffffff_25%,rgba(170,128,243,0.12)_65%,transparent_100%)]" />
      </div>

      <Navbar1 />

      <main className="relative z-10 flex items-center justify-center px-4 py-16 md:py-24">
        <div className="w-full max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7b5ad6]">Sign up</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-black">Join EnglishGPT today</h1>
            <p className="mt-3 text-base text-muted-foreground">
              Continue with Google to create your account and get instant access to the IGCSE English co-pilot.
            </p>
          </div>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-[#aa80f3]/20 bg-white/80 backdrop-blur-md shadow-[0_16px_80px_rgba(170,128,243,0.25)]">
            <AuthComponent brandName="EnglishGPT" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
