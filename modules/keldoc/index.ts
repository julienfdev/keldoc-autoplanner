import config from "@/config/config.json"
import fetch from 'node-fetch';
import jwt from "jsonwebtoken"
import LoginInfos from "./interfaces/LoginInfos";
import Vaccinodrome from "./interfaces/Vaccinodrome";
import MotiveCategory from "./interfaces/MotiveCategory";

// Exporting the Keldoc module
export default class Keldoc {

    static authenticateUser = async (loginInfos: LoginInfos) => {
        try {
            const headers = {
                "Content-Type": "application/json"
            }
            const body = JSON.stringify({
                device_id: null,
                email: config.email,
                password: config.password,
                remember_me: 1
            })
            const response = await fetch(config.routes.login, {
                method: "POST",
                headers,
                body
            });
            if (response.status === 201) {
                const object = await response.json();

                const decodedToken = jwt.decode(object.jwt) as Record<string, any>;
                loginInfos.jwt = object.jwt;
                loginInfos.userId = decodedToken.user_id;
            }
            else {
                throw await response.json()
            }
        } catch (error) {
            throw error
        }

    }

    static getSlots = async (motive: number, agendas: Array<number>, from: string, to: string, loginInfos: LoginInfos) => {
        // Setting headers and cookies
        const cookies = `kd-jwt-patients=${loginInfos.jwt};isLoggedIn=1`
        const headers = {
            "Content-Type": "application/json",
            cookie: cookies
        }

        // Parsing URL from config
        let url = `${config.routes.getSlots}/${motive}?from=${from}&to=${to}`
        for (const id of agendas) {
            url += `&agenda_ids[]=${id}`
        }
        // Fetching response from KelDoc
        const response = await fetch(url, {
            headers,
        })
        if (response.status === 200) {
            // If the request succeeded, we check if there are any availabilities, if not, we throw an error and skip the rest of the loop
            const object = await response.json();
            if (object.availabilities) {
                return (object.availabilities)
            } else {
                console.log(object);
                throw "No slots available for now, skipping"
            }
        }
        else {
            throw await response.json();
        }
    }

    static postAppointments = async (firstAppointment: Record<string, any>, secondAppointment: Record<string, any>, loginInfos: LoginInfos, motives: Array<number>) => {
        console.log("Trying to post and validate appointments")
        // setting headers and cookies
        const cookies = `kd-jwt-patients=${loginInfos.jwt};isLoggedIn=1`
        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
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
                    motive_id: motives[0],
                    user_id: loginInfos.userId
                }, {
                    consultation: {
                        agenda_id: secondAppointment.agenda_id,
                        new_patient: false,
                        patient_comment: null as string,
                        start: Math.floor((new Date(secondAppointment.start_time)).getTime() / 1000)
                    },
                    motive_id: motives[1],
                    user_id: loginInfos.userId
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

    static getMotiveCategoriesDescription = async (loginInfos: LoginInfos, vaccinodrome: Vaccinodrome): Promise<Array<MotiveCategory>> => {
        // Parsing URL
        const url = "https://www.keldoc.com/api/patients/v2/clinics/2879/specialties/144/cabinets/18777/motive_categories";
        const cookies = `kd-jwt-patients=${loginInfos.jwt};isLoggedIn=1`
        const headers = {
            "Content-Type": "application/json",
            cookie: cookies
        }
        const response = await fetch(url, {
            headers
        });
        if (response.status === 200) {
            return await response.json();
        }
        else {
            throw await response.json();
        }
    }

}