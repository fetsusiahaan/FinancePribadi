import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "../../components/ui/ThemeToggle";

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
    <div className="bg-surface-container-lowest dark:bg-dark-background text-on-background dark:text-dark-on-background antialiased h-dvh overflow-hidden flex">
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-gutter py-md bg-surface-container-lowest dark:bg-dark-surface-container-lowest shadow-sm">
        <div className="flex items-center gap-sm">
          <span
            className="material-symbols-outlined text-primary text-3xl"
            style={{ fontVariationSettings: '"FILL" 1' }}
            aria-hidden="true"
          >
            hive
          </span>
          <span className="font-semibold text-xl text-on-background dark:text-dark-on-background tracking-tight">Finora AI</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="w-full h-full flex">
        {/* Kolom Kiri: Form Login */}
        <section className="w-full md:w-6/12 lg:w-5/12 h-full flex items-center justify-center px-gutter pt-14 pb-xs relative z-10 overflow-y-auto">
          <div className="w-full max-w-[440px] glass-panel rounded-xl p-sm my-auto">
            <div className="mb-xs">
              <h1 className="text-lg md:text-xl font-semibold text-on-background dark:text-dark-on-background mb-xs">
                Masuk Dulu, Bos!
              </h1>
              <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
                Lanjut pantau cuan dan investasi kamu hari ini.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-xs">
              <div className="space-y-xs">
                <label className="text-label-sm text-on-surface dark:text-dark-on-background uppercase tracking-wider" htmlFor="email">
                  Alamat Email
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline-variant dark:text-dark-outline-variant text-[20px]"
                    aria-hidden="true"
                  >
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="contoh@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full min-h-11 pl-xl pr-md py-[8px] bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-lg text-on-background dark:text-dark-on-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-outline dark:placeholder:text-dark-outline text-body-sm"
                  />
                </div>
              </div>

              <div className="space-y-xs">
                <label className="text-label-sm text-on-surface dark:text-dark-on-background uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline-variant dark:text-dark-outline-variant text-[20px]"
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
                    className="w-full min-h-11 pl-xl pr-xl py-[8px] bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-lg text-on-background dark:text-dark-on-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-outline dark:placeholder:text-dark-outline text-body-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    aria-pressed={showPassword}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant hover:text-on-background dark:hover:text-dark-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between -ml-2">
                {/* min-h-11 pada label memperluas area sentuh checkbox yang secara visual kecil. */}
                <label className="flex items-center gap-sm min-h-11 px-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-outline-variant dark:border-dark-outline-variant text-primary focus:ring-primary/50 cursor-pointer"
                  />
                  <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant group-hover:text-on-background dark:group-hover:text-dark-on-background transition-colors">
                    Ingat Saya
                  </span>
                </label>
                <a
                  href="#"
                  className="inline-flex items-center min-h-11 px-2 -mr-2 text-body-sm text-primary hover:text-primary-container font-medium transition-colors hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
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
                className="w-full min-h-11 py-[10px] px-lg bg-primary text-on-primary font-medium rounded-lg shadow-sm cursor-pointer hover:brightness-110 motion-safe:hover:-translate-y-[1px] active:translate-y-0 transition-all flex items-center justify-center gap-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-body-sm"
              >
                <span>{loading ? "Memproses..." : "Masuk Sekarang"}</span>
                {!loading && <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>}
              </button>
            </form>

            <div className="mt-xs">
              <div className="relative flex items-center justify-center mb-xs">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-variant dark:border-dark-surface-variant"></div>
                </div>
                <div className="relative bg-surface-container-lowest dark:bg-dark-surface-container-lowest px-md">
                  <span className="text-label-sm text-outline dark:text-dark-outline uppercase tracking-wider">Atau masuk pakai</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-sm">
                {[
                  { name: "Google", logo: "/images/google-logo.png" },
                  { name: "Microsoft", logo: "/images/microsoft-logo.png" },
                  { name: "GitHub", logo: "/images/github-logo.png" },
                ].map((provider) => (
                  <button
                    key={provider.name}
                    type="button"
                    aria-label={`Masuk dengan ${provider.name}`}
                    className="w-9 h-9 overflow-hidden bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-lg hover:bg-surface-container-low dark:hover:bg-dark-surface-container-low hover:border-outline dark:hover:border-dark-outline transition-all"
                  >
                    <img src={provider.logo} alt={`${provider.name} logo`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-xs text-center text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
              Belum punya akun?{" "}
              <Link to="/register" className="text-primary font-medium hover:text-primary-container hover:underline underline-offset-4 transition-colors">
                Daftar Gercep
              </Link>
            </p>
          </div>
        </section>

        {/* Kolom Kanan: Visual Showcase */}
        <section className="hidden md:flex md:w-6/12 lg:w-7/12 h-full relative hero-bg overflow-hidden items-center justify-center pt-20 pb-lg px-lg lg:pb-xxl lg:px-xxl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] lg:w-[800px] lg:h-[800px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] lg:w-[600px] lg:h-[600px] bg-secondary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>

          <div className="relative w-full max-w-[280px] lg:max-w-[340px] aspect-square flex items-center justify-center z-10 drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700 ease-out">
            <img
              src="/images/login-hero.png"
              alt="Ilustrasi 3D kartu kredit finansial dengan grafik data"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="absolute bottom-lg md:bottom-xl left-lg md:left-xl right-lg md:right-xl z-20 flex flex-col sm:flex-row justify-between gap-md lg:gap-lg">
            <div className="glass-panel p-md rounded-lg flex-1">
              <div className="w-10 h-10 rounded bg-primary-container/10 flex items-center justify-center mb-sm">
                <span className="material-symbols-outlined text-primary" aria-hidden="true">security</span>
              </div>
              <h3 className="font-semibold text-on-background dark:text-dark-on-background">Super Aman</h3>
              <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Enkripsi level bank buat data lo.</p>
            </div>
            <div className="glass-panel p-md rounded-lg flex-1">
              <div className="w-10 h-10 rounded bg-secondary/10 flex items-center justify-center mb-sm">
                <span className="material-symbols-outlined text-secondary" aria-hidden="true">trending_up</span>
              </div>
              <h3 className="font-semibold text-on-background dark:text-dark-on-background">Analitik Real-time</h3>
              <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Pantau cuan nggak pake delay.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
