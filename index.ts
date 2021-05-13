import keldoc from "@/modules/keldoc";
import config from "@/config/config.json"

let appointmentOk = false;
const takenAppointmentsIds: Array<number> = [];

const selectNearestAppointment = async (motive: number, from: string, to: string) => {
    console.log("Fetching list from Keldoc")
    const appointmentList = await keldoc.getSlots(motive, from, to);
    let appointment: Record<string, any>

    for (const date in appointmentList) {
        if (!(appointmentList[date] as Array<Record<string, any>>).length) {
            console.log(`No appointments on the ${date}, skipping`)
        }
        else {
            // filter appointmentList
            const filteredList = (appointmentList[date] as Array<Record<string, any>>).filter((value) => {
                return !takenAppointmentsIds.includes(value.agenda_id)
            })

            console.log(`Availabilities on the ${date}, selecting the first one`);
            appointment = filteredList[0];
            break;
        }
    }
    if (!appointment) {
        throw `couldn't find any availabilities for motive ${motive}, trying later`
        takenAppointmentsIds.splice(0, takenAppointmentsIds.length);

    }
    else {
        console.log(`Selected appointment #${appointment.agenda_id}, Date : ${appointment.start_time}`);
        return appointment;
    }
}

const main = async () => {
    try {
        console.log("Getting nearest possibility for first appointment")
        const firstAppointment = await selectNearestAppointment(config.firstMotiveId, config.from, config.to);
        // Calculating 42 days from the first appointment
        const secondDate = new Date(firstAppointment.start_time)
        secondDate.setTime(secondDate.getTime() + (42 * 24 * 60 * 60 * 1000))
        const secondFromTo = secondDate.toISOString().split("T")[0];
        const secondAppointment = await selectNearestAppointment(config.secondMotiveId, secondFromTo, secondFromTo);

        const validated = await keldoc.postAppointments(firstAppointment, secondAppointment);
        if (validated as boolean) {
            appointmentOk = true;
        }
        else {
            takenAppointmentsIds.push(firstAppointment.agenda_id);
            takenAppointmentsIds.push(secondAppointment.agenda_id);
        }
    } catch (error) {
        console.error(error)
    }
}


setInterval(() => {
    if (!appointmentOk) {
        main();
    }
}, 10000)