import GovernanceRolePage from "../governance/GovernanceRolePage";

export default function RectorDashboard({ user, section = "dashboard" }) {
  return <GovernanceRolePage user={user} role="rector" section={section} />;
}
