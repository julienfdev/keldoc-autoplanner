import config from "@/config/config.json"
import fetch from 'node-fetch'

// Exporting the Keldoc module
export default class Keldoc {
    static getSlots = async (motive: number, from: string, to: string) => {
        // Setting headers and cookies
        const cookies = `nehs_consent=${config.nehs};kd-jwt-patients=${config.jwt};isLoggedIn=1`
        const headers = {
            "Content-Type": "application/json",
            cookie: cookies
        }

        // Parsing URL from config
        let url = `${config.routes.getSlots}/${motive}?from=${from}&to=${to}`
        for (const id of config.agendaIds) {
            url += `&agenda_ids[]=${id}`
        }

        // Fetching response from KelDoc
        const response = await fetch(url, {
            headers,
        })
        if (response.status === 200) {
            // If the request succeeded, we check if there are any availabilities, if not, we throw an error and skip the rest of the loop
            const object = await response.json();
            if(object.availabilities){
                return (object.availabilities)
            }else{
                throw "No slots available for now, skipping"
            }
        }
        else{
            throw await response.json();
        }
    }

    static postAppointments = async (firstAppointment: Record<string, any>, secondAppointment: Record<string, any>) => {
        console.log("Trying to post and validate appointments")
        // setting headers and cookies
        const cookies = `nehs_consent=${config.nehs};kd-jwt-patients=${config.jwt};isLoggedIn=1`
        const headers = {
            "X-App-Locale": "fr",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-App-Type": "patients",
            "X-Jwt-Token": config.jwt,
            cookie: cookies
        }
        // Formatting the body object
        const object = {
            consultations: [
                {
                    consultation: {
                        agenda_id: firstAppointment.agenda_id,
                        new_patient: true,
                        patient_comment: null as string,
                        start: Math.floor((new Date(firstAppointment.start_time)).getTime() / 1000)
                    },
                    motive_id: config.firstMotiveId,
                    user_id: config.userId
                }, {
                    consultation: {
                        agenda_id: secondAppointment.agenda_id,
                        new_patient: false,
                        patient_comment: null as string,
                        start: Math.floor((new Date(secondAppointment.start_time)).getTime() / 1000)
                    },
                    motive_id: config.secondMotiveId,
                    user_id: config.userId
                }
            ]
        }

        // We POST our appointments
        const response = await fetch(config.routes.postAppointments, {
            headers,
            method: "POST",
            body: JSON.stringify(object)
        })

        if (response.status === 201) {
            console.log("Appointments confirmed! check your phone!")
            return true;
        }
        else {
            console.error(await response.json());
            return false;
        }
    }

}