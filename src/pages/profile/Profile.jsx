import { useState } from "react";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import { updatePassword, updateUser } from "../../services/authService";
import { normalizeEmail, sanitizeText } from "../../utils/validators";

const userTypes = ["Estudante", "Professor", "Admin institucional"];

export default function Profile({ user, onAuth, notify }) {
  const [values, setValues] = useState({
    name: user.name || "",
    email: user.email || "",
    institution: user.institution || "",
    course: user.course || "",
    semester: user.semester || "",
    studentRegistration: user.studentRegistration || "",
    country: user.country || "",
    userType: user.userType || "Estudante",
    language: "Português",
    password: ""
  });

  function update(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    let updated = updateUser(user.id, {
      name: sanitizeText(values.name),
      email: normalizeEmail(values.email),
      institution: sanitizeText(values.institution),
      course: sanitizeText(values.course),
      semester: sanitizeText(values.semester),
      studentRegistration: sanitizeText(values.studentRegistration),
      country: sanitizeText(values.country),
      userType: sanitizeText(values.userType)
    });

    if (values.password) {
      if (values.password.length < 8) {
        notify("A senha precisa ter pelo menos 8 caracteres.");
        return;
      }
      updated = await updatePassword(user.id, values.password);
    }

    onAuth(updated);
    notify("Perfil atualizado.");
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
            <input name="email" value={values.email} onChange={update} />
          </label>
          <label className="field">
            <span>Instituição</span>
            <input name="institution" value={values.institution} onChange={update} />
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
            <select name="userType" value={values.userType} onChange={update}>{userTypes.map(type => <option key={type}>{type}</option>)}</select>
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
