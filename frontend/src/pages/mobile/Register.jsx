import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import "./Login.css";

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
    <div className="finora-login-mobile">
      <header className="ml-header">
        <div className="ml-brand">
          <img src="/images/logo.webp" alt="Finetra AI Logo" className="ml-brand-logo-img" />
          <span>Finetra AI</span>
        </div>
        <ThemeToggle className="!border-white/40 !text-white hover:!bg-white/10" />
      </header>

      <section className="ml-hero">
        <div className="ml-illustration">
          <span className="m-chart-bars" aria-hidden="true">
            <span></span><span></span><span></span><span></span>
          </span>
          <span className="m-trend" aria-hidden="true"></span>
          <span className="m-card" aria-hidden="true">
            <small>FINANCE</small>
            <strong>Rp 12.8M</strong>
          </span>
          <span className="m-dots" aria-hidden="true">•••</span>
        </div>
        <h2>Kelola Finansialmu Lebih Cerdas</h2>
        <p>Pantau cuan, atur budget, dan lihat analitik real-time.</p>
      </section>

      <main className="ml-form-panel">
        <div className="ml-form">
          <h1>Daftar Gercep! ⚡</h1>
          <p className="ml-subtitle">Bikin akun Finetra AI kamu sekarang. Cuma butuh 2 menit kok.</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="name">NAMA LENGKAP</label>
            <div className="ml-input-wrapper">
              <span className="material-symbols-outlined ml-input-icon" aria-hidden="true">
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
              />
            </div>

            <label htmlFor="email">ALAMAT EMAIL</label>
            <div className="ml-input-wrapper">
              <span className="material-symbols-outlined ml-input-icon" aria-hidden="true">
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
              />
            </div>

            <label htmlFor="password">PASSWORD</label>
            <div className="ml-input-wrapper">
              <span className="material-symbols-outlined ml-input-icon" aria-hidden="true">
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
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                aria-pressed={showPassword}
                className="ml-password-toggle"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  {showPassword ? "visibility" : "visibility_off"}
                </span>
              </button>
            </div>

            {form.password && (
              <div className="ml-password-strength">
                <div className="ml-strength-bars" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`ml-strength-bar ${
                        i < strength.score
                          ? strength.score <= 1
                            ? "bar-weak"
                            : strength.score === 2
                            ? "bar-medium"
                            : "bar-strong"
                          : ""
                      }`}
                    />
                  ))}
                </div>
                <span aria-live="polite" className="ml-strength-label">
                  {strength.label}
                </span>
              </div>
            )}

            <label htmlFor="confirmPassword">KONFIRMASI PASSWORD</label>
            <div className="ml-input-wrapper">
              <span className="material-symbols-outlined ml-input-icon" aria-hidden="true">
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
              />
            </div>

            {error && (
              <div role="alert" className="ml-error-alert">
                <span className="material-symbols-outlined text-[16px] leading-5 shrink-0" aria-hidden="true">
                  error
                </span>
                <span>{error}</span>
              </div>
            )}

            <button className="ml-login-button" type="submit" disabled={loading}>
              <span>{loading ? "Memproses..." : "Buat Akun"}</span>
            </button>
          </form>

          <div className="ml-divider">
            <span></span>
            <em>ATAU DAFTAR PAKAI</em>
            <span></span>
          </div>

          <div className="ml-social-login">
            {SOCIAL_PROVIDERS.map((provider) => (
              <button key={provider.name} type="button" aria-label={`Daftar dengan ${provider.name}`}>
                <img src={provider.logo} alt={`${provider.name} logo`} className="w-5 h-5 object-contain" />
              </button>
            ))}
          </div>

          <p className="ml-register-text">
            Udah punya akun? <Link to="/login">Login aja</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
