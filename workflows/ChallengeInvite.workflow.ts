import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { GitHubInvite } from "../functions/github_invite.function.ts";

const ChallengeInviteWorkflow = DefineWorkflow({
  callback_id: "challenge_invite_workflow",
  title: "Challenge the candidate",
  description: "Invites a candidate to the code challenge",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
      user: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["user", "interactivity"],
  },
});

const inputForm = ChallengeInviteWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Send message to channel",
    interactivity: ChallengeInviteWorkflow.inputs.interactivity,
    submit_label: "Send message",
    fields: {
      elements: [{
        name: "ghUsername",
        title: "Candidate's GitHub username",
        type: Schema.types.string,
        long: false,
      }],
      required: ["ghUsername"],
    },
  },
);

const inviteStep = ChallengeInviteWorkflow.addStep(GitHubInvite, {
  candidateGhUsername: inputForm.outputs.fields.ghUsername,
});

ChallengeInviteWorkflow.addStep(Schema.slack.functions.SendEphemeralMessage, {
  channel_id: ChallengeInviteWorkflow.inputs.channel,
  user_id: ChallengeInviteWorkflow.inputs.user,
  message: inviteStep.outputs.responseMessage,
});

export default ChallengeInviteWorkflow;
