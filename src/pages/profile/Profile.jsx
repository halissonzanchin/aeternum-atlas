import { useState } from "react";
import { A26Button, A26Card, A26Field } from "../../components/aeternum-26";
import { updateCurrentUserPassword, updateCurrentUserProfile } from "../../services/auth/authService";
import { sanitizeText } from "../../utils/validators";
import { useLanguage } from "../../context/LanguageContext";

export default function Profile({ user, onAuth, notify }) {
  const { t } = useLanguage();
  const [values, setValues] = useState({
    name: user.name || "",
    email: user.email || "",
    institution: user.institution || "",
    course: user.course || "",
    semester: user.semester || "",
    studentRegistration: user.studentRegistration || "",
    country: user.country || "",
    userType: user.userType || user.role || "",
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
    <section className="a26-profile-page fade-in-up" data-a26-source="authenticated-account">
      <header className="a26-profile-hero">
        <p className="a26-kicker">Conta autenticada</p>
        <h1>Perfil</h1>
        <p>Gerencie os dados pessoais editáveis e revise as informações institucionais vinculadas à sua conta.</p>
      </header>

      <A26Card material="substantial" tone="teal" className="a26-profile-card">
        <form className="a26-profile-form" onSubmit={submit}>
          <A26Field label="Nome" name="name" value={values.name} onChange={update} />
          <A26Field label="E-mail" name="email" value={values.email} disabled hint="Identidade de acesso gerenciada pela conta." />
          <A26Field label="Instituição" name="institution" value={values.institution} disabled />
          <A26Field label="Curso" name="course" value={values.course} onChange={update} />
          <A26Field label="Ano/Semestre" name="semester" value={values.semester} onChange={update} />
          <A26Field label="Matrícula/R.A." name="studentRegistration" value={values.studentRegistration} onChange={update} />
          <A26Field label="País" name="country" value={values.country} onChange={update} />
          <A26Field label="Tipo de usuário" name="userType" value={values.userType} disabled />
          <A26Field as="select" label="Preferência de idioma" name="language" value={values.language} onChange={update}>
              <option>Português</option>
              <option>Español</option>
              <option>English</option>
          </A26Field>
          <A26Field className="a26-profile-form__wide" label="Alterar senha" name="password" type="password" value={values.password} onChange={update} placeholder="Opcional" hint="Deixe em branco para manter a senha atual." />
          <A26Button className="a26-profile-form__submit" variant="primary" type="submit">Salvar perfil</A26Button>
        </form>
      </A26Card>
    </section>
  );
}
