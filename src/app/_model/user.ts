import { Collection } from "./collection";

export class User {
    publicAddress: string;
    name: string;
    avatar: string;
    coverImage: string;
    evmAddress: string;
    collections: Collection[];
}