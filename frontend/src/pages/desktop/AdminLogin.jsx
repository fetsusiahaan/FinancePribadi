import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getMe } from "../../services/user.service";
import "./AdminLogin.css";

const CODE_PATTERN = /^\d{6}$/;

export function AdminLogin() {
  const { login, verifyTwoFactor, setupTwoFactor, confirmTwoFactorSetup, logout } = useAuth();
  const navigate = useNavigate();

  // "password" -> "2fa" (sudah terdaftar) atau "setup" (enrollment pertama kali)
  const [step, setStep] = useState("password");
  const [form, setForm] = useState({ email: "", password: "" });
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState(null);
  const [setupData, setSetupData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function afterAdminLogin() {
    // Halaman ini khusus admin — kalau ternyata bukan ADMIN, tolak walau
    // password/2FA benar (mencegah non-admin masuk lewat /admin/login).
    const me = await getMe();
    if (me.role !== "ADMIN") {
      logout();
      throw new Error("Akun ini bukan Administrator");
    }
    navigate("/admin");
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(form);
      if (data.status === "ok") {
        await afterAdminLogin();
        return;
      }
      setChallengeToken(data.challenge_token);
      if (data.status === "2fa_setup_required") {
        const setup = await setupTwoFactor(data.challenge_token);
        setSetupData(setup);
        setStep("setup");
      } else {
        setStep("2fa");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyTwoFactor(challengeToken, code);
      await afterAdminLogin();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Kode tidak valid");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSetup(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await confirmTwoFactorSetup(challengeToken, code);
      await afterAdminLogin();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Kode tidak valid");
    } finally {
      setLoading(false);
    }
  }

  function backToPassword() {
    setStep("password");
    setCode("");
    setChallengeToken(null);
    setSetupData(null);
    setError(null);
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <span className="admin-login-badge">
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
            shield_lock
          </span>
          Administrator Access
        </span>

        {step === "password" && (
          <>
            <h1>Admin Login</h1>
            <p className="subtitle">Masuk dengan akun Administrator. 2FA wajib untuk role ini.</p>

            <form onSubmit={handlePasswordSubmit}>
              <div className="admin-login-field">
                <label htmlFor="admin-email">Email</label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="off"
                  className="w-full min-h-11 px-3 py-2 rounded-lg text-body-sm bg-[#0b0f14] border border-[rgba(148,163,184,0.25)] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="admin@finetra.app"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="admin-login-field">
                <label htmlFor="admin-password">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="off"
                  className="w-full min-h-11 px-3 py-2 rounded-lg text-body-sm bg-[#0b0f14] border border-[rgba(148,163,184,0.25)] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              {error && (
                <div role="alert" className="admin-login-error">
                  <span className="material-symbols-outlined text-[16px] leading-5 shrink-0" aria-hidden="true">
                    error
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-5 min-h-11 rounded-lg font-medium text-body-sm bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>
          </>
        )}

        {step === "2fa" && (
          <>
            <h1>Kode Verifikasi</h1>
            <p className="subtitle">Masukkan kode 6 digit dari aplikasi authenticator kamu.</p>

            <form onSubmit={handleVerify}>
              <div className="admin-login-field">
                <label htmlFor="admin-2fa-code">Kode 2FA</label>
                <input
                  id="admin-2fa-code"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  autoFocus
                  className="w-full min-h-11 px-3 py-2 rounded-lg text-center tracking-[0.5em] text-body-sm bg-[#0b0f14] border border-[rgba(148,163,184,0.25)] text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>

              {error && (
                <div role="alert" className="admin-login-error">
                  <span className="material-symbols-outlined text-[16px] leading-5 shrink-0" aria-hidden="true">
                    error
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !CODE_PATTERN.test(code)}
                className="w-full mt-5 min-h-11 rounded-lg font-medium text-body-sm bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {loading ? "Memverifikasi..." : "Verifikasi"}
              </button>
            </form>

            <div className="admin-login-back">
              <button type="button" onClick={backToPassword}>
                Kembali ke login
              </button>
            </div>
          </>
        )}

        {step === "setup" && setupData && (
          <>
            <h1>Aktifkan 2FA</h1>
            <p className="subtitle">
              Pertama kali login sebagai admin — scan QR ini dengan aplikasi authenticator (Google
              Authenticator, Authy, dll), lalu masukkan kode yang muncul.
            </p>

            <div className="admin-login-qr">
              <img src={setupData.qr_code} alt="QR code untuk enrollment 2FA" />
              <span className="admin-login-secret">{setupData.secret}</span>
            </div>

            <form onSubmit={handleConfirmSetup}>
              <div className="admin-login-field">
                <label htmlFor="admin-setup-code">Kode 2FA</label>
                <input
                  id="admin-setup-code"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  className="w-full min-h-11 px-3 py-2 rounded-lg text-center tracking-[0.5em] text-body-sm bg-[#0b0f14] border border-[rgba(148,163,184,0.25)] text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>

              {error && (
                <div role="alert" className="admin-login-error">
                  <span className="material-symbols-outlined text-[16px] leading-5 shrink-0" aria-hidden="true">
                    error
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !CODE_PATTERN.test(code)}
                className="w-full mt-5 min-h-11 rounded-lg font-medium text-body-sm bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {loading ? "Mengaktifkan..." : "Aktifkan & Masuk"}
              </button>
            </form>

            <div className="admin-login-back">
              <button type="button" onClick={backToPassword}>
                Kembali ke login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
