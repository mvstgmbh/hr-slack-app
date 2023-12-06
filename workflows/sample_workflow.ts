import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { SampleFunctionDefinition } from "../functions/sample_function.ts";

/**
 * A workflow is a set of steps that are executed in order.
 * Each step in a workflow is a function.
 * https://api.slack.com/automation/workflows
 *
 * This workflow uses interactivity. Learn more at:
 * https://api.slack.com/automation/forms#add-interactivity
 */
const SampleWorkflow = DefineWorkflow({
  callback_id: "sample_workflow",
  title: "Sample workflow",
  description: "A sample workflow",
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

/**
 * For collecting input from users, we recommend the
 * OpenForm Slack function as a first step.
 * https://api.slack.com/automation/functions#open-a-form
 */
const inputForm = SampleWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Send message to channel",
    interactivity: SampleWorkflow.inputs.interactivity,
    submit_label: "Send message",
    fields: {
      elements: [{
        name: "channel",
        title: "Channel to send message to",
        type: Schema.slack.types.channel_id,
        default: SampleWorkflow.inputs.channel,
      }, {
        name: "ghUsername",
        title: "Candidate's GitHub username",
        type: Schema.types.string,
        long: false,
      }],
      required: ["channel", "ghUsername"],
    },
  },
);

/**
 * Custom functions are reusable building blocks
 * of automation deployed to Slack infrastructure. They
 * accept inputs, perform calculations, and provide
 * outputs, just like typical programmatic functions.
 * https://api.slack.com/automation/functions/custom
 */
const sampleFunctionStep = SampleWorkflow.addStep(SampleFunctionDefinition, {
  candidateGhUsername: inputForm.outputs.fields.ghUsername,
});

/**
 * SendMessage is a Slack function. These are
 * Slack-native actions, like creating a channel or sending
 * a message and can be used alongside custom functions in a workflow.
 * https://api.slack.com/automation/functions
 */

SampleWorkflow.addStep(Schema.slack.functions.SendEphemeralMessage, {
  channel_id: inputForm.outputs.fields.channel,
  user_id: SampleWorkflow.inputs.user,
  message: sampleFunctionStep.outputs.responseMessage,
});

export default SampleWorkflow;
