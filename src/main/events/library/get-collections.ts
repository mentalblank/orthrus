import { registerEvent } from "../register-event";
import { Collections } from "@main/services/collections";

const getCollections = async () => Collections.list();

registerEvent("getCollections", getCollections);
