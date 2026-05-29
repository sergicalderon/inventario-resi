import { Lock, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export const AuthScreen = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setMessage(mode === "signup" ? "Usuario creado. Si Supabase pide confirmación, revisa el email." : "");
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-heading">
          <span className="brand-mark">IR</span>
          <div>
            <h1>Inventario Resi</h1>
            <p>Acceso online protegido con Supabase.</p>
          </div>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Contraseña<input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {message && <p className="form-message">{message}</p>}
          <button className="primary" disabled={busy}>
            {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
            {busy ? "Procesando..." : mode === "login" ? "Entrar" : "Crear usuario"}
          </button>
          <button type="button" className="secondary" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            <Lock size={18} />
            {mode === "login" ? "Crear primera cuenta" : "Ya tengo cuenta"}
          </button>
        </form>
      </section>
    </main>
  );
};
