"use server";

import { ID, Query } from "node-appwrite";
import { databases, messaging } from "../appwrite.config";
import { parseStringify } from "@/libs/utils";
import { Appointment } from "@/types/appwrite.types";
import { revalidatePath } from "next/cache";
import { formatDateTime } from "@/libs/utils";

export const createAppointment = async (
  appointment: CreateAppointmentParams
) => {
  // throw new Error("Missing required fields in appointment data");

  try {
    const newAppointment = await databases.createDocument(
      "673d9f15002de1fd5669",
      "673da1ab002c26b498a8",
      ID.unique(),
      appointment
    );

    return parseStringify(newAppointment);
  } catch (error) {
    console.log("error ", error);
  }
};

export const getAppointment = async (appointmentId: string) => {
  try {
    const appointment = await databases.getDocument(
      "673d9f15002de1fd5669",
      "673da1ab002c26b498a8",
      appointmentId
    );

    return parseStringify(appointment);
  } catch (error) {
    console.log(error);
  }
};

export const getRecentAppoinmentList = async () => {
  try {
    const appointments = await databases.listDocuments(
      "673d9f15002de1fd5669",
      "673da1ab002c26b498a8",
      [Query.orderDesc("$createdAt")]
    );

    const intitialCounts = {
      scheduledCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
    };

    const counts = (appointments.documents as Appointment[]).reduce(
      (acc, appointment) => {
        if (appointment.status === "scheduled") {
          acc.scheduledCount += 1;
        } else if (appointment.status === "pending") {
          acc.pendingCount += 1;
        } else if (appointment.status === "cancelled") {
          acc.cancelledCount += 1;
        }

        return acc;
      },
      intitialCounts
    );

    // revalidatePath("/admin");

    const data = {
      totalCount: appointments.total,
      ...counts,
      documents: appointments.documents,
    };

    return parseStringify(data);
  } catch (error) {
    console.log(error);
  }
};

interface nextAppointment {
  primaryPhysician: string;
  schedule: Date;
  status: string;
  cancellationReason: string;
}

interface Params {
  appointmentId: string;
  userId: string;
  appointment: nextAppointment;
  type: string;
}

export const updateAppointment = async ({
  appointmentId,
  userId,
  appointment,
  type,
}: UpdateAppointmentParams) => {
  console.log("Indo ", appointmentId, userId, appointment, type);
  try {
    const updatedAppointment = await databases.updateDocument(
      "673d9f15002de1fd5669",
      "673da1ab002c26b498a8",
      appointmentId,
      appointment
    );

    if (!updatedAppointment) {
      throw new Error("Appointment not found");
    }

    //sms

    const smsMessage = `Hi, it's Carepulse. ${
      type === "schedule"
        ? `Your appointment has been scheduled for ${
            formatDateTime(appointment.schedule!).dateTime
          }  with Dr. ${appointment.primaryPhysician}`
        : `We regret to inform you that your appointment has been cancelled for the following reason: ${appointment.cancellationReason}`
    }`;

    await sendSMSNotification(userId, smsMessage);

    revalidatePath("/admin");
    return parseStringify(updatedAppointment);
  } catch (error) {
    console.log(error);
  }
};

export const sendSMSNotification = async (userId: string, content: string) => {
  try {
    const message = await messaging.createSms(
      ID.unique(),
      content,
      [],
      [userId]
    );

    return parseStringify(message);
  } catch (error) {}
};

export const revalidate = async () => {
  console.log("Revalidate ");
  revalidatePath("/admin");
};
