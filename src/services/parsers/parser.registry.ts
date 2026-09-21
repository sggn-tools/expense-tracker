/**
 * src/services/parsers/parser.registry.ts
 *
 * Registro central de parsers.
 * Para agregar un nuevo banco, solo importa su parser aquí.
 *
 * El orquestador (ingestion.service.ts) itera esta lista
 * sin saber nada de los bancos específicos.
 */

import { BankEmailParser } from "./base.parser";
import { BancoAgricolaParser } from "./agricola.parser";
import { SimanParser } from "./siman.parser";

export const PARSER_REGISTRY: BankEmailParser[] = [
    new BancoAgricolaParser(),
    new SimanParser(),
    // new BancoPromerica(),  ← agregar aquí cuando se necesite
];