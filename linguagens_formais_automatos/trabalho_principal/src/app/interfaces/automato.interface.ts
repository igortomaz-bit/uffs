import { Simbol } from "./simbol.interface";

export interface Automato {
  simbols: Array<Simbol>;
  paths: Array<Array<string>>;
  numberOfCreatedNonTerminals: number;
  finalNonTerminals: Array<string>;
  terminals?: Array<String>;
}