import path from 'path';
import { authenticate } from '@google-cloud/local-auth';
import { gmail_v1, google } from 'googleapis';

// The scope for reading Gmail labels.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The path to the credentials file.
const CREDENTIALS_PATH = path.join(
  __dirname,
  '../../../config/credentials.json'
);

const authenticateGmail = async () => {
  const auth = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  const gmail = google.gmail({ version: 'v1', auth });

  return gmail;
};

/**
 * Returns the latest email as soon as it arrives.
 */
async function getLatestEmail(
  gmail: gmail_v1.Gmail
): Promise<gmail_v1.Schema$Message> {
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(async () => {
      try {
        const listRes = await gmail.users.messages.list({
          userId: 'me',
          q: 'newer_than:1m',
          maxResults: 1,
        });

        const messages = listRes.data.messages;

        // Check if messages exist and the first message has a valid ID
        if (messages && messages.length > 0 && messages[0].id) {
          clearInterval(intervalId);

          // By checking messages[0].id first, TS knows it's a string here
          const emailRes = await gmail.users.messages.get({
            userId: 'me',
            id: messages[0].id, // This is now safe
          });

          resolve(emailRes.data);
        }
      } catch (error) {
        clearInterval(intervalId);
        reject(error);
      }
    }, 5000);
  });
}

export const openEmail = async () => {
  const gmail = await authenticateGmail();

  return { getEmail: () => getLatestEmail(gmail) };
};
