import { useState } from "react";

interface Usuario {
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
}

interface AuthPageProps {
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
  onComplete: (user: Usuario) => void | Promise<void>;
  onBack: () => void;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function submitRequest(path: string, body: object) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    usuario?: Usuario;
    message?: string | string[];
  };
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(" ")
      : payload.message;
    throw new Error(message || "No se pudo completar la solicitud.");
  }
  return payload;
}

function AuthPage({ mode, onModeChange, onComplete, onBack }: AuthPageProps) {
  const [documentType, setDocumentType] = useState("CC");
  const [identification, setIdentification] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (isRegister && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await submitRequest("/auth/registro", {
          identificacion: identification.trim(),
          tipoDoc: documentType,
          nombres: firstName.trim(),
          apellidos: lastName.trim(),
          correo: email.trim(),
          fechaNacimiento: birthDate,
          contrasena: password,
        });
      }
      const session = await submitRequest("/auth/login", {
        correo: email.trim(),
        contrasena: password,
      });
      if (!session.usuario) {
        throw new Error("El servidor no devolvió la información de la cuenta.");
      }
      await onComplete(session.usuario);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo conectar con el servidor.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <header className="auth-header">
        <button className="brand" type="button" onClick={onBack}>
          <span className="brand-mark">✦</span>
          <span>Turis<span>Match</span></span>
        </button>
      </header>
      <section className="auth-card" aria-labelledby="auth-title">
        <button className="auth-back" type="button" onClick={onBack}>← Volver a explorar</button>
        <div className="auth-heading">
          <span className="auth-emblem">✦</span>
          <h1 id="auth-title">{isRegister ? "Crear cuenta" : "Qué bueno verte"}</h1>
          <p>
            {isRegister
              ? "Ingresa tus datos para registrarte en TurisMatch"
              : "Inicia sesión y sigue planeando tu próxima aventura"}
          </p>
        </div>
        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
          {isRegister ? (
            <>
              <label>
                Tipo de documento
                <select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
                  <option value="CC">Cédula de ciudadanía</option>
                  <option value="CE">Cédula de extranjería</option>
                  <option value="TI">Tarjeta de identidad</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="OTRO">Otro</option>
                </select>
              </label>
              <label>
                Número de identificación
                <input
                  autoComplete="off"
                  required
                  value={identification}
                  onChange={(event) => setIdentification(event.target.value)}
                  placeholder="Número de documento"
                  maxLength={30}
                />
              </label>
              <div className="auth-name-row">
                <label>
                  Nombres
                  <input required value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Nombres" maxLength={100} />
                </label>
                <label>
                  Apellidos
                  <input required value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Apellidos" maxLength={100} />
                </label>
              </div>
            </>
          ) : null}
          <label>
            Correo electrónico
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </label>
          {isRegister && (
            <label>
              Fecha de nacimiento
              <input required type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
            </label>
          )}
          <label>
            Contraseña
            <input
              required
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </label>
          {isRegister && (
            <>
              <p className="password-hint">Incluye al menos una letra y un número.</p>
              <label>
                Confirmar contraseña
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repite tu contraseña"
                />
              </label>
            </>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Un momento..." : isRegister ? "Registrarme" : "Iniciar sesión"}
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? "¿Ya tienes una cuenta?" : "¿Todavía no tienes cuenta?"}{" "}
          <button type="button" onClick={() => onModeChange(isRegister ? "login" : "register")}>
            {isRegister ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default AuthPage;
