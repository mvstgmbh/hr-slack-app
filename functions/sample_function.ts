import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

/**
 * Functions are reusable building blocks of automation that accept
 * inputs, perform calculations, and provide outputs. Functions can
 * be used independently or as steps in workflows.
 * https://api.slack.com/automation/functions/custom
 */
export const SampleFunctionDefinition = DefineFunction({
  callback_id: "sample_function",
  title: "Sample function",
  description: "A sample function",
  source_file: "functions/sample_function.ts",
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

/**
 * SlackFunction takes in two arguments: the CustomFunction
 * definition (see above), as well as a function that contains
 * handler logic that's run when the function is executed.
 * https://api.slack.com/automation/functions/custom
 */
export default SlackFunction(
  SampleFunctionDefinition,
  async ({ inputs, env }) => {
    const username = inputs.candidateGhUsername;

    const apiURL = "api.github.com";
    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + env.GITHUB_TOKEN,
      "Content-Type": "application/json",
    };

    try {
      // test user
      await fetch(`https://${apiURL}/users/${username}`, {
        method: "GET",
        headers,
      }).then(async (res: Response) => {
        if (res.status !== 200) {
          throw new Error("Could not find user.");
        }

        if ((await res.json())?.type !== "User") {
          throw new Error(`"${username}" is not a user.`);
        }
      });

      // create repo from template
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
          throw new Error(
            "Failed to create the repo. Check that it's not there already.",
          );
        }
        if (res.status !== 201) {
          throw new Error("Failed to create the repo.");
        }
        return (await res.json());
      });

      // invite as collaborator
      const collaboratorRes = await fetch(
        `https://${apiURL}/repos/${newRepoRes?.full_name}/collaborators/${username}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ permission: "maintain" }),
        },
      ).then(async (res: Response) => {
        if (res.status === 204) {
          console.warn(
            `An existing collaborator or organization member was invited`,
          );
        }

        if (res.status !== 201) {
          throw new Error(`Failed to invite ${username} as collaborator.`);
        }
        return (await res.json());
      });

      const responseMessage = `Candidate ${username} was invited! ` +
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
