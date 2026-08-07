import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "../../components/ui/ThemeToggle";

const SOCIAL_PROVIDERS = [
  { name: "Google", logo: "/images/google-logo.png" },
  { name: "Microsoft", logo: "/images/microsoft-logo.png" },
  { name: "GitHub", logo: "/images/github-logo.png" },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest dark:bg-dark-background text-on-background dark:text-dark-on-background antialiased h-screen overflow-y-auto flex flex-col items-center">
      <header className="bg-transparent w-full top-0 flex items-center justify-between px-md py-xs sticky z-10">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
          account_balance_wallet
        </span>
        <h1 className="font-bold text-xl text-primary tracking-tight">Finora AI</h1>
        <ThemeToggle />
      </header>

      <main className="w-full max-w-md px-md py-sm flex flex-col flex-1">
        <div className="w-full flex justify-center mb-md rounded-xl overflow-hidden shadow-lg shadow-primary/5 bg-surface-container dark:bg-dark-surface-container border border-outline-variant/30 dark:border-dark-outline-variant/30">
          <img src="/images/login-hero.png" alt="" className="w-full h-28 sm:h-36 object-cover opacity-90" />
        </div>

        <div className="mb-md text-center">
          <h2 className="text-xl font-semibold text-on-background dark:text-dark-on-background mb-xs">Masuk Dulu, Bos!</h2>
          <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
            Lanjut pantau cuan dan investasi kamu hari ini.
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-dark-surface-container-lowest rounded-xl border border-outline-variant/40 dark:border-dark-outline-variant/40 shadow-sm p-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-sm">
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-dark-outline">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="bos@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-surface-container-lowest dark:bg-dark-surface-container-lowest pl-10 pr-4 py-3 rounded-lg border border-outline-variant/50 dark:border-dark-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-body-sm text-on-surface dark:text-dark-on-background placeholder:text-outline-variant dark:placeholder:text-dark-outline-variant"
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-dark-outline">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-surface-container-lowest dark:bg-dark-surface-container-lowest pl-10 pr-10 py-3 rounded-lg border border-outline-variant/50 dark:border-dark-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-body-sm text-on-surface dark:text-dark-on-background"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline dark:text-dark-outline hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">{showPassword ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-outline-variant dark:border-dark-outline-variant text-primary focus:ring-primary/50 w-4 h-4 bg-surface-container-lowest dark:bg-dark-surface-container-lowest" />
                <span className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant">Remember Me</span>
              </label>
              <a href="#" className="text-label-sm text-primary font-semibold hover:underline">
                Lupa Password?
              </a>
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-sm w-full bg-primary text-on-primary text-label-sm py-3 rounded-full flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/30 disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Masuk Sekarang"}
              {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </form>
        </div>

        <div className="flex items-center gap-4 my-md">
          <div className="flex-1 h-px bg-outline-variant/40 dark:bg-dark-outline-variant/40"></div>
          <span className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-wider">
            Atau masuk pakai
          </span>
          <div className="flex-1 h-px bg-outline-variant/40 dark:bg-dark-outline-variant/40"></div>
        </div>

        <div className="flex justify-center gap-4 mb-md">
          {SOCIAL_PROVIDERS.map((provider) => (
            <button
              key={provider.name}
              type="button"
              aria-label={`Masuk dengan ${provider.name}`}
              className="w-11 h-11 rounded-lg bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant/50 dark:border-dark-outline-variant/50 flex items-center justify-center hover:bg-surface-container-low dark:hover:bg-dark-surface-container-low transition-colors shadow-sm p-2"
            >
              <img src={provider.logo} alt={`${provider.name} logo`} className="w-full h-full object-contain" />
            </button>
          ))}
        </div>

        <div className="mt-auto text-center pb-sm flex justify-center gap-1">
          <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Belum punya akun?</span>
          <Link to="/register" className="text-body-sm font-semibold text-primary hover:underline">
            Daftar Gercep
          </Link>
        </div>
      </main>
    </div>
  );
}
