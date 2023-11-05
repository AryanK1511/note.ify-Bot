require('dotenv').config();
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const token = process.env['TOKEN']
const { exec } = require('child_process');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');
process.env['GOOGLE_APPLICATION_CREDENTIALS'] = 'google_cloud_config/speech-to-text-404121-f86c17d1ff27.json'; // Replace with the actual path

// Logs the bot user if the server starts successfully
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Imports the Google Cloud client library
const projectId = process.env.PROJECT_ID; 
const keyFilename = 'google_cloud_config/speech-to-text-404121-f86c17d1ff27.json'; 

// Creates a storage object
const storage = new Storage({
  projectId,
  keyFilename,
});

// Setting up file upload to Google Cloud Bucket Storage
const bucketName = 'noteifybucket1';
const localFilePath = 'recording1.wav'; 

const bucket = storage.bucket(bucketName);
const fileName = path.basename(localFilePath);

const speech = require('@google-cloud/speech');
const speechClient = new speech.SpeechClient();

let dataRetrieved = "";
// ===== Handles the interaction when a user enters a slash command =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === 'start-recording') {
    await interaction.reply('Recording....');
    exec('python3 scripts/record.py', async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script: ${error}`);
        
      }
      // Upload the file to the bucket
      async function uploadFile() {
        await bucket.upload(localFilePath, {
          destination: fileName,
        });

        console.log(`${fileName} uploaded to ${bucketName}.`);
      }

      await uploadFile();
      let transcript = await quickstart();

      const apiKey = process.env.CHATGPT_API_KEY; // Replace with your ChatGPT API key
      const apiUrl = 'https://api.openai.com/v1/chat/completions'; // Check API documentation for the correct endpoint

      const inputText = transcript; // Replace with your input text

      const requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [{ 
          role: 'user', 
          content: 'Create relevant notes from the input text and summarize them into bullet points in markdown format.' 
        }, { 
          role: 'user', 
          content: inputText 
        }],
      };

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      };

      fetch(apiUrl, requestOptions)
  .then(response => response.json())
  .then(data => {
    console.log(`Data::: ${JSON.stringify(data)}`);
    const generatedNotes = data.choices[0].message.content; // Extract generated notes from the response

    // Format the notes as Markdown (you may use a library like 'marked' here)
    console.log(`GEN NOT -> ${generatedNotes}`); // Print or use the formatted notes

    dataRetrieved = generatedNotes;
    // Send the generatedNotes on Discord
    interaction.editReply("Recording complete.... :white_check_mark:"); // Edit the original reply with the generated notes
  })
  .catch(error => console.error('Error:', error));

    });

  } else if (interaction.commandName === 'stop-recording') {
    await interaction.reply(dataRetrieved);
    dataRetrieved = "";
  }
});

async function quickstart() {
  // The path to the remote LINEAR16 file stored in Google Cloud Storage
    const gcsUri = 'gs://noteifybucket1/recording1.wav';
  
    // The audio file's encoding, sample rate in hertz, and BCP-47 language code
    const audio = {
      uri: gcsUri,
    };
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    };
    const request = {
      audio: audio,
      config: config,
    };
  
    // Detects speech in the audio file
    const [response] = await speechClient.recognize(request);
    const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
    return transcription;
  }


client.login(token);