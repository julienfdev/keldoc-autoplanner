//Imports - Keldoc module and config file
import keldoc from "@/modules/keldoc";
import config from "@/config/config.json"

// Defining loop variables
let appointmentOk = false;
const takenAppointmentsIds: Array<number> = [];

// Defining methods
const selectNearestAppointment = async (motive: number, from: string, to: string) => {
    console.log("Fetching list from Keldoc")
    const appointmentList = await keldoc.getSlots(motive, from, to);
    let appointment: Record<string, any>

    for (const date in appointmentList) {
        if (!(appointmentList[date] as Array<Record<string, any>>).length) {
            console.log(`No appointments on the ${date}, skipping`)
        }
        else {
            // filter appointmentList with invalid appointments ID to skip them, if any
            const filteredList = (appointmentList[date] as Array<Record<string, any>>).filter((value) => {
                return !takenAppointmentsIds.includes(value.agenda_id)
            })
            console.log(`Availabilities on the ${date}, selecting the first one`);
            appointment = filteredList[0];
            break;
        }
    }
    if (!appointment) {
        // Resetting invalid ID's array
        takenAppointmentsIds.splice(0, takenAppointmentsIds.length);
        throw `couldn't find any availabilities for motive ${motive}, will retry later`
    }
    else {
        console.log(`Selected appointment #${appointment.agenda_id}, Date : ${appointment.start_time}`);
        return appointment;
    }
}

// Main planner routine
const main = async () => {
    try {
        console.log("Getting nearest possibility for first dose")
        const firstAppointment = await selectNearestAppointment(config.firstMotiveId, config.from, config.to);
        // Calculating 42 days from the first appointment
        const secondDate = new Date(firstAppointment.start_time)
        secondDate.setTime(secondDate.getTime() + (42 * 24 * 60 * 60 * 1000))
        const secondFromTo = secondDate.toISOString().split("T")[0];
        console.log("Getting nearest possibility for second dose")
        const secondAppointment = await selectNearestAppointment(config.secondMotiveId, secondFromTo, secondFromTo);

        // Now that we've got our two appointments, we can post them to KelDoc
        const validated = await keldoc.postAppointments(firstAppointment, secondAppointment);
        if (validated as boolean) {
            appointmentOk = true;
        }
        else {
            // If the ID can't be validated, we add them to the takenAppointmentIds array
            takenAppointmentsIds.push(firstAppointment.agenda_id);
            takenAppointmentsIds.push(secondAppointment.agenda_id);
        }
    } catch (error) {
        console.error(error)
    }
}


// Every 10sec until we've got a valid answer from KelDoc
setInterval(() => {
    if (!appointmentOk) {
        main();
    }
}, 10000)