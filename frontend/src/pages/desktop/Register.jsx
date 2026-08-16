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
    <div className="bg-surface-container-lowest dark:bg-dark-background text-on-background dark:text-dark-on-background antialiased h-dvh overflow-hidden flex">
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-gutter py-md bg-surface-container-lowest dark:bg-dark-surface-container-lowest shadow-sm">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: '"FILL" 1' }}>
            hive
          </span>
          <span className="font-semibold text-xl text-on-background dark:text-dark-on-background tracking-tight">Finora AI</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="w-full h-full flex">
        {/* Kolom Kiri: Form Register */}
        <section className="w-full md:w-6/12 lg:w-5/12 h-full flex items-center justify-center px-gutter pt-14 pb-xs relative z-10 overflow-y-auto">
          <div className="w-full max-w-[440px] glass-panel rounded-xl p-sm my-auto">
            <div className="mb-xs">
              <h1 className="text-lg md:text-xl font-semibold text-on-background dark:text-dark-on-background mb-xs">
                Daftar Gercep! ⚡
              </h1>
              <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
                Bikin akun Finora AI kamu sekarang. Cuma butuh 2 menit kok.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-xs">
              <div className="space-y-xs">
                <label className="text-label-sm text-on-surface dark:text-dark-on-background uppercase tracking-wider" htmlFor="name">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline-variant dark:text-dark-outline-variant text-[20px]">
                    person
                  </span>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Nama lu"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-xl pr-md py-[6px] bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-lg text-on-background dark:text-dark-on-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-outline dark:placeholder:text-dark-outline text-body-sm"
                  />
                </div>
              </div>

              <div className="space-y-xs">
                <label className="text-label-sm text-on-surface dark:text-dark-on-background uppercase tracking-wider" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline-variant dark:text-dark-outline-variant text-[20px]">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="budi@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-xl pr-md py-[6px] bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-lg text-on-background dark:text-dark-on-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-outline dark:placeholder:text-dark-outline text-body-sm"
                  />
                </div>
              </div>

              <div className="space-y-xs">
                <label className="text-label-sm text-on-surface dark:text-dark-on-background uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline-variant dark:text-dark-outline-variant text-[20px]">
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
                    className="w-full pl-xl pr-xl py-[6px] bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-lg text-on-background dark:text-dark-on-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-outline dark:placeholder:text-dark-outline text-body-sm"
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
                {form.password && (
                  <div className="flex items-center gap-xs">
                    <div className="flex-1 flex gap-xs" aria-hidden="true">
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

              <div className="space-y-xs">
                <label className="text-label-sm text-on-surface dark:text-dark-on-background uppercase tracking-wider" htmlFor="confirmPassword">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline-variant dark:text-dark-outline-variant text-[20px]">
                    lock_reset
                  </span>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    placeholder="Samain kayak di atas"
                    value={form.confirmPassword}
                    autoComplete="new-password"
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full pl-xl pr-md py-[6px] bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-lg text-on-background dark:text-dark-on-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-outline dark:placeholder:text-dark-outline text-body-sm"
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
                className="w-full min-h-11 py-[8px] px-lg bg-primary text-on-primary font-medium rounded-lg shadow-sm cursor-pointer hover:brightness-110 motion-safe:hover:-translate-y-[1px] active:translate-y-0 transition-all flex items-center justify-center gap-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-body-sm"
              >
                <span>{loading ? "Memproses..." : "Buat Akun"}</span>
              </button>
            </form>

            <div className="mt-xs">
              <div className="relative flex items-center justify-center mb-xs">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-variant dark:border-dark-surface-variant"></div>
                </div>
                <div className="relative bg-surface-container-lowest dark:bg-dark-surface-container-lowest px-md">
                  <span className="text-label-sm text-outline dark:text-dark-outline uppercase tracking-wider">Atau daftar pake</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-sm">
                {SOCIAL_PROVIDERS.map((provider) => (
                  <button
                    key={provider.name}
                    type="button"
                    aria-label={`Daftar dengan ${provider.name}`}
                    className="w-9 h-9 overflow-hidden bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-lg hover:bg-surface-container-low dark:hover:bg-dark-surface-container-low hover:border-outline dark:hover:border-dark-outline transition-all"
                  >
                    <img src={provider.logo} alt={`${provider.name} logo`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-xs text-center text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
              Udah punya akun?{" "}
              <Link to="/login" className="text-primary font-medium hover:text-primary-container hover:underline underline-offset-4 transition-colors">
                Login aja
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

          <div className="absolute bottom-lg md:bottom-xl right-lg md:right-xl z-20 glass-panel p-md rounded-lg">
            <h3 className="font-semibold text-on-background dark:text-dark-on-background">Finora AI</h3>
            <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Empowering your future.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
