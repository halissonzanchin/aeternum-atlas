import { useState } from "react";
import AeternumLogo from "../../components/AeternumLogo";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import LanguageSelector from "../../components/LanguageSelector";
import { loginDemoUser, loginUser } from "../../services/authService";
import { validateLogin } from "../../utils/validators";
import { useLanguage } from "../../context/LanguageContext";

function homeForRole(role) {
  if (role === "teacher" || role === "professor") return "/teacher/dashboard";
  if (role === "institution_admin") return "/admin/dashboard";
  if (role === "admin" || role === "super_admin") return "/super-admin";
  return "/dashboard";
}

export default function Login({ navigate, onAuth }) {
  const { t } = useLanguage();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function update(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length) return;

    try {
      const user = await loginUser(values.email, values.password);
      onAuth(user);
      navigate(homeForRole(user.role));
    } catch (error) {
      setMessage(error.message || t("auth.invalidCredentials"));
    }
  }

  function enterAsTeacherDemo() {
    try {
      const user = loginDemoUser("teacher");
      onAuth(user);
      navigate(homeForRole(user.role));
    } catch (error) {
      setMessage(error.message || t("auth.invalidCredentials"));
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <Card className="w-full max-w-lg">
        <div className="mb-7 flex justify-center">
          <AeternumLogo variant="symbol" size="lg" theme="transparent" />
        </div>
        <div className="mb-4 flex justify-end"><LanguageSelector compact /></div>
        <p className="eyebrow">{t("auth.secureAccess")}</p>
        <h1 className="display-title">{t("auth.loginShort")}</h1>
        <p className="mt-4 text-textMuted">{t("auth.loginDescription")}</p>
        <form className="mt-8 grid gap-5" onSubmit={submit}>
          <label className="field">
            <span>{t("auth.email")}</span>
            <input name="email" value={values.email} onChange={update} />
            <small>{errors.email}</small>
          </label>
          <label className="field">
            <span>{t("auth.password")}</span>
            <div className="flex rounded-2xl border border-white/10 bg-blackDeep/60 focus-within:border-techTeal/70">
              <input className="min-h-11 flex-1 border-0 bg-transparent px-4 outline-none" name="password" type={showPassword ? "text" : "password"} value={values.password} onChange={update} />
              <button type="button" className="px-4 text-sm font-bold text-techTeal" onClick={() => setShowPassword(!showPassword)}>{showPassword ? t("auth.hidePassword") : t("auth.showPassword")}</button>
            </div>
            <small>{errors.password}</small>
          </label>
          {message ? <p className="rounded-2xl border border-red-300/25 bg-red-400/10 p-3 text-sm text-red-100">{message}</p> : null}
          <Button variant="teal" type="submit">{t("auth.loginShort")}</Button>
        </form>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => setMessage(t("auth.recoveryPrepared"))}>{t("auth.forgotPassword")}</Button>
          <Button variant="outline" onClick={() => navigate("/register")}>{t("auth.newAccount")}</Button>
          <Button variant="teal" onClick={enterAsTeacherDemo}>{t("auth.enterAsTeacherDemo")}</Button>
        </div>
      </Card>
    </main>
  );
}
