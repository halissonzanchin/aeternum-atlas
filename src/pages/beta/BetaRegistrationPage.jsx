/* eslint-disable no-unused-vars -- identificadores usados no escopo JSX */
import { useState } from "react";
import AuthExperienceShell from "../../components/AuthExperienceShell/AuthExperienceShell";
import LanguageSelector from "../../components/LanguageSelector";
import LineIcon from "../../components/icons/LineIcon";
import { A26Button, A26Card, A26Field, A26IconButton } from "../../components/aeternum-26";
import { submitBetaApplication } from "../../services/beta/betaRegistrationService";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

const DEVICE_OPTIONS = [
  "Desktop / Notebook (Windows)",
  "Mac / MacBook (macOS)",
  "iPad / Tablet Apple (iPadOS)",
  "Tablet Android",
  "Outro Dispositivo"
];

const INITIAL_FORM = {
  fullName: "",
  email: "",
  institutionName: "",
  course: "",
  academicTerm: "",
  studentGroup: "",
  studentIdNumber: "",
  country: "Brasil",
  primaryDevice: "Desktop / Notebook (Windows)",
  referralSource: "",
  motivation: "",
  privacyConsent: false,
  termsConsent: false,
  communicationConsent: true
};

export default function BetaRegistrationPage({ navigate }) {
  const { t } = useLanguage();
  const { toggleTheme, isLight } = useTheme();

  const [values, setValues] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  function update(event) {
    const { name, value, type, checked } = event.target;
    setValues(current => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setErrorMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMessage("");
    setErrors({});

    try {
      const result = await submitBetaApplication(values);

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
        }
        setErrorMessage(result.message || "Verifique as informações do formulário.");
        return;
      }

      setSubmissionResult(result);
    } catch (err) {
      setErrorMessage(err.message || "Ocorreu um erro inesperado ao enviar sua candidatura.");
    } finally {
      setLoading(false);
    }
  }

  // Estado de Sucesso
  if (submissionResult) {
    return (
      <AuthExperienceShell wide>
        <A26Card className="atlas-auth-card atlas-auth-card--registration" data-testid="a26-beta-success">
          <div className="atlas-auth-card__topline">
            <span>{t("auth.secureAccess")}</span>
            <div className="atlas-auth-card__topline-actions flex items-center gap-2">
              <A26IconButton
                label={isLight ? "Alternar para Dark Liquid Glass" : "Alternar para Light Liquid Glass"}
                icon={isLight ? "moon" : "sun"}
                className="atlas-auth-theme-toggle"
                onClick={toggleTheme}
              />
              <LanguageSelector compact />
            </div>
          </div>

          <div className="mt-8 text-center sm:text-left">
            <span className="eyebrow" style={{ color: "#38bdf8" }}>OPERAÇÃO EL DORADO · REGISTRO PROTOCOLADO</span>
            <h1 className="display-title mt-2">CANDIDATURA RECEBIDA COM SUCESSO</h1>
            <p className="mt-4 text-textMuted max-w-2xl leading-relaxed">
              Sua solicitação de participação no <strong>Programa de Teste Beta da Aeternum Atlas</strong> foi registrada com sucesso sob o protocolo institucional.
            </p>
          </div>

          <div className="mt-6 p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-textMuted">Candidato</span>
                <p className="text-base font-semibold text-text">{values.fullName}</p>
                <p className="text-xs text-textMuted">{values.email}</p>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase tracking-wider text-textMuted">Status Inicial</span>
                <div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    PENDENTE DE REVISÃO
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-textMuted block">Instituição:</span>
                <span className="text-text font-medium">{values.institutionName}</span>
              </div>
              <div>
                <span className="text-textMuted block">Curso / Período:</span>
                <span className="text-text font-medium">{values.course} · {values.academicTerm}</span>
              </div>
              <div>
                <span className="text-textMuted block">Dispositivo Principal:</span>
                <span className="text-text font-medium">{values.primaryDevice}</span>
              </div>
              <div>
                <span className="text-textMuted block">Turma / Grupo:</span>
                <span className="text-text font-medium">{values.studentGroup || "Não informado"}</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-textMuted border-t border-white/5">
              <p>
                ℹ️ <strong>Importante:</strong> A inscrição no programa beta não garante aprovação ou acesso imediato.
                A seleção da primeira turma (capacidade inicial de 30 estudantes) ocorrerá na <strong>primeira semana de dezembro de 2026</strong>.
                Fique atento à sua caixa de entrada no endereço <code>{values.email}</code>.
              </p>
            </div>
          </div>

          <div className="atlas-auth-actions atlas-auth-form__full mt-8">
            <A26Button variant="primary" onClick={() => navigate("/")}>
              VOLTAR À PÁGINA INICIAL
            </A26Button>
            <A26Button variant="liquid" onClick={() => navigate("/login")}>
              ACESSAR PORTAL DO ESTUDANTE
            </A26Button>
          </div>
        </A26Card>
      </AuthExperienceShell>
    );
  }

  // Formulário de Candidatura
  return (
    <AuthExperienceShell wide>
      <A26Card className="atlas-auth-card atlas-auth-card--registration" data-testid="a26-beta-registration">
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

        <p className="eyebrow" style={{ color: "#38bdf8" }}>OPERAÇÃO EL DORADO · ABERTURA DEZEMBRO 2026</p>
        <h1 className="display-title">PROGRAMA DE TESTE BETA</h1>
        <p className="mt-3 max-w-2xl text-textMuted leading-relaxed">
          Participe do processo seletivo para a primeira turma de estudantes no ambiente imersivo da Aeternum Atlas.
          Acesso experimental pioneiro a modelos cadavéricos 3D e ao ecossistema acadêmico.
        </p>

        {/* Banner Informativo de Transparência */}
        <div className="mt-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200/90 leading-relaxed">
          <strong>Aviso de Capacidade e Convocação:</strong> A abertura oficial está programada para a <strong>primeira semana de dezembro de 2026</strong>,
          com limite inicial de <strong>30 estudantes convidados</strong> na primeira fase. A submissão da candidatura registra seu interesse e perfil acadêmico,
          mas <u>não garante aprovação ou acesso imediato</u>. Candidaturas excedentes integrarão a lista de espera para as fases subsequentes (até 50 e 100 participantes).
        </div>

        <form className="atlas-auth-form atlas-auth-form--registration mt-6" onSubmit={submit} noValidate>
          {/* 1. Nome Completo */}
          <A26Field
            label="Nome Completo *"
            error={errors.fullName}
            name="fullName"
            value={values.fullName}
            onChange={update}
            placeholder="Ex: Dra. Mariana Vasconcelos de Oliveira"
            autoComplete="name"
          />

          {/* 2. E-mail */}
          <A26Field
            label="E-mail (Preferencialmente Acadêmico) *"
            error={errors.email}
            name="email"
            type="email"
            value={values.email}
            onChange={update}
            placeholder="estudante@universidade.edu.br"
            autoComplete="email"
          />

          {/* 3. Universidade / Instituição */}
          <A26Field
            label="Universidade ou Instituição de Ensino *"
            error={errors.institutionName}
            name="institutionName"
            value={values.institutionName}
            onChange={update}
            placeholder="Ex: USP, UNIFESP, UFRJ, UERJ, etc."
          />

          {/* 4. Curso */}
          <A26Field
            label="Curso de Graduação ou Pós-Graduação *"
            error={errors.course}
            name="course"
            value={values.course}
            onChange={update}
            placeholder="Ex: Medicina, Fisioterapia, Enfermagem, Odontologia"
          />

          {/* 5. Ano ou Semestre */}
          <A26Field
            label="Ano ou Semestre Atual *"
            error={errors.academicTerm}
            name="academicTerm"
            value={values.academicTerm}
            onChange={update}
            placeholder="Ex: 3º ano / 6º semestre"
          />

          {/* 6. Turma ou Grupo Acadêmico */}
          <A26Field
            label="Turma ou Grupo Acadêmico"
            name="studentGroup"
            value={values.studentGroup}
            onChange={update}
            placeholder="Ex: Turma 108 / Grupo B de Anatomia"
          />

          {/* 7. Número de Matrícula (Opcional) */}
          <A26Field
            label="Número de Matrícula (Se disponível)"
            name="studentIdNumber"
            value={values.studentIdNumber}
            onChange={update}
            placeholder="Ex: RA-2026-8812"
          />

          {/* 8. País */}
          <A26Field
            label="País de Residência"
            name="country"
            value={values.country}
            onChange={update}
            placeholder="Brasil"
          />

          {/* 9. Dispositivo Principal */}
          <A26Field
            as="select"
            label="Dispositivo Principal de Acesso *"
            name="primaryDevice"
            value={values.primaryDevice}
            onChange={update}
          >
            {DEVICE_OPTIONS.map(dev => (
              <option key={dev} value={dev}>{dev}</option>
            ))}
          </A26Field>

          {/* 10. Origem do Convite ou Indicação */}
          <A26Field
            label="Origem do Convite ou Indicação"
            name="referralSource"
            value={values.referralSource}
            onChange={update}
            placeholder="Ex: Professor de Anatomia, Colega de Turma, Instagram, etc."
          />

          {/* 11. Motivação (Textarea em largura total) */}
          <div className="atlas-auth-form__full">
            <A26Field
              as="textarea"
              label="Motivação para Participar do Programa Beta *"
              error={errors.motivation}
              name="motivation"
              value={values.motivation}
              onChange={update}
              rows={4}
              placeholder="Descreva por que você deseja participar do teste beta, como utiliza a anatomia no seu aprendizado e o que espera da plataforma Aeternum Atlas..."
            />
          </div>

          {/* Consentimentos e Informações de Privacidade (Separados) */}
          <div className="atlas-auth-form__full space-y-3 pt-4 border-t border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-textMuted">
              Consentimentos e Privacidade (LGPD)
            </p>

            <label className="atlas-auth-consent flex items-start gap-3 cursor-pointer">
              <input
                name="privacyConsent"
                type="checkbox"
                checked={values.privacyConsent}
                onChange={update}
                className="mt-1"
              />
              <span className="text-xs leading-relaxed text-textMuted">
                <strong>Tratamento de Dados:</strong> Concordo com o tratamento dos meus dados pessoais e acadêmicos para finalidade exclusiva de avaliação, seleção, comunicação e participação no Programa de Teste Beta da Aeternum Atlas.
              </span>
            </label>
            {errors.privacyConsent && (
              <p className="a26-field__error text-xs text-red-400" role="alert">{errors.privacyConsent}</p>
            )}

            <label className="atlas-auth-consent flex items-start gap-3 cursor-pointer">
              <input
                name="termsConsent"
                type="checkbox"
                checked={values.termsConsent}
                onChange={update}
                className="mt-1"
              />
              <span className="text-xs leading-relaxed text-textMuted">
                <strong>Condições do Programa Beta:</strong> Declaro que estou ciente de que as vagas da primeira turma são limitadas (30 participantes) e que esta inscrição <u>não garante aprovação nem acesso imediato</u>.
              </span>
            </label>
            {errors.termsConsent && (
              <p className="a26-field__error text-xs text-red-400" role="alert">{errors.termsConsent}</p>
            )}

            <label className="atlas-auth-consent flex items-start gap-3 cursor-pointer">
              <input
                name="communicationConsent"
                type="checkbox"
                checked={values.communicationConsent}
                onChange={update}
                className="mt-1"
              />
              <span className="text-xs leading-relaxed text-textMuted">
                <strong>Comunicações:</strong> Autorizo o recebimento de e-mails sobre o status da candidatura, orientações de teste e atualizações do programa beta.
              </span>
            </label>
          </div>

          {/* Mensagem Geral de Erro */}
          {errorMessage && (
            <p className="a26-auth-message atlas-auth-form__full is-error" role="status">
              {errorMessage}
            </p>
          )}

          {/* Ações */}
          <div className="atlas-auth-actions atlas-auth-form__full mt-6">
            <A26Button variant="primary" type="submit" loading={loading}>
              SOLICITAR PARTICIPAÇÃO BETA
            </A26Button>
            <A26Button variant="liquid" type="button" onClick={() => navigate("/login")}>
              Já possui conta institucional? Entrar
            </A26Button>
          </div>
        </form>
      </A26Card>
    </AuthExperienceShell>
  );
}
