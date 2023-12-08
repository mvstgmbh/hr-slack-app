import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import ChallengeInviteWorkflow from "../workflows/ChallengeInvite.workflow.ts";

const linkTrigger: Trigger<typeof ChallengeInviteWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "CodeChallengeInvite",
  description:
    "Start the workflow to create a repo and invite the candidate to it",
  workflow: `#/workflows/${ChallengeInviteWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    channel: {
      value: TriggerContextData.Shortcut.channel_id,
    },
    user: {
      value: TriggerContextData.Shortcut.user_id,
    },
  },
};

export default linkTrigger;
