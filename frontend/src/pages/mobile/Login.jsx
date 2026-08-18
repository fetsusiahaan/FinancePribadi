import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import "./Login.css";

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
    <div className="finora-login-mobile">
      <header className="ml-header">
        <div className="ml-brand">
          <img src="/images/logo.webp" alt="Finora AI Logo" className="ml-brand-logo-img" />
          <span>Finora AI</span>
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
          <h1>Masuk Dulu, Bos!</h1>
          <p className="ml-subtitle">Lanjut pantau cuan dan investasi kamu hari ini.</p>

          <form onSubmit={handleSubmit}>
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
                placeholder="bos@example.com"
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
                autoComplete="current-password"
                placeholder="••••••••"
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

            <div className="ml-form-options">
              <label className="ml-remember">
                <input type="checkbox" />
                <span>Ingat Saya</span>
              </label>
              <a href="#forgot">Lupa Password?</a>
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
              <span>{loading ? "Memproses..." : "Masuk Sekarang"}</span>
              {!loading && (
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  arrow_forward
                </span>
              )}
            </button>
          </form>

          <div className="ml-divider">
            <span></span>
            <em>ATAU MASUK PAKAI</em>
            <span></span>
          </div>

          <div className="ml-social-login">
            {SOCIAL_PROVIDERS.map((provider) => (
              <button key={provider.name} type="button" aria-label={`Masuk dengan ${provider.name}`}>
                <img src={provider.logo} alt={`${provider.name} logo`} className="w-5 h-5 object-contain" />
              </button>
            ))}
          </div>

          <p className="ml-register-text">
            Belum punya akun? <Link to="/register">Daftar Gercep</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
