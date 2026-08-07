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
    <div className="bg-surface-container-lowest dark:bg-dark-background text-on-background dark:text-dark-on-background antialiased h-screen overflow-hidden flex">
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-gutter py-md bg-transparent">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: '"FILL" 1' }}>
            hive
          </span>
          <span className="font-semibold text-xl text-on-background dark:text-dark-on-background tracking-tight">Finora AI</span>
        </div>
      </header>

      <main className="w-full h-full flex">
        {/* Kolom Kiri: Form Login */}
        <section className="w-full md:w-6/12 lg:w-5/12 h-full flex items-center justify-center px-gutter pt-14 pb-sm relative z-10 overflow-y-auto">
          <div className="w-full max-w-[440px] glass-panel rounded-xl p-md my-auto">
            <div className="mb-sm">
              <h1 className="text-xl md:text-2xl font-semibold text-on-background dark:text-dark-on-background mb-xs">
                Masuk Dulu, Bos!
              </h1>
              <p className="text-body-md text-on-surface-variant dark:text-dark-on-surface-variant">
                Lanjut pantau cuan dan investasi kamu hari ini.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-sm">
              <div className="space-y-sm">
                <label className="text-label-sm text-on-surface dark:text-dark-on-background uppercase tracking-wider" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline-variant dark:text-dark-outline-variant">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="contoh@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-xl pr-md py-[12px] bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-lg text-on-background dark:text-dark-on-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-outline dark:placeholder:text-dark-outline"
                  />
                </div>
              </div>

              <div className="space-y-sm">
                <label className="text-label-sm text-on-surface dark:text-dark-on-background uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline-variant dark:text-dark-outline-variant">
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-xl pr-md py-[12px] bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-lg text-on-background dark:text-dark-on-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-outline dark:placeholder:text-dark-outline"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-md top-1/2 -translate-y-1/2 text-outline-variant dark:text-dark-outline-variant hover:text-on-surface dark:hover:text-dark-on-background transition-colors focus:outline-none"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-sm cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-outline-variant dark:border-dark-outline-variant text-primary focus:ring-primary/50 cursor-pointer" />
                  <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant group-hover:text-on-background dark:group-hover:text-dark-on-background transition-colors">
                    Remember Me
                  </span>
                </label>
                <a href="#" className="text-body-sm text-primary hover:text-primary-container font-medium transition-colors hover:underline underline-offset-4">
                  Lupa Password?
                </a>
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-[14px] px-lg bg-primary text-on-primary font-medium rounded-lg shadow-sm hover:brightness-110 hover:-translate-y-[1px] active:translate-y-0 transition-all flex items-center justify-center gap-sm disabled:opacity-50"
              >
                <span>{loading ? "Memproses..." : "Masuk Sekarang"}</span>
                {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
              </button>
            </form>

            <div className="mt-md">
              <div className="relative flex items-center justify-center mb-sm">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-variant dark:border-dark-surface-variant"></div>
                </div>
                <div className="relative bg-surface-container-lowest dark:bg-dark-surface-container-lowest px-md">
                  <span className="text-label-sm text-outline dark:text-dark-outline uppercase tracking-wider">Atau masuk pakai</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-md">
                {["Google", "Microsoft", "GitHub"].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    className="flex items-center justify-center py-[10px] px-sm bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-lg hover:bg-surface-container-low dark:hover:bg-dark-surface-container-low hover:border-outline dark:hover:border-dark-outline transition-all group"
                  >
                    <span className="text-body-sm font-medium text-on-surface dark:text-dark-on-background group-hover:text-primary transition-colors">
                      {provider}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-md text-center text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
              Belum punya akun?{" "}
              <Link to="/register" className="text-primary font-medium hover:text-primary-container hover:underline underline-offset-4 transition-colors">
                Daftar Gercep
              </Link>
            </p>
          </div>
        </section>

        {/* Kolom Kanan: Visual Showcase */}
        <section className="hidden md:flex md:w-6/12 lg:w-7/12 h-full relative hero-bg overflow-hidden items-center justify-center p-lg lg:p-xxl">
          <div className="absolute top-xl right-xl z-20">
            <ThemeToggle />
          </div>

          <div className="absolute top-0 right-0 w-[500px] h-[500px] lg:w-[800px] lg:h-[800px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] lg:w-[600px] lg:h-[600px] bg-secondary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>

          <div className="relative w-full max-w-[420px] lg:max-w-[520px] aspect-square flex items-center justify-center z-10 drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700 ease-out">
            <img
              src="https://lh3.googleusercontent.com/aida/AP1WRLu5t7AGEzotIm7YeebXBdHSd8fppXRnT5LLdQC-7fiepJQ0QZsmPdOtBhGKKVzyld68JpUnHBE3tgOkxgKxyRok7TwPkVgRe0wGca2U8bs83KURkVv_ljS7O6caTeht7eBLlxadv6GOK_L7819viJe4xheTBJim0lFgw-aVosMAkSEUDgIhSRu8d_a7nlyzCQOj55ig608kDcdxp8t6c_x0HhAVvRoa7f3c8ltv4-20BNryzY5ztFQgOPQ"
              alt="Ilustrasi 3D kartu kredit finansial dengan grafik data"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="absolute bottom-lg md:bottom-xl left-lg md:left-xl right-lg md:right-xl z-20 flex flex-col sm:flex-row justify-between gap-md lg:gap-lg">
            <div className="glass-panel p-md rounded-lg flex-1">
              <div className="w-10 h-10 rounded bg-primary-container/10 flex items-center justify-center mb-sm">
                <span className="material-symbols-outlined text-primary">security</span>
              </div>
              <h3 className="font-semibold text-on-background dark:text-dark-on-background">Super Aman</h3>
              <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Enkripsi level bank buat data lo.</p>
            </div>
            <div className="glass-panel p-md rounded-lg flex-1">
              <div className="w-10 h-10 rounded bg-secondary/10 flex items-center justify-center mb-sm">
                <span className="material-symbols-outlined text-secondary">trending_up</span>
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
