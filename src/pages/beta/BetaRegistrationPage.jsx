/* eslint-disable no-unused-vars -- identificadores usados no escopo JSX */
import { useState, useEffect } from "react";
import AuthExperienceShell from "../../components/AuthExperienceShell/AuthExperienceShell";
import LanguageSelector from "../../components/LanguageSelector";
import LineIcon from "../../components/icons/LineIcon";
import { A26Button, A26Card, A26Field, A26IconButton } from "../../components/aeternum-26";
import { submitBetaApplication, getBetaProgramPublicStatus } from "../../services/beta/betaRegistrationService";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import "./BetaRegistrationPage.css";

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
  const [programStatus, setProgramStatus] = useState({
    registration_open: false,
    batch: "batch_1_30",
    capacity_total: 30,
    approved_count: 0,
    remaining_slots: 30,
    launch_notice: "Inscrições abrem na primeira semana de dezembro de 2026"
  });
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getBetaProgramPublicStatus().then(res => {
      if (mounted && res?.data) {
        setProgramStatus(res.data);
      }
    }).finally(() => {
      if (mounted) setStatusLoading(false);
    });
    return () => { mounted = false; };
  }, []);

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

    if (!programStatus.registration_open) {
      setErrorMessage("As inscrições serão abertas oficialmente na primeira semana de dezembro de 2026. A plataforma está em modo de pré-lançamento para inspeção prévia.");
      return;
    }

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
      <AuthExperienceShell wide variant="beta">
        <A26Card className="atlas-auth-card atlas-auth-card--beta" data-testid="a26-beta-success">
          <div className="atlas-auth-card__topline">
            <span>{t("auth.secureAccess")}</span>
            <div className="atlas-auth-card__topline-actions">
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
            <span className="beta-hero-eyebrow">OPERAÇÃO EL DORADO · REGISTRO PROTOCOLADO</span>
            <h1 className="beta-hero-title mt-2">CANDIDATURA RECEBIDA COM SUCESSO</h1>
            <p className="beta-hero-desc mt-3">
              Sua solicitação de participação no <strong>Programa de Teste Beta da Aeternum Atlas</strong> foi registrada com sucesso sob o protocolo institucional.
            </p>
          </div>

          <div className="mt-6 p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-textMuted">Candidato</span>
                <p className="text-base font-semibold text-text">{values.fullName}</p>
                <p className="text-xs text-textMuted">{values.email}</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs uppercase tracking-wider text-textMuted">Número de Protocolo</span>
                <div className="mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm">
                    {submissionResult?.protocol_number || "BETA-2026-PROTOCOL"}
                  </span>
                </div>
                <div className="mt-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    AGUARDANDO ANÁLISE
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

          <div className="beta-actions-container mt-8">
            <A26Button variant="primary" className="beta-submit-button" onClick={() => navigate("/")}>
              VOLTAR À PÁGINA INICIAL
            </A26Button>
            <A26Button variant="liquid" className="beta-login-link-button" onClick={() => navigate("/login")}>
              ACESSAR PORTAL DO ESTUDANTE
            </A26Button>
          </div>
        </A26Card>
      </AuthExperienceShell>
    );
  }

  // Formulário de Candidatura
  return (
    <AuthExperienceShell wide variant="beta">
      <A26Card className="atlas-auth-card atlas-auth-card--beta" data-testid="a26-beta-registration">
        <div className="atlas-auth-card__topline">
          <span>{t("auth.secureAccess")}</span>
          <div className="atlas-auth-card__topline-actions">
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

        <span className="beta-hero-eyebrow">OPERAÇÃO EL DORADO · ABERTURA DEZEMBRO 2026</span>
        <h1 className="beta-hero-title">PROGRAMA DE TESTE BETA</h1>
        <p className="beta-hero-desc">
          Participe do processo seletivo para a primeira turma de estudantes no ambiente imersivo da Aeternum Atlas.
          Acesso experimental pioneiro a modelos cadavéricos 3D e ao ecossistema acadêmico.
        </p>

        {/* Banner Informativo / Modo Pré-Lançamento */}
        {!programStatus.registration_open ? (
          <div className="beta-prelaunch-banner" role="status">
            <span className="beta-prelaunch-banner__icon">⏳</span>
            <div>
              <p className="beta-prelaunch-banner__title">
                FASE DE PRÉ-LANÇAMENTO · INSCRIÇÕES EM BREVE
              </p>
              <p className="beta-prelaunch-banner__text">
                A abertura oficial das inscrições ocorrerá na <strong>primeira semana de dezembro de 2026</strong> para a <strong>Turma 1 (limite de 30 vagas convidadas)</strong>.
                Você pode visualizar antecipadamente todos os requisitos e campos de qualificação abaixo. O formulário será habilitado automaticamente assim que as inscrições forem abertas.
              </p>
            </div>
          </div>
        ) : (
          <div className="beta-active-banner" role="status">
            <span className="beta-prelaunch-banner__icon">✨</span>
            <div>
              <p className="beta-active-banner__title">
                INSCRIÇÕES ABERTAS · PRIMEIRA TURMA ({programStatus.remaining_slots || 30} VAGAS RESTANTES)
              </p>
              <p className="beta-active-banner__text">
                A submissão da candidatura registra seu interesse acadêmico. A seleção priorizará alunos de graduação em saúde para a primeira turma (30 participantes). Candidaturas excedentes integrarão a lista de espera.
              </p>
            </div>
          </div>
        )}

        <form className="beta-registration-form" onSubmit={submit} noValidate>
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
            placeholder="Ex: Professor de Anatomia, Colega de Turma, etc."
          />

          {/* 11. Motivação (Textarea em largura total) */}
          <div className="beta-field-full">
            <A26Field
              as="textarea"
              label="Motivação para Participar do Programa Beta *"
              error={errors.motivation}
              name="motivation"
              value={values.motivation}
              onChange={update}
              rows={3}
              placeholder="Descreva por que você deseja participar do teste beta, como utiliza a anatomia no seu aprendizado e o que espera da plataforma Aeternum Atlas..."
            />
          </div>

          {/* Consentimentos e Informações de Privacidade (LGPD) */}
          <div className="beta-consent-container">
            <p className="beta-consent-title">
              Consentimentos e Privacidade (LGPD)
            </p>

            <label className="beta-consent-tile">
              <input
                name="privacyConsent"
                type="checkbox"
                checked={values.privacyConsent}
                onChange={update}
              />
              <span className="beta-consent-tile__text">
                <strong>Tratamento de Dados:</strong> Concordo com o tratamento dos meus dados pessoais e acadêmicos para finalidade exclusiva de avaliação, seleção, comunicação e participação no Programa de Teste Beta da Aeternum Atlas.
              </span>
            </label>
            {errors.privacyConsent && (
              <p className="a26-field__error text-xs text-red-400" role="alert">{errors.privacyConsent}</p>
            )}

            <label className="beta-consent-tile">
              <input
                name="termsConsent"
                type="checkbox"
                checked={values.termsConsent}
                onChange={update}
              />
              <span className="beta-consent-tile__text">
                <strong>Condições do Programa Beta:</strong> Declaro que estou ciente de que as vagas da primeira turma são limitadas (30 participantes) e que esta inscrição <u>não garante aprovação nem acesso imediato</u>.
              </span>
            </label>
            {errors.termsConsent && (
              <p className="a26-field__error text-xs text-red-400" role="alert">{errors.termsConsent}</p>
            )}

            <label className="beta-consent-tile">
              <input
                name="communicationConsent"
                type="checkbox"
                checked={values.communicationConsent}
                onChange={update}
              />
              <span className="beta-consent-tile__text">
                <strong>Comunicações:</strong> Autorizo o recebimento de e-mails sobre o status da candidatura, orientações de teste e atualizações do programa beta.
              </span>
            </label>
          </div>

          {/* Mensagem Geral de Erro */}
          {errorMessage && (
            <p className="a26-auth-message beta-field-full is-error" role="status">
              {errorMessage}
            </p>
          )}

          {/* Ações */}
          <div className="beta-actions-container">
            <A26Button
              variant="primary"
              type="submit"
              loading={loading}
              disabled={!programStatus.registration_open || loading}
              className={`beta-submit-button${!programStatus.registration_open ? " beta-submit-button--prelaunch" : ""}`}
            >
              {programStatus.registration_open
                ? "SOLICITAR PARTICIPAÇÃO BETA"
                : "INSCRIÇÕES EM BREVE (DEZEMBRO 2026)"}
            </A26Button>
            <A26Button
              variant="liquid"
              type="button"
              className="beta-login-link-button"
              onClick={() => navigate("/login")}
            >
              Já possui conta institucional? Entrar
            </A26Button>
          </div>
        </form>
      </A26Card>
    </AuthExperienceShell>
  );
}
