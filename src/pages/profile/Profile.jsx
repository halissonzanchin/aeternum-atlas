import { useState } from "react";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import { updateCurrentUserPassword, updateCurrentUserProfile } from "../../services/authService";
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
    <>
      <div className="page-title">
        <p className="eyebrow">Conta</p>
        <h1 className="display-title">Perfil</h1>
      </div>

      <Card>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={submit}>
          <label className="field">
            <span>Nome</span>
            <input name="name" value={values.name} onChange={update} />
          </label>
          <label className="field">
            <span>E-mail</span>
            <input name="email" value={values.email} disabled />
          </label>
          <label className="field">
            <span>Instituição</span>
            <input name="institution" value={values.institution} disabled />
          </label>
          <label className="field">
            <span>Curso</span>
            <input name="course" value={values.course} onChange={update} />
          </label>
          <label className="field">
            <span>Ano/Semestre</span>
            <input name="semester" value={values.semester} onChange={update} />
          </label>
          <label className="field">
            <span>Matrícula/R.A.</span>
            <input name="studentRegistration" value={values.studentRegistration} onChange={update} />
          </label>
          <label className="field">
            <span>País</span>
            <input name="country" value={values.country} onChange={update} />
          </label>
          <label className="field">
            <span>Tipo de usuário</span>
            <input name="userType" value={values.userType} disabled />
          </label>
          <label className="field">
            <span>Preferência de idioma</span>
            <select name="language" value={values.language} onChange={update}>
              <option>Português</option>
              <option>Español</option>
              <option>English</option>
            </select>
          </label>
          <label className="field md:col-span-2">
            <span>Alterar senha</span>
            <input name="password" type="password" value={values.password} onChange={update} placeholder="Opcional" />
          </label>
          <Button className="md:col-span-2 md:w-max" variant="teal" type="submit">Salvar perfil</Button>
        </form>
      </Card>
    </>
  );
}
