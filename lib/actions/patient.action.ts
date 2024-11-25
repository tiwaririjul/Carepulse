import { ID, Query } from "node-appwrite";
import {
  BUCKET_ID,
  DATABASE_ID,
  databases,
  ENDPOINT,
  PATIENT_COLLECTION_ID,
  PROJECT_ID,
  storage,
  users,
  newDatabases,
} from "../appwrite.config";
import { parseStringify } from "@/libs/utils";
// import { InputFile } from "node-appwrite/file";
import { InputFile } from "node-appwrite/file";

export const createUser = async (user: CreateUserParams) => {
  try {
    const newUser = await users.create(
      ID.unique(),
      user.email,
      user.phone,
      undefined,
      user.name
    );

    return parseStringify(newUser);
  } catch (error: any) {
    console.log("Error ", error, error.code);
    if (error && error?.code === 409) {
      const documents = await users.list([Query.equal("email", [user.email])]);
      return documents?.users[0];
    }
  }
};

export const getUser = async (userId: string) => {
  try {
    const user = await users.get(userId);

    return parseStringify(user);
  } catch (error) {
    console.log(error);
  }
};

export const registerPatient = async ({
  // identificationDocument,
  ...patient
}: RegisterUserParams) => {
  try {
    let file;
    // if (identificationDocument) {
    //   const inputFile = InputFile.fromBuffer(
    //     identificationDocument?.get("blobFile") as Blob,
    //     identificationDocument?.get("fileName") as string
    //   );

    //   file = await storage.createFile(
    //     "673da2360012dc064301",
    //     ID.unique(),
    //     inputFile
    //   );
    // }

    const {
      email,
      phone,
      userId,
      name,
      privacyConsent,
      gender,
      birthDate,
      address,
      occupation,
      emergencyContactName,
      emergencyContactNumber,
      insuranceProvider,
      insurancePolicyNumber,
      allergies,
      currentMedication,
      familyMedicalHistory,
      pastMedicalHistory,
      identificationType,
      identificationNumber,
      primaryPhysician,
    } = patient;

    const data = {
      email,
      phone,
      userId,
      name,
      privacyConsent,
      gender,
      birthDate,
      address,
      occupation,
      emergencyContactName,
      emergencyContactNumber,
      insuranceProvider,
      insurancePolicyNumber,
      allergies,
      currentMedication,
      familyMedicalHistory,
      pastMedicalHistory,
      identificationType,
      identificationNumber,
      primaryPhysician,
    };

    console.log("data ", data);

    const newPatient = await databases.createDocument(
      "673d9f15002de1fd5669",
      "673da0d1000f0163d276",
      ID.unique(),
      data
    );

    return parseStringify(newPatient);
  } catch (error) {}
};

export const getPatient = async (userId: string) => {
  try {
    // const user = await users.get(userId);

    const patients = await databases.listDocuments(
      "673d9f15002de1fd5669",
      "673da0d1000f0163d276",
      [Query.equal("userId", userId)]
    );

    return parseStringify(patients.documents[0]);
  } catch (error) {
    console.log(error);
  }
};
