import { Manifest } from "deno-slack-sdk/mod.ts";
import ChallengeInviteWorkflow from "./workflows/ChallengeInvite.workflow.ts";
import SampleObjectDatastore from "./datastores/sample_datastore.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "HR Bot",
  description: "Bot for helping HR",
  icon: "assets/icon.png",
  workflows: [ChallengeInviteWorkflow],
  outgoingDomains: ["api.github.com"],
  datastores: [SampleObjectDatastore],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
  ],
});
