import { useState } from "react";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import LanguageSelector from "../../components/LanguageSelector";
import { registerUser } from "../../services/authService";
import { validateRegister } from "../../utils/validators";
import { useLanguage } from "../../context/LanguageContext";

const userTypes = ["Estudante", "Professor", "Admin institucional"];
const institutions = ["UPE Presidente Franco", "Universidade Demo", "Faculdade parceira"];

export default function Register({ navigate, onAuth }) {
  const { t, availableLanguages } = useLanguage();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "Estudante",
    institution: "UPE Presidente Franco",
    course: "",
    semester: "",
    studentRegistration: "",
    country: "",
    language: "pt",
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  function update(event) {
    const { name, value, type, checked } = event.target;
    setValues({ ...values, [name]: type === "checkbox" ? checked : value });
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length) return;

    try {
      const user = await registerUser(values);
      onAuth(user);
      navigate("/dashboard");
    } catch (error) {
      setMessage(error.message || t("auth.createAccountError"));
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <Card className="w-full max-w-4xl">
        <div className="mb-4 flex justify-end"><LanguageSelector compact /></div>
        <p className="eyebrow">{t("auth.registerEyebrow")}</p>
        <h1 className="display-title">{t("auth.createAccess")}</h1>
        <p className="mt-3 max-w-2xl text-textMuted">
          {t("auth.registerDescription")}
        </p>

        <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={submit}>
          <label className="field">
            <span>{t("auth.fullName")}</span>
            <input name="name" value={values.name} onChange={update} autoComplete="name" />
            <small>{errors.name}</small>
          </label>

          <label className="field">
            <span>{t("auth.academicEmail")}</span>
            <input name="email" value={values.email} onChange={update} autoComplete="email" />
            <small>{errors.email}</small>
          </label>

          <label className="field">
            <span>{t("auth.password")}</span>
            <input name="password" type="password" value={values.password} onChange={update} autoComplete="new-password" />
            <small>{errors.password}</small>
          </label>

          <label className="field">
            <span>{t("auth.confirmPassword")}</span>
            <input name="confirmPassword" type="password" value={values.confirmPassword} onChange={update} autoComplete="new-password" />
            <small>{errors.confirmPassword}</small>
          </label>

          <label className="field">
            <span>{t("auth.userType")}</span>
            <select name="userType" value={values.userType} onChange={update}>
              {userTypes.map(type => <option key={type}>{type}</option>)}
            </select>
            <small>{errors.userType}</small>
          </label>

          <label className="field">
            <span>{t("auth.institution")}</span>
            <select name="institution" value={values.institution} onChange={update}>
              {institutions.map(institution => <option key={institution}>{institution}</option>)}
            </select>
            <small>{errors.institution}</small>
          </label>

          <label className="field">
            <span>{t("auth.course")}</span>
            <input name="course" value={values.course} onChange={update} placeholder="Medicina" />
            <small>{errors.course}</small>
          </label>

          <label className="field">
            <span>{t("auth.semester")}</span>
            <input name="semester" value={values.semester} onChange={update} placeholder="2º semestre" />
            <small>{errors.semester}</small>
          </label>

          <label className="field">
            <span>{t("auth.studentRegistration")}</span>
            <input name="studentRegistration" value={values.studentRegistration} onChange={update} placeholder="RA-2026-001" />
            <small>{errors.studentRegistration}</small>
          </label>

          <label className="field">
            <span>{t("auth.country")}</span>
            <input name="country" value={values.country} onChange={update} />
            <small />
          </label>

          <label className="field md:col-span-2">
            <span>{t("auth.preferredLanguage")}</span>
            <select name="language" value={values.language} onChange={update}>
              {availableLanguages.map(item => <option key={item.code} value={item.code}>{item.nativeName}</option>)}
            </select>
            <small />
          </label>

          <label className="flex gap-3 text-sm leading-6 text-slate-200 md:col-span-2">
            <input className="mt-1" name="acceptTerms" type="checkbox" checked={values.acceptTerms} onChange={update} />
            <span>{t("auth.acceptTerms")}</span>
          </label>

          {errors.acceptTerms ? <p className="text-sm text-red-100 md:col-span-2">{errors.acceptTerms}</p> : null}
          {message ? <p className="rounded-2xl border border-red-300/25 bg-red-400/10 p-3 text-sm text-red-100 md:col-span-2">{message}</p> : null}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button variant="teal" type="submit">{t("auth.createInstitutionalAccess")}</Button>
            <Button variant="outline" type="button" onClick={() => navigate("/login")}>{t("auth.alreadyHaveAccount")}</Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
