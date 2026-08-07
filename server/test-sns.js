import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
const sns = new SNSClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
sns.send(new PublishCommand({
  TopicArn: "arn:aws:sns:eu-north-1:459600194137:classgrid-incident-alerts",
  Message: "Test"
})).then(() => console.log("SUCCESS")).catch(e => console.error(e.message));
