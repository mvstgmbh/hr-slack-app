import { Manifest } from "deno-slack-sdk/mod.ts";
import ChallengeInviteWorkflow from "./workflows/ChallengeInvite.workflow.ts";

export default Manifest({
  name: "HR Bot",
  description: "Bot for helping HR",
  icon: "assets/icon.png",
  workflows: [ChallengeInviteWorkflow],
  outgoingDomains: ["api.github.com"],
  botScopes: ["commands", "chat:write"],
  features: {
    appHome: {
      messagesTabEnabled: false,
      messagesTabReadOnlyEnabled: false,
    },
  },
});
