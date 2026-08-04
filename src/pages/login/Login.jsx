/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import { useState } from "react";
import AuthExperienceShell from "../../components/AuthExperienceShell/AuthExperienceShell";
import LanguageSelector from "../../components/LanguageSelector";
import { A26Button, A26Card, A26Field } from "../../components/aeternum-26";
import { getRedirectPathForUser, loginUser } from "../../services/auth/authService";
import { validateLogin } from "../../utils/validators";
import { useLanguage } from "../../context/LanguageContext";

export default function Login({ navigate, onAuth }) {
  const { t } = useLanguage();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(event) {
    const { name, value } = event.target;
    setValues(current => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const user = await loginUser(values.email, values.password);
      onAuth(user);
      navigate(getRedirectPathForUser(user));
    } catch (error) {
      setMessage(error.message || t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
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
          <LanguageSelector compact />
        </div>
        <p className="eyebrow mt-8">{t("auth.accessAccount")}</p>
        <h1 className="display-title">{t("auth.loginShort")}</h1>
        <p className="mt-4 max-w-md text-textMuted">{t("auth.loginDescription")}</p>
        <form className="atlas-auth-form" onSubmit={submit}>
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
              {showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            </button>
            {errors.password ? <small className="a26-field__error" role="alert">{errors.password}</small> : null}
          </label>
          {message ? <p className="a26-auth-message is-error" role="alert">{message}</p> : null}
          <A26Button className="atlas-auth-submit" variant="liquid" type="submit" loading={loading}>
            {t("auth.loginShort")}
          </A26Button>
        </form>
        <div className="atlas-auth-actions">
          <A26Button className="atlas-auth-secondary" variant="liquid" onClick={() => setMessage(t("auth.recoveryPrepared"))}>{t("auth.forgotPassword")}</A26Button>
          <A26Button className="atlas-auth-secondary" variant="liquid" onClick={() => navigate("/register")}>{t("auth.newAccount")}</A26Button>
        </div>
      </A26Card>
    </AuthExperienceShell>
  );
}
