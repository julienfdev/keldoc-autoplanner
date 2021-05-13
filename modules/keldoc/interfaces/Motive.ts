import MotiveAgenda from "./MotiveAgenda";

export default interface Motive{
    id: number;
    name: string;
    agendas: Array<MotiveAgenda>
}