import { User } from "./auth";

export interface WaitingListItem {
    id: number;
    patientId: number;
    joinedAt: string;
    status: "waiting" | "in_consultation" | "left";
    patient: User;
}

export interface WaitingRoomState {
    patients: WaitingListItem[];
    status: string; // "connecting", "waiting", "in_consultation", "left"
    lastUpdated: number;
}
