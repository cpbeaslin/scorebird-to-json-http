import http from 'http';
import readline from 'readline';
import CognitoIdentity from 'aws-sdk/clients/cognitoidentity.js';
import {iot, mqtt} from 'aws-iot-device-sdk-v2';
import dotenv from 'dotenv';

dotenv.config(); // This loads the variables from .env file to process.env

const awsEndpoint = process.env.AWS_ENDPOINT;
const identityPoolId = process.env.IDENTITY_POOL_ID;
const region = process.env.REGION; // Assuming the region based on the provided endpoint

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const menu = [];

// Iterate over environment variables to populate the menu
for (let i = 1; i <= process.env.MAX_LOCATIONS; i++) {
  const name = process.env[`LOCATION_${i}_NAME`];
  const id = process.env[`LOCATION_${i}_ID`];
  if (name && id) {
    menu.push({ name, id });
  }
}

const scoreboardData = {}; // To store the scoreboard data

async function displayMenu() {
  console.log('Select a location:');
  menu.forEach((item, index) => {
    console.log(`${index + 1}) ${item.name}`);
  });
}

async function startServer(nestID) {
  const server = http.createServer();

  async function subscribe(connection, nestID) {
    server.on('request', (req, res) => {
      outputJSONViaHTTP(res);
    });

    connection.subscribe(`NESTv2/${nestID}/scoreboard`, mqtt.QoS.AtLeastOnce, (topic, payload) => {
      const decoder = new TextDecoder('utf8');
      const json = decoder.decode(payload);
      const score_data = JSON.parse(json);

      // Update scoreboard data
      Object.assign(scoreboardData, score_data);
      console.log('Score update:', score_data);
    });
  }

  const ci = new CognitoIdentity({ region: region });

  ci.getId({ IdentityPoolId: identityPoolId }, (err, data) => {
    ci.getCredentialsForIdentity({ IdentityId: data.IdentityId }, async (err, data) => {
      const credentials = data.Credentials;
      const connection = await connect(credentials);
      await subscribe(connection, nestID);
    });
  });

  const port = process.env.PORT; // You can change the port if needed
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
}

function buildConfig(credentials) {
  const config_builder = iot.AwsIotMqttConnectionConfigBuilder.new_with_websockets();
  config_builder.with_credentials(region, credentials.AccessKeyId, credentials.SecretKey, credentials.SessionToken);
  config_builder.with_endpoint(awsEndpoint);
  config_builder.with_clean_session(false);
  config_builder.with_client_id("test-" + Math.floor(Math.random() * 100000000));
  return config_builder.build();
}

function connect(credentials) {
  const config = buildConfig(credentials);
  const mqttClient = new mqtt.MqttClient();
  const connection = mqttClient.new_connection(config);

  connection.on('connect', () => {
    console.log('connected...');
  });

  return new Promise((resolve, reject) => {
    connection.connect()
        .then(() => resolve(connection))
        .catch((err) => reject(err));
  });
}

function outputJSONViaHTTP(res) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify([scoreboardData]));
}

async function main() {
  await displayMenu();

  rl.question('Select a location (enter the number): ', async (choice) => {
    const selectedOption = menu[parseInt(choice) - 1];

    if (!selectedOption) {
      console.log('Invalid selection.');
      process.exit(1);
    }

    let nestID = selectedOption.id;
    if (selectedOption.id === '') {
      nestID = await askForCustomID();
    }

    await startServer(nestID);
    rl.close();
  });
}

async function askForCustomID() {
  return new Promise((resolve) => {
    rl.question('Enter the custom Nest ID: ', (customID) => {
      resolve(customID);
    });
  });
}

main().catch((err) => console.error(err));
