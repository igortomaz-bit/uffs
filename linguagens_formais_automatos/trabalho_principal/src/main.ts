import dotenv from 'dotenv';
dotenv.config();

import automatoService from './app/services/automato.service';
import determinizationService from './app/services/determinization.service';
import minizationService from './app/services/minimization.service';
import errorStateService from './app/services/errorState.service';

let automato = automatoService.buildAutomato();
console.log('----------------------------------------------------');
minizationService.minimize(automato);
console.log('----------------------------------------------------');
determinizationService.determinize(automato);
console.log('----------------------------------------------------');
errorStateService.setErrorStates(automato)
