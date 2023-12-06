import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const GitHubInvite = DefineFunction({
  callback_id: "github_invite.function",
  title: "Create repo and invite candidate ",
  description:
    "Checks if the GitHub user exists, creates the repo from a template, and invites it as a collaborator.",
  source_file: "functions/github_invite.function.ts",
  input_parameters: {
    properties: {
      candidateGhUsername: {
        type: Schema.types.string,
        description: "The candidate's GitHub username",
      },
    },
    required: ["candidateGhUsername"],
  },
  output_parameters: {
    properties: {
      responseMessage: {
        type: Schema.types.string,
        description: "Code challenge invitation URL",
      },
    },
    required: ["responseMessage"],
  },
});

export default SlackFunction(
  GitHubInvite,
  async ({ inputs, env }) => {
    const username = inputs.candidateGhUsername;

    const apiURL = "api.github.com";
    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + env.GITHUB_TOKEN,
      "Content-Type": "application/json",
    };

    try {
      // Check if user exists
      await fetch(`https://${apiURL}/users/${username}`, {
        method: "GET",
        headers,
      }).then(async (res: Response) => {
        if (res.status !== 200) {
          return { outputs: { responseMessage: "Could not find user" } };
        }

        if ((await res.json())?.type !== "User") {
          return {
            outputs: { responseMessage: `"${username}" is not a user.` },
          };
        }
      });

      // Create repo from template
      const newRepoRes = await fetch(
        `https://${apiURL}/repos/${env.CHALLENGE_ORG}/${env.TEMPLATE_REPO}/generate`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            owner: env.CHALLENGE_ORG,
            name: username + env.NEW_REPO_SUFFIX,
            private: true,
          }),
        },
      ).then(async (res: Response) => {
        if (res.status === 422) {
          return {
            outputs: {
              responseMessage:
                "Failed to create the repo. Check that it's not there already.",
            },
          };
        }
        if (res.status !== 201) {
          return {
            outputs: { responseMessage: "Failed to create the repo." },
          };
        }
        return (await res.json());
      });

      // Invite as collaborator
      const collaboratorRes = await fetch(
        `https://${apiURL}/repos/${newRepoRes?.full_name}/collaborators/${username}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ permission: "maintain" }),
        },
      ).then(async (res: Response) => {
        if (res.status === 204) {
          return {
            outputs: {
              responseMessage:
                "An existing collaborator or organization member was invited. Was that intended?",
            },
          };
        }

        if (res.status !== 201) {
          return {
            outputs: {
              responseMessage: `Failed to invite ${username} as collaborator.`,
            },
          };
        }
        return (await res.json());
      });

      // Build response message
      const responseMessage = `Success! Candidate ${username} was invited. ` +
        `He/she has received an email with the link: ${collaboratorRes.html_url}.`;

      return { outputs: { responseMessage: responseMessage } };
    } catch (err) {
      console.error(err);
      return {
        error: `An error was encountered: \`${err.message}\``,
      };
    }
  },
);
