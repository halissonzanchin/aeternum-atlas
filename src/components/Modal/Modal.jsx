/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import { A26Modal } from "../aeternum-26";
import { useLanguage } from "../../context/LanguageContext";

export default function Modal({ open, title, children, actions, onClose }) {
  const { t } = useLanguage();
  return (
    <A26Modal open={open} title={title} actions={actions} onClose={onClose} closeLabel={t("actions.close")}>
      {children}
    </A26Modal>
  );
}
