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
    <div className="finora-login">
      <header className="finora-header">
        <div className="header-left-panel">
          <div className="header-brand-box">
            <div className="finora-brand">
              <img src="/images/logo.webp" alt="Finora AI Logo" className="brand-logo-img" />
              <span>Finora AI</span>
            </div>
          </div>
        </div>
        <div className="header-right-panel">
          <ThemeToggle />
        </div>
      </header>

      <main className="login-layout">
        <section className="login-form-panel">
          <div className="login-form">
            <h1>Masuk Dulu, Bos!</h1>
            <p className="subtitle">
              Lanjut pantau cuan dan investasi kamu hari ini.
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="email">ALAMAT EMAIL</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon" aria-hidden="true">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="contoh@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <label htmlFor="password">PASSWORD</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon" aria-hidden="true">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="off"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={showPassword}
                  className="password-toggle"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>

              <div className="form-options">
                <label className="remember">
                  <input type="checkbox" />
                  <span>Ingat Saya</span>
                </label>
                <a href="#forgot">Lupa Password?</a>
              </div>

              {error && (
                <div role="alert" className="error-alert">
                  <span className="material-symbols-outlined text-[16px] leading-5 shrink-0" aria-hidden="true">
                    error
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <button className="login-button" type="submit" disabled={loading}>
                <span>{loading ? "Memproses..." : "Masuk Sekarang"}</span>
                {!loading && (
                  <span className="material-symbols-outlined arrow" aria-hidden="true">
                    arrow_forward
                  </span>
                )}
              </button>
            </form>

            <div className="divider">
              <span></span>
              <em>ATAU MASUK PAKAI</em>
              <span></span>
            </div>

            <div className="social-login">
              {SOCIAL_PROVIDERS.map((provider) => (
                <button
                  key={provider.name}
                  type="button"
                  aria-label={`Masuk dengan ${provider.name}`}
                >
                  <img
                    src={provider.logo}
                    alt={`${provider.name} logo`}
                    className="w-5 h-5 object-contain"
                  />
                </button>
              ))}
            </div>

            <p className="register-text">
              Belum punya akun? <Link to="/register">Daftar Gercep</Link>
            </p>
          </div>
        </section>

        <section className="finance-panel">
          <div className="finance-glow finance-glow-one"></div>
          <div className="finance-glow finance-glow-two"></div>

          <div className="finance-content">
            <div className="finance-illustration">
              <img
                src="/images/login-hero.png"
                alt="Finora AI Showcase"
                className="w-full h-full object-cover"
              />
            </div>

            <h2>Kelola Finansialmu Lebih Cerdas</h2>
            <p>
              Satu aplikasi buat pantau cuan, atur budget,
              <br />
              dan lihat analitik real-time.
            </p>

            <div className="feature-grid">
              <article className="feature-card">
                <span className="material-symbols-outlined feature-icon" aria-hidden="true">
                  security
                </span>
                <div>
                  <strong>Super Aman</strong>
                  <span>Enkripsi level bank.</span>
                </div>
              </article>

              <article className="feature-card">
                <span className="material-symbols-outlined feature-icon" aria-hidden="true">
                  trending_up
                </span>
                <div>
                  <strong>Analitik Real-time</strong>
                  <span>Nggak pake delay.</span>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
