"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import CustomFormField from "../CustomFormField";
import SubmitButton from "../SubmitButton";
import { useEffect, useState } from "react";
import {
  CreateAppointmentSchema,
  getAppointmentSchema,
  UserFormValidation,
} from "@/lib/validation";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/actions/patient.action";
import { FormFieldType } from "./PatientForm";
import Image from "next/image";
import { SelectItem } from "../ui/select";
import { Doctors } from "@/constants";
import {
  createAppointment,
  sendSMSNotification,
  updateAppointment,
} from "@/lib/actions/appointment.actions";
import { ID } from "node-appwrite";
import { databases, messaging } from "@/lib/appwrite.config";
import { parseStringify } from "@/libs/utils";
import { Appointment } from "@/types/appwrite.types";
import { revalidatePath } from "next/cache";
import { formatDateTime } from "@/libs/utils";

const AppointmentForm = ({
  userId,
  pateintId,
  type = "create",
  appointment,
  setOpen,
}: {
  userId: string;
  pateintId: string;
  type: "create" | "cancel" | "schedule";
  appointment: Appointment;
  setOpen: (open: boolean) => void;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const AppointmentFormValidation = getAppointmentSchema(type);

  const form = useForm<z.infer<typeof AppointmentFormValidation>>({
    resolver: zodResolver(AppointmentFormValidation),
    defaultValues: {
      primaryPhysician: appointment && appointment.primaryPhysician,
      schedule: appointment
        ? new Date(appointment.schedule)
        : new Date(Date.now()),
      reason: appointment ? appointment.reason : "",
      note: appointment?.note || "",
      cancellationReason: appointment?.cancellationReason || "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof AppointmentFormValidation>) {
    setIsLoading(true);

    let status = "";

    switch (type) {
      case "schedule":
        status = "scheduled";
        break;
      case "cancel":
        status = "cancelled";
        break;
      default:
        status = "pending";
        break;
    }

    try {
      if (type === "create" && pateintId) {
        const appointmentData = {
          userId,
          patient: pateintId,
          primaryPhysician: values.primaryPhysician,
          schedule: new Date(values.schedule),
          reason: values.reason!,
          note: values.note,
          status: status as Status,
        };

        console.log("appointment data ", appointmentData);
        const createsAppointment = await databases.createDocument(
          "673d9f15002de1fd5669",
          "673da1ab002c26b498a8",
          ID.unique(),
          appointmentData
        );

        let parseAppointment = parseStringify(createsAppointment);

        if (parseAppointment) {
          form.reset();
          router.push(
            `/patients/${userId}/new-appointment/success?appointmentId=${parseAppointment.$id}`
          );
        }
      } else {
        const appointmentToUpdate = {
          userId,
          appointmentId: appointment.$id,
          appointment: {
            primaryPhysician: values.primaryPhysician,
            schedule: new Date(values.schedule),
            status: status as Status,
            cancellationReason: values.cancellationReason,
          },
          type,
        };

        console.log("Appointment data ", appointmentToUpdate);

        // const updatedAppointment = await updateAppointment(appointmentToUpdate);

        const updatedAppointment = await databases.updateDocument(
          "673d9f15002de1fd5669",
          "673da1ab002c26b498a8",
          appointmentToUpdate.appointmentId,
          appointmentToUpdate.appointment
        );

        if (!updatedAppointment) {
          throw new Error("Appointment not found");
        }

        const smsMessage = `Hi, it's Carepulse. ${
          type === "schedule"
            ? `Your appointment has been scheduled for ${
                formatDateTime(appointment.schedule!).dateTime
              }  with Dr. ${appointment.primaryPhysician}`
            : `We regret to inform you that your appointment has been cancelled for the following reason: ${appointment.cancellationReason}`
        }`;

        // await sendSMSNotification(userId, smsMessage);

        const message = await messaging.createSms(
          ID.unique(),
          smsMessage,
          [],
          [userId]
        );

        //sms
        // revalidatePath("/admin");

        const uupdatedAppointment = parseStringify(updatedAppointment);

        if (uupdatedAppointment) {
          setOpen && setOpen(false);
          form.reset();
        }
      }

      // const appointment = await createAppointment(appointmentData);
    } catch (error) {
      console.log(error);
    }

    setIsLoading(false);
  }

  let buttonLabel;

  switch (type) {
    case "cancel":
      buttonLabel = "Cancel Appointment";
      break;
    case "create":
      buttonLabel = "Create Appointment";
      break;
    case "schedule":
      buttonLabel = "Schedule Appointment";
      break;
    default:
      break;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1">
        {type === "create" && (
          <section className="mb-12 space-y-4">
            <h1 className="header">New Appointment</h1>
            <p className="text-dark-700">
              Request a new appointment in 10 second
            </p>
          </section>
        )}

        {type !== "cancel" && (
          <>
            <CustomFormField
              fieldType={FormFieldType.SELECT}
              control={form.control}
              name="primaryPhysician"
              label="Doctor"
              placeholder="Select a Doctor"
            >
              {Doctors.map((doctor, i) => (
                <SelectItem key={doctor.name + i} value={doctor.name}>
                  <div className="flex cursor-pointer items-center gap-2">
                    <Image
                      src={doctor.image}
                      width={32}
                      height={32}
                      alt="doctor"
                      className="rounded-full border border-dark-500"
                    />
                    <p>{doctor.name}</p>
                  </div>
                </SelectItem>
              ))}
            </CustomFormField>

            <CustomFormField
              fieldType={FormFieldType.DATE_PICKER}
              control={form.control}
              name="schedule"
              label="Expected appointment date"
              showTimeSelect
              dateFormat="MM/dd/yyyy - h:mm aa"
            ></CustomFormField>

            <div className="flex flex-col gap-6 xl:flex-row">
              <CustomFormField
                fieldType={FormFieldType.TEXTAREA}
                control={form.control}
                name="reason"
                label="Reason for appointment"
                placeholder="Enter reason for appointment"
              />
              <CustomFormField
                fieldType={FormFieldType.TEXTAREA}
                control={form.control}
                name="note"
                label="Notes"
                placeholder="Enter notes"
              />
            </div>
          </>
        )}

        {type === "cancel" && (
          <>
            <CustomFormField
              fieldType={FormFieldType.TEXTAREA}
              control={form.control}
              name="cancellationReason"
              label="Reason for cancellation"
              placeholder="Enter reason for cancellation"
            />
          </>
        )}

        {/* <Button type="submit">Submit</Button> */}
        <SubmitButton
          isLoading={isLoading}
          className={`${
            type === "cancel" ? "shad-danger-btn" : "shad-primary-btn"
          } w -full`}
        >
          {buttonLabel}
        </SubmitButton>
      </form>
    </Form>
  );
};

export default AppointmentForm;
