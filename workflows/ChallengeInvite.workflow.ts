import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { GitHubInvite } from "../functions/github_invite.function.ts";
import "std/dotenv/load.ts";

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

const challengeRepo = `${Deno.env.get("CHALLENGE_ORG")}/${
  Deno.env.get("TEMPLATE_REPO")
}`;
const challengeRepoUrl =
  `<https://github.com/${challengeRepo}|${challengeRepo}>`;

const inputForm = ChallengeInviteWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Invite to Code Challenge",
    description: `Invite someone to the ${challengeRepoUrl} repository.`,
    interactivity: ChallengeInviteWorkflow.inputs.interactivity,
    submit_label: "Send",
    fields: {
      elements: [{
        name: "ghUsername",
        title: "GitHub username",
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
