import { useState } from "react";
import { A26AuroraBackground, A26Button, A26Card, A26FeatureShell, A26Field, A26PageHeader } from "../../components/aeternum-26";
import { updateCurrentUserPassword, updateCurrentUserProfile } from "../../services/auth/authService";
import { sanitizeText } from "../../utils/validators";
import { useLanguage } from "../../context/LanguageContext";

export default function Profile({ user, onAuth, notify }) {
  const { t } = useLanguage();
  const [values, setValues] = useState({
    name: user?.name || "",
    email: user?.email || "",
    institution: user?.institution || "",
    course: user?.course || "",
    semester: user?.semester || "",
    studentRegistration: user?.studentRegistration || "",
    country: user?.country || "",
    userType: user?.userType || user?.role || "",
    language: "Português",
    password: ""
  });

  function update(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    try {
      const updated = await updateCurrentUserProfile(user.id, {
        name: sanitizeText(values.name)
      });

      if (values.password) {
        await updateCurrentUserPassword(values.password);
        notify(t("auth.passwordUpdated"));
      }

      onAuth(updated);
      notify(t("auth.profileUpdated"));
    } catch (error) {
      notify(error.message || t("auth.profileUpdateError"));
    }
  }

  return (
    <div className="profile-root relative">
      <A26AuroraBackground variant="veryQuiet" />
      <A26FeatureShell
        variant="standard"
        className="a26-profile-page fade-in-up relative z-10"
      data-a26-source="authenticated-account"
      header={
        <A26PageHeader
          eyebrow={t("profile.eyebrow")}
          title={t("profile.title")}
          description={t("profile.subtitle")}
        />
      }
    >
      <A26Card material="substantial" tone="teal" className="a26-profile-card">
        <form className="a26-profile-form" onSubmit={submit}>
          <A26Field label={t("profile.name")} name="name" value={values.name} onChange={update} />
          <A26Field label={t("profile.email")} name="email" value={values.email} disabled hint={t("profile.emailHint")} />
          <A26Field label={t("profile.institution")} name="institution" value={values.institution} disabled />
          <A26Field label={t("profile.course")} name="course" value={values.course} onChange={update} />
          <A26Field label={t("profile.semester")} name="semester" value={values.semester} onChange={update} />
          <A26Field label={t("profile.studentRegistration")} name="studentRegistration" value={values.studentRegistration} onChange={update} />
          <A26Field label={t("profile.country")} name="country" value={values.country} onChange={update} />
          <A26Field label={t("profile.userType")} name="userType" value={values.userType} disabled />
          <A26Field as="select" label={t("profile.languagePreference")} name="language" value={values.language} onChange={update}>
              <option>Português</option>
              <option>Español</option>
              <option>English</option>
          </A26Field>
          <A26Field className="a26-profile-form__wide" label={t("profile.changePassword")} name="password" type="password" value={values.password} onChange={update} placeholder={t("profile.changePasswordPlaceholder")} hint={t("profile.changePasswordHint")} />
          <A26Button className="a26-profile-form__submit" variant="primary" type="submit">{t("profile.saveProfile")}</A26Button>
        </form>
      </A26Card>
    </A26FeatureShell>
    </div>
  );
}
