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
    <div className="bg-surface-container-lowest dark:bg-dark-background text-on-background dark:text-dark-on-background antialiased min-h-dvh flex flex-col items-center">
      {/* Header transparan di atas gambar hero — background hanya muncul saat konten
          discroll ke belakangnya, supaya gambar terasa full-bleed, bukan terpotong kartu. */}
      <header className="w-full fixed top-0 left-0 flex items-center justify-between px-md py-md z-10">
        <span
          className="material-symbols-outlined text-white drop-shadow-md"
          style={{ fontVariationSettings: '"FILL" 1' }}
          aria-hidden="true"
        >
          account_balance_wallet
        </span>
        <h1 className="font-bold text-xl text-white tracking-tight drop-shadow-md">Finora AI</h1>
        <ThemeToggle className="!border-white/40 !text-white hover:!bg-white/10" />
      </header>

      {/* Hero full-bleed: lebar penuh viewport, tinggi menyesuaikan lewat aspect-ratio.
          Di 640-767px (tablet kecil/phablet, masih dapat versi mobile ini karena di
          bawah breakpoint md:768px) rasio dibuat lebih landscape (sm:aspect-[16/9])
          supaya gambar tidak menjulang tinggi di viewport yang jauh lebih lebar. */}
      <div className="relative w-full aspect-square sm:aspect-[16/9] shrink-0 overflow-hidden">
        <img
          src="/images/login-hero.png"
          alt="Ilustrasi kartu AI Finance terhubung dengan grafik pertumbuhan finansial"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest dark:from-dark-background via-transparent to-black/10"
          aria-hidden="true"
        />
      </div>

      {/* max-w-md (448px) -> sm:max-w-lg (512px): form sedikit lebih lega di
          640-767px, bukan melebar penuh mengikuti viewport yang jauh lebih lebar. */}
      <main className="w-full max-w-md sm:max-w-lg px-md py-xs pb-md -mt-8 relative flex flex-col">
        <div className="mb-xs text-center">
          <h2 className="text-lg font-semibold text-on-background dark:text-dark-on-background mb-xs">Masuk Dulu, Bos!</h2>
          <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
            Lanjut pantau cuan dan investasi kamu hari ini.
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-dark-surface-container-lowest rounded-xl border border-outline-variant/40 dark:border-dark-outline-variant/40 shadow-sm p-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-xs">
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-dark-outline"
                  aria-hidden="true"
                >
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="bos@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full min-h-11 bg-surface-container-lowest dark:bg-dark-surface-container-lowest pl-10 pr-4 py-2 rounded-lg border border-outline-variant/50 dark:border-dark-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-base text-on-surface dark:text-dark-on-background placeholder:text-outline-variant dark:placeholder:text-dark-outline-variant"
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-dark-outline"
                  aria-hidden="true"
                >
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full min-h-11 bg-surface-container-lowest dark:bg-dark-surface-container-lowest pl-10 pr-12 py-2 rounded-lg border border-outline-variant/50 dark:border-dark-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-base text-on-surface dark:text-dark-on-background"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={showPassword}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-xs -ml-2">
              {/* min-h-11 pada label memperluas area sentuh checkbox yang secara visual kecil. */}
              <label className="flex items-center gap-2 min-h-11 px-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-outline-variant dark:border-dark-outline-variant text-primary focus:ring-primary/50 w-4 h-4 bg-surface-container-lowest dark:bg-dark-surface-container-lowest"
                />
                <span className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant">Remember Me</span>
              </label>
              <a
                href="#"
                className="inline-flex items-center min-h-11 px-2 -mr-2 text-label-sm text-primary font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
              >
                Lupa Password?
              </a>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-xs text-body-sm text-danger dark:text-dark-danger">
                <span className="material-symbols-outlined text-[16px] leading-5 shrink-0" aria-hidden="true">
                  error
                </span>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-xs w-full min-h-11 bg-primary text-on-primary text-label-sm rounded-full flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 motion-safe:active:scale-95 transition-all shadow-lg shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Memproses..." : "Masuk Sekarang"}
              {!loading && <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>}
            </button>
          </form>
        </div>

        <div className="flex items-center gap-3 my-xs">
          <div className="flex-1 h-px bg-outline-variant/40 dark:bg-dark-outline-variant/40"></div>
          <span className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-wider">
            Atau masuk pakai
          </span>
          <div className="flex-1 h-px bg-outline-variant/40 dark:bg-dark-outline-variant/40"></div>
        </div>

        <div className="flex justify-center gap-3 mb-xs">
          {SOCIAL_PROVIDERS.map((provider) => (
            <button
              key={provider.name}
              type="button"
              aria-label={`Masuk dengan ${provider.name}`}
              className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant/50 dark:border-dark-outline-variant/50 hover:bg-surface-container-low dark:hover:bg-dark-surface-container-low transition-colors shadow-sm"
            >
              <img src={provider.logo} alt={`${provider.name} logo`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="text-center flex justify-center gap-1">
          <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Belum punya akun?</span>
          <Link to="/register" className="text-body-sm font-semibold text-primary hover:underline">
            Daftar Gercep
          </Link>
        </div>
      </main>
    </div>
  );
}
