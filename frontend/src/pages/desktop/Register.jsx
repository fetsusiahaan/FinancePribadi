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
            <h1>Daftar Gercep! ⚡</h1>
            <p className="subtitle">
              Bikin akun Finora AI kamu sekarang. Cuma butuh 2 menit kok.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-row-2">
                <div>
                  <label htmlFor="name">NAMA LENGKAP</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon" aria-hidden="true">
                      person
                    </span>
                    <input
                      id="name"
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Nama lu"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
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
                </div>
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
                  minLength={8}
                  autoComplete="off"
                  placeholder="Minimal 8 karakter ya"
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

              {form.password && (
                <div className="password-strength">
                  <div className="strength-bars" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`strength-bar ${
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
                  <span aria-live="polite" className="strength-label">
                    {strength.label}
                  </span>
                </div>
              )}

              <label htmlFor="confirmPassword">KONFIRMASI PASSWORD</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon" aria-hidden="true">
                  lock_reset
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Samain kayak di atas"
                  value={form.confirmPassword}
                  autoComplete="off"
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
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
                <span>{loading ? "Memproses..." : "Buat Akun"}</span>
                {!loading && (
                  <span className="material-symbols-outlined arrow" aria-hidden="true">
                    arrow_forward
                  </span>
                )}
              </button>
            </form>

            <div className="divider">
              <span></span>
              <em>ATAU DAFTAR PAKAI</em>
              <span></span>
            </div>

            <div className="social-login">
              {SOCIAL_PROVIDERS.map((provider) => (
                <button
                  key={provider.name}
                  type="button"
                  aria-label={`Daftar dengan ${provider.name}`}
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
              Udah punya akun? <Link to="/login">Login aja</Link>
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
