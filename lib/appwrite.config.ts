import * as sdk from "node-appwrite";
import { Client, Databases, ID } from "appwrite";

export const {
  PROJECT_ID,
  API_KEY,
  DATABASE_ID,
  PATIENT_COLLECTION_ID,
  DOCTOR_COLLECTION_ID,
  APPOINTMENT_COLLECTION_ID,
  NEXT_PUBLIC_BUCKET_ID: BUCKET_ID,
  NEXT_PUBLIC_ENDPOINT: ENDPOINT,
} = process.env;

const endPoint = "https://cloud.appwrite.io/v1";

const client = new sdk.Client();

client
  .setEndpoint(endPoint)
  .setProject("673d9e550027076e5f41")
  .setKey(
    "standard_c8d1eb35300d89d8371b5f843c4168201e5ba809e3d567120b4f3f5e099b150fde9ab5f7f9188e2373ca6073b169f823b38e9b204d92a13a9721e34aff98980815c8fa2b10ca1494b8cd6c9fdd6e163dcf0eb3e20de45294885c89ddf1c2bdbd664235987d3ecb9e81a751f8b5b831f0f22ce1e167d0c58b582b7c4d068ba813"
  );

export const databases = new sdk.Databases(client);
export const storage = new sdk.Storage(client);
export const messaging = new sdk.Messaging(client);
export const users = new sdk.Users(client);

// ------------------ fixing

const newClient = new Client()
  .setEndpoint(endPoint)
  .setProject("673d9e550027076e5f41");

export const newDatabases = new Databases(newClient);
