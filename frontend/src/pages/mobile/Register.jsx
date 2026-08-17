import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "../../components/ui/ThemeToggle";

const SOCIAL_PROVIDERS = [
  { name: "Google", logo: "/images/google-logo.png" },
  { name: "Microsoft", logo: "/images/microsoft-logo.png" },
  { name: "GitHub", logo: "/images/github-logo.png" },
];

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Lemah banget nih", "Lemah banget nih", "Lumayan", "Kuat", "Kuat banget"];
  return { score, label: labels[score] };
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi password tidak sama");
      return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest dark:bg-dark-background text-on-background dark:text-dark-on-background antialiased min-h-dvh flex flex-col items-center">
      {/* Header transparan di atas gambar hero — konsisten dgn mobile/Login.jsx. */}
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

      {/* Hero full-bleed, konsisten dgn mobile/Login.jsx. Di 640-767px (tablet
          kecil/phablet, masih dapat versi mobile ini) rasio dibuat lebih landscape
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
          <h2 className="text-lg font-semibold text-on-background dark:text-dark-on-background mb-xs">Daftar Gercep! ⚡</h2>
          <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
            Bikin akun Finora AI kamu sekarang. Cuma butuh 2 menit kok.
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-dark-surface-container-lowest rounded-xl border border-outline-variant/40 dark:border-dark-outline-variant/40 shadow-sm p-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-xs">
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="name">
                Nama Lengkap
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-dark-outline"
                  aria-hidden="true"
                >
                  person
                </span>
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Nama lu"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full min-h-11 bg-surface-container-lowest dark:bg-dark-surface-container-lowest pl-10 pr-4 py-2 rounded-lg border border-outline-variant/50 dark:border-dark-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-base text-on-surface dark:text-dark-on-background placeholder:text-outline-variant dark:placeholder:text-dark-outline-variant"
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="email">
                Email
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
                  placeholder="budi@example.com"
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
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter ya"
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
              {form.password && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < strength.score
                            ? strength.score <= 1
                              ? "bg-danger dark:bg-dark-danger"
                              : strength.score === 2
                              ? "bg-warning dark:bg-dark-warning"
                              : "bg-success dark:bg-dark-success"
                            : "bg-surface-variant dark:bg-dark-surface-variant"
                        }`}
                      />
                    ))}
                  </div>
                  {/* Label teks membawa arti kekuatan, jadi tidak bergantung warna bar. */}
                  <span
                    aria-live="polite"
                    className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant whitespace-nowrap"
                  >
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-xs">
              <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="confirmPassword">
                Konfirmasi Password
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-dark-outline"
                  aria-hidden="true"
                >
                  lock_reset
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Samain kayak di atas"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full min-h-11 bg-surface-container-lowest dark:bg-dark-surface-container-lowest pl-10 pr-4 py-2 rounded-lg border border-outline-variant/50 dark:border-dark-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-base text-on-surface dark:text-dark-on-background"
                />
              </div>
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
              {loading ? "Memproses..." : "Buat Akun"}
            </button>
          </form>
        </div>

        <div className="flex items-center gap-3 my-xs">
          <div className="flex-1 h-px bg-outline-variant/40 dark:bg-dark-outline-variant/40"></div>
          <span className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-wider">
            Atau daftar pake
          </span>
          <div className="flex-1 h-px bg-outline-variant/40 dark:bg-dark-outline-variant/40"></div>
        </div>

        <div className="flex justify-center gap-3 mb-xs">
          {SOCIAL_PROVIDERS.map((provider) => (
            <button
              key={provider.name}
              type="button"
              aria-label={`Daftar dengan ${provider.name}`}
              className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant/50 dark:border-dark-outline-variant/50 hover:bg-surface-container-low dark:hover:bg-dark-surface-container-low transition-colors shadow-sm"
            >
              <img src={provider.logo} alt={`${provider.name} logo`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="text-center flex justify-center gap-1">
          <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Udah punya akun?</span>
          <Link to="/login" className="text-body-sm font-semibold text-primary hover:underline">
            Login aja
          </Link>
        </div>
      </main>
    </div>
  );
}
