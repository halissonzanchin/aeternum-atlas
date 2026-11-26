/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import { useEffect, useState } from "react";
import AuthExperienceShell from "../../components/AuthExperienceShell/AuthExperienceShell";
import LanguageSelector from "../../components/LanguageSelector";
import LineIcon from "../../components/icons/LineIcon";
import { A26Button, A26Card, A26Field, A26IconButton } from "../../components/aeternum-26";
import { getRedirectPathForUser, loginUser, requestPasswordRecovery, updateCurrentUserPassword } from "../../services/auth/authService";
import { validateLogin } from "../../utils/validators";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { getRecoveryContextUserId, isPasswordRecoveryContextValid, markRecoveryContextConsumed, supabase } from "../../lib/supabase";

export default function Login({ navigate, onAuth }) {
  const { t } = useLanguage();
  const { toggleTheme, isLight } = useTheme();
  const [values, setValues] = useState({ email: "", password: "" });
  const [resetValues, setResetValues] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetChecking, setResetChecking] = useState(false);
  const [resetSessionValid, setResetSessionValid] = useState(false);
  const [resetSessionError, setResetSessionError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isResetModeIntent = typeof window !== "undefined"
    ? (() => {
        const search = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        return search.get("mode") === "reset-password" || hash.get("type") === "recovery" || hash.has("access_token");
      })()
    : false;

  useEffect(() => {
    if (!isResetModeIntent) {
      setResetChecking(false);
      setResetSessionValid(false);
      setResetSessionError("");
      markRecoveryContextConsumed();
      return;
    }

    if (isPasswordRecoveryContextValid()) {
      setResetSessionValid(true);
      setResetSessionError("");
      setResetChecking(false);
      return;
    }

    setResetChecking(true);
    setResetSessionError("");

    const hashStr = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const hashParams = new URLSearchParams(hashStr);
    const hashError = hashParams.get("error");
    const hashErrorCode = hashParams.get("error_code");
    const hashErrorDesc = hashParams.get("error_description");

    // 1. Error detected in hash from Supabase redirect
    if (hashError || hashErrorCode) {
      setResetChecking(false);
      setResetSessionValid(false);
      setResetSessionError(
        hashErrorCode === "otp_expired"
          ? "O link de recuperação expirou ou já foi utilizado. Solicite um novo link de redefinição."
          : (hashErrorDesc ? decodeURIComponent(hashErrorDesc).replace(/\+/g, " ") : "O link de recuperação é inválido ou expirou.")
      );
      return;
    }

    // 2. Direct access without recovery token in hash: fail-closed immediately (rejects artificial #type=recovery)
    if (!hashParams.has("access_token")) {
      setResetChecking(false);
      setResetSessionValid(false);
      setResetSessionError("Sessão de recuperação ausente ou link expirado. Solicite um novo link para redefinir sua senha.");
      return;
    }

    if (!supabase) {
      setResetChecking(false);
      setResetSessionValid(false);
      setResetSessionError("Serviço de autenticação temporariamente indisponível.");
      return;
    }

    let isMounted = true;

    // 3. Listen specifically for PASSWORD_RECOVERY event from Supabase Auth
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setResetSessionValid(true);
        setResetSessionError("");
        setResetChecking(false);
      }
    });

    // 4. Query current session if already processed by GoTrue
    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (isPasswordRecoveryContextValid()) {
        setResetSessionValid(true);
        setResetSessionError("");
        setResetChecking(false);
        return;
      }

      if (error) {
        setResetSessionValid(false);
        setResetSessionError(error.message || "Sessão de recuperação inválida ou expirada.");
        setResetChecking(false);
      } else if (!data?.session) {
        setResetSessionValid(false);
        setResetSessionError("Sessão de recuperação ausente ou link expirado. Solicite um novo link para redefinir sua senha.");
        setResetChecking(false);
      }
    }).catch(err => {
      if (!isMounted) return;
      if (isPasswordRecoveryContextValid()) return;
      setResetSessionValid(false);
      setResetSessionError(err?.message || "Erro ao verificar integridade da sessão.");
      setResetChecking(false);
    });

    // 5. Fallback safety timeout (2.5 seconds max)
    const timer = setTimeout(() => {
      if (!isMounted) return;
      if (!isPasswordRecoveryContextValid()) {
        setResetSessionValid(false);
        setResetSessionError("Tempo limite esgotado para validar o link de recuperação. Solicite um novo link.");
        setResetChecking(false);
      }
    }, 2500);

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
      clearTimeout(timer);
    };
  }, [isResetModeIntent]);

  const redirectTarget = typeof window !== "undefined"
    ? (() => {
        const target = new URLSearchParams(window.location.search).get("redirect");
        return (target && target.startsWith("/") && !target.startsWith("//") && !target.startsWith("/login")) ? target : null;
      })()
    : null;

  function update(event) {
    const { name, value } = event.target;
    setValues(current => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    setRecoveryStatus(null);
    try {
      const user = await loginUser(values.email, values.password);
      onAuth(user);
      navigate(redirectTarget || getRedirectPathForUser(user));
    } catch (error) {
      setMessage(error.message || t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (loading || recoveryLoading) return;
    setMessage("");
    setRecoveryStatus(null);
    const email = values.email?.trim();
    if (!email) {
      setErrors(prev => ({ ...prev, email: t("auth.enterEmailForRecovery") }));
      setMessage(t("auth.enterEmailForRecovery"));
      return;
    }

    setRecoveryLoading(true);
    try {
      await requestPasswordRecovery(email);
      setRecoveryStatus({
        type: "success",
        text: t("auth.recoveryEmailSent")
      });
    } catch (error) {
      setRecoveryStatus({
        type: "error",
        text: error.message || t("auth.recoveryFailed")
      });
    } finally {
      setRecoveryLoading(false);
    }
  }

  function updateReset(event) {
    const { name, value } = event.target;
    setResetValues(current => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }

  async function submitResetPassword(event) {
    event.preventDefault();
    if (resetLoading) return;
    setMessage("");

    if (!resetValues.password || resetValues.password.length < 8) {
      setErrors({ password: "A nova senha deve ter pelo menos 8 caracteres." });
      return;
    }
    if (resetValues.password !== resetValues.confirmPassword) {
      setErrors({ confirmPassword: "As senhas não coincidem." });
      return;
    }

    // ADM-01: Revalidação estrita da sessão de recuperação no momento da redefinição
    if (!isPasswordRecoveryContextValid()) {
      setMessage("Contexto de recuperação ausente ou expirado. Solicite um novo link de redefinição.");
      return;
    }

    if (!supabase) {
      setMessage("Serviço de autenticação temporariamente indisponível.");
      return;
    }

    setResetLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user || userData.user.id !== getRecoveryContextUserId()) {
        throw new Error("Identidade de recuperação inválida ou expirada. Solicite um novo link.");
      }

      await updateCurrentUserPassword(resetValues.password);

      // ADM-02: Revogação global de todas as sessões anteriores para a identidade recuperada
      const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
      if (signOutError) {
        console.warn("Aviso ao revogar sessões pós-redefinição:", signOutError.message);
      }

      markRecoveryContextConsumed();
      setResetSuccess(true);
      setMessage("");
    } catch (err) {
      setMessage(err.message || t("auth.passwordUpdateError") || "Não foi possível atualizar a senha.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <AuthExperienceShell>
      <A26Card
        material="regular"
        tone="teal"
        interactive
        className="atlas-auth-card atlas-auth-card--login"
        data-testid="a26-login"
      >
        <div className="atlas-auth-card__topline">
          <span>{t("auth.secureAccess")}</span>
          <div className="atlas-auth-card__topline-actions flex items-center gap-2">
            <A26IconButton
              label={isLight ? "Alternar para Dark Liquid Glass (Modo Escuro)" : "Alternar para Light Liquid Glass (Modo Claro)"}
              icon={isLight ? "moon" : "sun"}
              className="atlas-auth-theme-toggle"
              aria-label={isLight ? "Alternar para Dark Liquid Glass (Modo Escuro)" : "Alternar para Light Liquid Glass (Modo Claro)"}
              onClick={toggleTheme}
            />
            <LanguageSelector compact />
          </div>
        </div>
        {isResetModeIntent ? (
          <>
            <p className="eyebrow mt-8">Recuperação Institucional</p>
            {resetChecking ? (
              <>
                <h1 className="display-title">Validando Link...</h1>
                <p className="mt-4 max-w-md text-textMuted">
                  Verificando a integridade da sessão de recuperação com segurança...
                </p>
                <div className="atlas-auth-form mt-6 flex justify-center py-6">
                  <p className="a26-auth-message" role="status">Validando credenciais temporárias...</p>
                </div>
              </>
            ) : !resetSessionValid ? (
              <>
                <h1 className="display-title">Link Inválido ou Expirado</h1>
                <p className="mt-4 max-w-md text-textMuted">
                  Não foi possível validar sua sessão de recuperação de senha com segurança.
                </p>
                <div className="atlas-auth-form mt-6">
                  <p className="a26-auth-message is-error" role="alert" data-testid="recovery-session-error">
                    {resetSessionError || "Sessão de recuperação ausente, inválida ou expirada. Solicite um novo link de redefinição."}
                  </p>
                  <A26Button
                    className="atlas-auth-submit mt-4"
                    variant="liquid"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.history.replaceState({}, document.title, "/login");
                      }
                      navigate("/login");
                    }}
                  >
                    Solicitar Novo Link de Recuperação
                  </A26Button>
                </div>
              </>
            ) : resetSuccess ? (
              <>
                <h1 className="display-title">Senha Redefinida</h1>
                <div className="atlas-auth-form mt-6">
                  <p className="a26-auth-message is-success" role="alert">
                    Senha redefinida com sucesso! Você já pode entrar com sua nova credencial.
                  </p>
                  <A26Button
                    className="atlas-auth-submit mt-4"
                    variant="liquid"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.history.replaceState({}, document.title, "/login");
                      }
                      navigate("/login");
                    }}
                  >
                    Ir para o Login
                  </A26Button>
                </div>
              </>
            ) : (
              <>
                <h1 className="display-title">Definir Nova Senha</h1>
                <p className="mt-4 max-w-md text-textMuted">
                  Defina uma nova senha segura para restaurar o acesso à sua conta.
                </p>
                <form className="atlas-auth-form" onSubmit={submitResetPassword} noValidate>
                  <label className="a26-field atlas-auth-password">
                    <span className="a26-field__label">Nova Senha</span>
                    <input
                      className="a26-field__control"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={resetValues.password}
                      onChange={updateReset}
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.password)}
                    />
                    <button
                      type="button"
                      className="atlas-auth-password__toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-pressed={showPassword}
                      aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                    >
                      <LineIcon name={showPassword ? "eye-off" : "eye"} className="h-4 w-4" />
                      <span className="sr-only">{showPassword ? t("auth.hidePassword") : t("auth.showPassword")}</span>
                    </button>
                    {errors.password ? <small className="a26-field__error" role="alert">{errors.password}</small> : null}
                  </label>
                  <label className="a26-field atlas-auth-password">
                    <span className="a26-field__label">{t("auth.confirmPassword") || "Confirmar senha"}</span>
                    <input
                      className="a26-field__control"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={resetValues.confirmPassword}
                      onChange={updateReset}
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.confirmPassword)}
                    />
                    <button
                      type="button"
                      className="atlas-auth-password__toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-pressed={showConfirmPassword}
                      aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                    >
                      <LineIcon name={showConfirmPassword ? "eye-off" : "eye"} className="h-4 w-4" />
                      <span className="sr-only">{showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}</span>
                    </button>
                    {errors.confirmPassword ? <small className="a26-field__error" role="alert">{errors.confirmPassword}</small> : null}
                  </label>
                  {message ? <p className="a26-auth-message is-error" role="alert">{message}</p> : null}
                  <A26Button className="atlas-auth-submit" variant="liquid" type="submit" loading={resetLoading}>
                    Salvar Nova Senha
                  </A26Button>
                  <button
                    type="button"
                    className="atlas-auth-forgot-link"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.history.replaceState({}, document.title, "/login");
                      }
                      navigate("/login");
                    }}
                  >
                    Voltar ao login
                  </button>
                </form>
              </>
            )}
          </>
        ) : (
          <>
            <p className="eyebrow mt-8">{t("auth.accessAccount")}</p>
            <h1 className="display-title">{t("auth.loginShort")}</h1>
            <p className="mt-4 max-w-md text-textMuted">{t("auth.loginDescription")}</p>
            <form className="atlas-auth-form" onSubmit={submit} noValidate>
              <A26Field
                label={t("auth.email")}
                error={errors.email}
                name="email"
                type="email"
                value={values.email}
                onChange={update}
                autoComplete="email"
              />
              <label className="a26-field atlas-auth-password">
                <span className="a26-field__label">{t("auth.password")}</span>
                <input
                  className="a26-field__control"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={update}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="atlas-auth-password__toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  <LineIcon name={showPassword ? "eye-off" : "eye"} className="h-4 w-4" />
                  <span className="sr-only">{showPassword ? t("auth.hidePassword") : t("auth.showPassword")}</span>
                </button>
                {errors.password ? <small className="a26-field__error" role="alert">{errors.password}</small> : null}
              </label>
              {message ? <p className="a26-auth-message is-error" role="alert">{message}</p> : null}
              {recoveryStatus ? (
                <p className={`a26-auth-message ${recoveryStatus.type === "success" ? "is-success" : "is-error"}`} role="alert">
                  {recoveryStatus.text}
                </p>
              ) : null}
              <A26Button className="atlas-auth-submit" variant="liquid" type="submit" loading={loading}>
                {t("auth.loginShort")}
              </A26Button>
              <button
                type="button"
                className="atlas-auth-forgot-link"
                disabled={recoveryLoading}
                onClick={handleForgotPassword}
              >
                {recoveryLoading ? t("common.loading") : t("auth.forgotPassword")}
              </button>
            </form>
          </>
        )}
        <div className="atlas-auth-divider" />
        <div className="atlas-auth-actions atlas-auth-footer-row">
          <A26Button
            className="atlas-auth-secondary atlas-auth-footer-link"
            variant="ghost"
            onClick={() => navigate("/register")}
          >
            {t("auth.createAccount")}
          </A26Button>
          <A26Button
            className="atlas-auth-secondary atlas-auth-footer-link"
            variant="ghost"
            onClick={() => navigate("/programa-beta")}
          >
            Programa Beta
          </A26Button>
        </div>
      </A26Card>
    </AuthExperienceShell>
  );
}
