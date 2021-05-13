//Imports - Keldoc module and config file
import keldoc from "@/modules/keldoc";
import config from "@/config/config.json"

// Defining loop variables
let appointmentInProgress = false;
let appointmentOk = false;
let isLogged = false;
const loginInfos = {
    userId: null as number,
    jwt: null as string,

}
const agendaIds = [] as Array<number>;
const motives: [number, number] = [0, 0];
const dates: { from: string, to: string } = { from: "", to: "" };
const takenAppointmentsIds: Array<number> = [];

// Defining methods
const selectNearestAppointment = async (motive: number, from: string, to: string) => {
    console.log("Fetching list from Keldoc")
    const appointmentList = await keldoc.getSlots(motive, agendaIds, from, to, loginInfos);
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
        appointmentInProgress = true;
        console.log("Getting nearest possibility for first dose")
        const firstAppointment = await selectNearestAppointment(motives[0], dates.from, dates.to);
        // Calculating 42 days from the first appointment
        const secondDate = new Date(firstAppointment.start_time)
        secondDate.setTime(secondDate.getTime() + (42 * 24 * 60 * 60 * 1000))
        const secondFromTo = secondDate.toISOString().split("T")[0];
        console.log("Getting nearest possibility for second dose")
        const secondAppointment = await selectNearestAppointment(motives[1], secondFromTo, secondFromTo);

        // Now that we've got our two appointments, we can post them to KelDoc
        const validated = await keldoc.postAppointments(firstAppointment, secondAppointment, loginInfos, motives);
        if (validated as boolean) {
            appointmentOk = true;
        }
        else {
            // If the ID can't be validated, we add them to the takenAppointmentIds array
            takenAppointmentsIds.push(firstAppointment.agenda_id);
            takenAppointmentsIds.push(secondAppointment.agenda_id);
        }
        appointmentInProgress = false;
    } catch (error) {
        appointmentInProgress = false;
        console.error(error)
    }
}

const login = async () => {
    try {
        await keldoc.authenticateUser(loginInfos);
        if (loginInfos.userId) {
            isLogged = true;
        }
    } catch (error) {
        throw error;
    }
}
const displayCategories = async () => {
    try {
        const motiveCategories = await keldoc.getMotiveCategoriesDescription(loginInfos, config.vaccinodrome);
        console.log("****");
        console.log("Notez votre choix dans le champ 'motiveCategory' du fichier config.json")
        console.log("****");
        for (const category in motiveCategories) {
            console.log(`${motiveCategories[category].name} - CHOIX ${category}`);
        }
    } catch (error) {
        throw error;
    }
}

const populateMotivesAndAgenda = async (category: number) => {
    console.log("getting Motives and vaccinators (lol?) agendas");
    const motiveCategories = await keldoc.getMotiveCategoriesDescription(loginInfos, config.vaccinodrome);
    console.log(`Selected Motive : ${motiveCategories[category].name}`)
    motives[0] = motiveCategories[category].motives[0].id;
    motives[1] = motiveCategories[category].motives[0].id + 1;

    // populating agendas!
    for (const agenda of motiveCategories[category].motives[0].agendas) {
        agendaIds.push(agenda.id);
    }
}

const setDates = () => {
    dates.from = new Date(Date.now()).toISOString().split('T')[0];
    dates.to = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
}

const app = async () => {
    try {
        console.log("KelDoc Autoplanner - commit 2021-05-13T18:01:47+0200");
        if (config.email && config.password) {
            console.log("Logging in with config.json credentials...")
            await login();
        }
        else {
            console.log("****");
            console.log("Veuillez configurer votre email et password dans le fichier config.json");
            console.log("Puis, relancez l'application");
            console.log("****");
            return;
        }

        if (config.motiveCategory < 0) {
            // We need to fetch the categories and display them in the console before exiting
            await displayCategories();
        }
        else {
            // We need to get the motive id's and agendaIds
            await populateMotivesAndAgenda(config.motiveCategory);
        }

        // Once logged in, we set the dates
        setDates()

        // Every 10sec until we've got a valid answer from KelDoc
        if (motives[0] && motives[1] && isLogged) {
            console.log("Configuration OK - Launching main loop");
            setInterval(() => {
                if (!appointmentInProgress) {
                    if (!appointmentOk) {
                        main();
                    }
                }
            }, 10000)
        }
    } catch (error) {
        console.error(error);
    }
}

app();

