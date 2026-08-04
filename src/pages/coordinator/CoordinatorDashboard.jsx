import GovernanceRolePage from "../governance/GovernanceRolePage";

export default function CoordinatorDashboard({ user, section = "dashboard" }) {
  return <GovernanceRolePage user={user} role="coordinator" section={section} />;
}
