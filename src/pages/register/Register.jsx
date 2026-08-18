/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import { useEffect, useState } from "react";
import AuthExperienceShell from "../../components/AuthExperienceShell/AuthExperienceShell";
import LanguageSelector from "../../components/LanguageSelector";
import { A26Button, A26Card, A26Field, A26IconButton } from "../../components/aeternum-26";
import { getRedirectPathForUser, registerUser } from "../../services/auth/authService";
import { listActivePublicRegistrationInstitutions } from "../../services/institutions/institutionService";
import { validateRegister } from "../../utils/validators";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

const userTypes = ["Estudante", "Professor", "Admin institucional"];
export default function Register({ navigate, onAuth }) {
  const { t, availableLanguages } = useLanguage();
  const { toggleTheme, isLight } = useTheme();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "Estudante",
    institutionId: "",
    institution: "",
    course: "",
    semester: "",
    studentRegistration: "",
    country: "",
    language: "pt",
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);
  const [institutionOptions, setInstitutionOptions] = useState([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    listActivePublicRegistrationInstitutions()
      .then(items => {
        if (!mounted) return;
        setInstitutionOptions(items);

        const firstInstitution = items[0];
        if (firstInstitution?.id) {
          setValues(current => current.institutionId
            ? current
            : {
                ...current,
                institutionId: firstInstitution.id,
                institution: firstInstitution.name
              });
        }
      })
      .finally(() => {
        if (mounted) setInstitutionsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function update(event) {
    const { name, value, type, checked } = event.target;
    if (name === "institutionId") {
      const selectedInstitution = institutionOptions.find(item => item.id === value);
      setValues(current => ({
        ...current,
        institutionId: value,
        institution: selectedInstitution?.name || ""
      }));
      return;
    }

    setValues(current => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    setMessage("");
    setMessageType("error");
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const user = await registerUser(values);
      if (user?.pendingApproval || user?.status === "pending") {
        setMessageType("success");
        setMessage("Cadastro enviado com sucesso. Sua conta ficou pendente para aprovação institucional.");
        window.setTimeout(() => navigate("/login"), 1800);
        return;
      }

      onAuth(user);
      navigate(getRedirectPathForUser(user));
    } catch (error) {
      setMessageType("error");
      setMessage(error.message || t("auth.createAccountError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthExperienceShell wide>
      <A26Card className="atlas-auth-card atlas-auth-card--registration" data-testid="a26-register">
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
        <p className="eyebrow">{t("auth.registerEyebrow")}</p>
        <h1 className="display-title">{t("auth.createAccess")}</h1>
        <p className="mt-3 max-w-2xl text-textMuted">
          {t("auth.registerDescription")}
        </p>

        <form className="atlas-auth-form atlas-auth-form--registration" onSubmit={submit}>
          <A26Field label={t("auth.fullName")} error={errors.name} name="name" value={values.name} onChange={update} autoComplete="name" />
          <A26Field label={t("auth.academicEmail")} error={errors.email} name="email" type="email" value={values.email} onChange={update} autoComplete="email" />
          <A26Field label={t("auth.password")} error={errors.password} name="password" type="password" value={values.password} onChange={update} autoComplete="new-password" />
          <A26Field label={t("auth.confirmPassword")} error={errors.confirmPassword} name="confirmPassword" type="password" value={values.confirmPassword} onChange={update} autoComplete="new-password" />

          <A26Field as="select" label={t("auth.userType")} error={errors.userType} name="userType" value={values.userType} onChange={update}>
              {userTypes.map(type => <option key={type}>{type}</option>)}
          </A26Field>

          <A26Field
            as="select"
            label={t("auth.institution")}
            error={errors.institution}
            name="institutionId"
            value={values.institutionId}
            onChange={update}
            disabled={institutionsLoading || !institutionOptions.length}
          >
              <option value="">
                {institutionsLoading ? t("auth.loadingInstitutions") : t("auth.selectInstitution")}
              </option>
              {institutionOptions.map(institution => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
          </A26Field>

          <A26Field label={t("auth.course")} error={errors.course} name="course" value={values.course} onChange={update} placeholder="Medicina" />
          <A26Field label={t("auth.semester")} error={errors.semester} name="semester" value={values.semester} onChange={update} placeholder="2º semestre" />
          <A26Field label={t("auth.studentRegistration")} error={errors.studentRegistration} name="studentRegistration" value={values.studentRegistration} onChange={update} placeholder="RA-2026-001" />
          <A26Field label={t("auth.country")} name="country" value={values.country} onChange={update} />

          <A26Field as="select" className="atlas-auth-form__full" label={t("auth.preferredLanguage")} name="language" value={values.language} onChange={update}>
              {availableLanguages.map(item => <option key={item.code} value={item.code}>{item.nativeName}</option>)}
          </A26Field>

          <label className="atlas-auth-consent atlas-auth-form__full">
            <input name="acceptTerms" type="checkbox" checked={values.acceptTerms} onChange={update} />
            <span>{t("auth.acceptTerms")}</span>
          </label>

          {errors.acceptTerms ? <p className="a26-field__error atlas-auth-form__full" role="alert">{errors.acceptTerms}</p> : null}
          {message ? (
            <p className={`a26-auth-message atlas-auth-form__full ${messageType === "success" ? "is-success" : "is-error"}`} role="status">
              {message}
            </p>
          ) : null}

          <div className="atlas-auth-actions atlas-auth-form__full">
            <A26Button variant="primary" type="submit" loading={loading}>{t("auth.createInstitutionalAccess")}</A26Button>
            <A26Button variant="liquid" type="button" onClick={() => navigate("/login")}>{t("auth.alreadyHaveAccount")}</A26Button>
          </div>
        </form>
      </A26Card>
    </AuthExperienceShell>
  );
}
