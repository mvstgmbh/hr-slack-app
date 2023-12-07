import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const GitHubInvite = DefineFunction({
  callback_id: "github_invite_function",
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
    const newRepoName = username + env.NEW_REPO_SUFFIX;

    const apiURL = "api.github.com";
    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + env.GITHUB_TOKEN,
      "Content-Type": "application/json",
    };

    try {
      // Check if user exists
      const user = await fetch(`https://${apiURL}/users/${username}`, {
        method: "GET",
        headers,
      }).then(async (res: Response) => {
        if (res.status !== 200) {
          console.error(res);
          throw new Error("Could not find user");
        }

        if ((await res.json())?.type !== "User") {
          console.error(res);
          throw new Error(`"${username}" is not a user.`);
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
            name: newRepoName,
            private: true,
          }),
        },
      ).then(async (res: Response) => {
        if (res.status === 422) {
          console.error(res);
          throw new Error(
            `Failed to create the repo. Check that "${env.CHALLENGE_ORG}/${newRepoName}" doesn't exist already.`,
          );
        }
        if (res.status !== 201) {
          console.error(res);
          throw new Error("Failed to create the repo.");
        }
        return (await res.json());
      });

      // Invite as collaborator
      await fetch(
        `https://${apiURL}/repos/${newRepoRes?.full_name}/collaborators/${username}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ permission: "maintain" }),
        },
      ).then((res: Response) => {
        if (res.status === 204) {
          console.warn(
            "An existing collaborator or organization member was invited",
          );
        }

        if (res.status !== 204 && res.status !== 201) {
          // TODO: Delete repo
          console.error(res);
          throw new Error(`Failed to invite ${username} as collaborator.`);
        }
      });

      // Build response message
      // TODO: Change response to richtext
      // TODO: Add link to user.html_url
      const responseMessage =
        `🎉 Success! Candidate ${username} was invited. ` +
        `He/she has received an email with the link: https://github.com/${newRepoRes?.full_name}/invitations`;

      return { outputs: { responseMessage: responseMessage } };
    } catch (err) {
      console.error(err);
      return {
        outputs: {
          responseMessage: `⚠️ Ooops! ${err.message}`,
        },
      };
    }
  },
);