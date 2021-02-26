import { throws } from "assert";
import { Automato } from "../interfaces/automato.interface";
import { Simbol } from "../interfaces/simbol.interface";
import { FileService } from "./file.service";
import { PrintService } from "./print.service";

class DeterminizationService {
  private automato = {} as Automato;
  private originalAutomato = {} as Automato;
  private terminals = [] as string[];
  private fileService: FileService;
  private printService: PrintService;

  constructor() {
    this.fileService = new FileService();
    this.printService = new PrintService();
  }

  public determinize(automato: Automato) {
    console.log('Realizando determinização...');
    this.fillUsedVariables(automato);
    const isEnableToDeterminize = !!automato.simbols.find(simbol => Array.isArray(simbol.next) && simbol.next.length > 1);

    if (!isEnableToDeterminize) {
      console.log('Autômato não precisa ser determinizado.');
      this.putTerminalsOnStandard(this.automato.simbols);
      return;
    }
    
    let firstPositionOfNewSimbol = this.getFirstNonTerminalWithNewSimbolToCreate();
    let newSimbols = this.getFirstPositionsOfSimbols(firstPositionOfNewSimbol);
    let testedTerminals = [] as string[];
    let nonAddedTerminals = [] as string[];
    let hasNewSimbol = true;
    let backupLength = 0;
    let newerLength: number;
    this.getExistingTerminals();

    newSimbols = this.getNewSimbols(hasNewSimbol, newSimbols, testedTerminals);
    this.getNonAddedTerminals(testedTerminals, newSimbols, nonAddedTerminals);
    nonAddedTerminals = nonAddedTerminals.map(terminal => this.removeSpecialCharacters(terminal));

    newerLength = nonAddedTerminals.length;

    while (backupLength < newerLength) {
      backupLength = nonAddedTerminals.length;
      newSimbols = this.getNewSimbols(true, this.includeNonAddedSimbols(newSimbols, nonAddedTerminals), testedTerminals);
      nonAddedTerminals = [];
      this.getNonAddedTerminals(testedTerminals, newSimbols, nonAddedTerminals);
      nonAddedTerminals = nonAddedTerminals.map(terminal => this.removeSpecialCharacters(terminal));
      newerLength = nonAddedTerminals.length;
    }

    this.putTerminalsOnStandard(newSimbols);
    this.setFinalSimbols(newSimbols);
    this.automato.simbols = newSimbols;
    this.automato.terminals = this.terminals;
    this.printService.printAutomato(this.automato);
    this.fileService.writeOnFile(JSON.stringify(this.automato.simbols), 'afd.json', true);
  }


  private putTerminalsOnStandard(newSimbols: Simbol[]) {
    newSimbols.forEach(nS => {
      if (typeof nS.nonTerminal === 'number')
        nS.nonTerminal = `[${nS.nonTerminal}]`;

      if (Array.isArray(nS.next) && nS.next.length)
        nS.next = `[${nS.next.join()}]`;

      if (typeof nS.next === 'number')
        nS.next = `[${nS.next}]`;

      if (Array.isArray(nS.next) && !nS.next.length)
        nS.next = '-';
    });
  }

  private includeNonAddedSimbols(newSimbols: Simbol[], nonAddedTerminals: string[]) {
    newSimbols = newSimbols.concat(this.automato.simbols.filter(simbol => {
      if (nonAddedTerminals.includes(this.removeSpecialCharacters(simbol.nonTerminal.toString())))
        return simbol;
    }));
    return newSimbols;
  }

  private getNonAddedTerminals(testedTerminals: string[], newSimbols: Simbol[], nonAddedTerminals: string[]) {
    testedTerminals.forEach(terminal => {
      let usedTerminal: any = this.removeSpecialCharacters(terminal);
      let foundedSimbol = newSimbols.find(nS => {
        if (this.removeSpecialCharacters(nS.nonTerminal.toString()) === usedTerminal)
          return nS;
      });
      if (!foundedSimbol && !terminal.includes('-1'))
        nonAddedTerminals.push(terminal);
    });
  }

  private fillUsedVariables(automato: Automato) {
    const stringifyAutomato = JSON.stringify(automato);
    this.automato = automato;
    this.originalAutomato = JSON.parse(stringifyAutomato);
  }

  private setFinalSimbols(newSimbols: Simbol[]) {
    this.originalAutomato.finalNonTerminals.forEach(finalSimbol => {
      newSimbols.forEach(nS => {
        if (nS.nonTerminal.includes(finalSimbol))
          nS.isFinalSimbol = true;
      });
    });
  }

  private getNewSimbols(hasNewSimbol: boolean, newSimbols: Simbol[], testedTerminals: string[]) {
    let newSimbolsQueue = [] as string[];
    while (hasNewSimbol) {
      newSimbols = this.createNewSimbol(newSimbols, newSimbolsQueue, testedTerminals);
      hasNewSimbol = !!newSimbols.find(nS => Array.isArray(nS.next) && nS.next.length > 1);
    }
    return newSimbols;
  }

  private removeSpecialCharacters(string: string): any {
    return string.replace(/\[/g, '').replace(/\]/g, '');
  }

  private createNewSimbol(newSimbols: Simbol[], newSimbolsQueue: string[], testedTerminals: string[]) {
    newSimbols.forEach(newSimbol => {
      if (Array.isArray(newSimbol.next) && newSimbol.next.length > 1) {
        let newNonTerminal = `[${newSimbol.next.join()}]`;
        let nextToGet = '';

        if (!newSimbolsQueue.includes(newNonTerminal)) {
          newSimbolsQueue.push(newNonTerminal);
          nextToGet = newNonTerminal;
          newSimbol.next = newNonTerminal;
        }

        while (nextToGet) {
          let arrayOfNonTerminals = this.removeSpecialCharactersFromTerminal(nextToGet);
          let generatedSimbols = this.createNewNexts(arrayOfNonTerminals, nextToGet, newSimbolsQueue);
          if (!newSimbols.find(nS => {
            if (generatedSimbols.length &&
            nS.nonTerminal === generatedSimbols[0].nonTerminal && 
            nS.terminal === generatedSimbols[0].terminal)
              return true;
          }))
            newSimbols = newSimbols.concat(generatedSimbols);
          const findPositionOfActualSimbol = newSimbolsQueue.indexOf(nextToGet);

          if (findPositionOfActualSimbol < (newSimbolsQueue.length - 1))
            nextToGet = newSimbolsQueue[findPositionOfActualSimbol + 1];
          else {
             this.treatUsedSimbols(generatedSimbols, newSimbols);
             nextToGet = '';
          }
        }
        return;
      };

      let foundedSimbolsWithoutMultipleNext;
      if (Array.isArray(newSimbol.next) && !newSimbols.find(nS => nS.nonTerminal === newSimbol.next[0])) {
        foundedSimbolsWithoutMultipleNext = this.automato.simbols.filter(simbol => simbol.nonTerminal === newSimbol.next[0]);
        newSimbols = newSimbols.concat(foundedSimbolsWithoutMultipleNext);
      }
    });

    newSimbols.forEach(nS => {
        let usedSimbol = '';

        if (Array.isArray(nS.next)) {
          usedSimbol = `[${nS.next.join()}]`;
        }

        if (typeof nS.next === 'number') {
          usedSimbol = `[${nS.next}]`;
        }

        if (!usedSimbol) {
          usedSimbol = nS.next;
        }

        if (!testedTerminals.includes(usedSimbol))
          testedTerminals.push(usedSimbol);
    });

    newSimbols.forEach(nS => {
      if (Array.isArray(nS.next) && newSimbolsQueue.includes(`[${nS.next.join()}]`))
        nS.next = `[${nS.next.join()}]`;
    })

    return newSimbols;
  }

  private treatUsedSimbols(generatedSimbols: Simbol[], newSimbols: Simbol[]) {
    if (Array.isArray(generatedSimbols) && !generatedSimbols.length)
      return;
    
    const lastSimbolGenerated = generatedSimbols[0].nonTerminal;

    newSimbols.forEach(nSimbols => {
      if (Array.isArray(nSimbols.next)) {
        if (lastSimbolGenerated === `[${nSimbols.next.join()}]`) {
          nSimbols.next = lastSimbolGenerated;
        }
      }
    });
  }

  private createNewNexts(arrayOfNonTerminals: string[], nextToGet: string, newSimbolQueue: string[]) {
    let newNexts = [] as any[];
    let generatedSimbols = [] as Simbol[];
    
    this.terminals.forEach(terminal => {
      arrayOfNonTerminals.forEach((nxt: any) => {
        const foundedSimbol = this.automato.simbols.find(simbol => simbol.terminal === terminal && simbol.nonTerminal.toString() === nxt);
        
        if (!foundedSimbol)
          return;
        
        const usedSimbol = {...foundedSimbol};

        if (Array.isArray(usedSimbol.next)) {
          usedSimbol.next = usedSimbol.next.filter((next: any) => {
            const foundedNext = newNexts.find(newNext => newNext.includes(next.toString()));

            if (!foundedNext)
              return true;
          })

          if (!newNexts.includes(usedSimbol.next.join())) {
            const newCharacter = this.removeSpecialCharacters(usedSimbol.next.join());

            if (newCharacter) 
              return newNexts.push(newCharacter);
          }

          if (newNexts.includes(usedSimbol.next.join())) 
            return;
        }

        let searchSimbol = this.removeSpecialCharacters(usedSimbol.next.toString()); 
        
        if (!newNexts.find(newNext => newNext.includes(searchSimbol)))
          newNexts.push(searchSimbol);
      });

      if (Array.isArray(newNexts) && !newNexts.length)
        return;

      if (newNexts.length > 1) {
        let alreadyExistsTerminal = [] as string[];

        newNexts.forEach(newNext => {
          if (newNext.length > 1) {
            let arrayNexts = newNext.split(',');

            arrayNexts.forEach((next: any) => {
              if (!alreadyExistsTerminal.includes(next))
                alreadyExistsTerminal.push(next)
            });

            return;
          }

          if (!alreadyExistsTerminal.includes(newNext))
            alreadyExistsTerminal.push(newNext);
        });

        newNexts = alreadyExistsTerminal;
      }

      let usedNext = Array.isArray(newNexts) ? newNexts.join() : newNexts;

      const newSimbol = {
        terminal,
        nonTerminal: nextToGet,
        next: `[${usedNext}]`,
        isFinalSimbol: false
      };
      
      console.log('Novo estado gerado: ');
      console.log(newSimbol);
      
      generatedSimbols.push(newSimbol);

      const foundedSimbol = this.automato.simbols.find(simbol => simbol.nonTerminal.toString() === usedNext);

      if (!newSimbolQueue.includes(`[${usedNext}]`) && `[${usedNext}]`.length > 3 && !foundedSimbol) {
        newSimbolQueue.push(`[${usedNext}]`);
      }

      newNexts = [];
    });

    return generatedSimbols;
  }

  private removeSpecialCharactersFromTerminal(nextToGet: string) {
    return nextToGet.replace(/\[/g, '').replace(/\]/g, '').split(',');
  }

  private getFirstNonTerminalWithNewSimbolToCreate(): string {
    const result = this.automato.simbols.find(simbol => Array.isArray(simbol.next) && simbol.next.length > 1)?.nonTerminal;

    if (result || result === 0)
      return result.toString();

    return '';
  }

  private getFirstPositionsOfSimbols(firstPositionOfNewSimbol: string): Simbol[] {
    if (!firstPositionOfNewSimbol || isNaN(Number(firstPositionOfNewSimbol)))
      return [];

    return this.automato.simbols.filter(simbol => Number(simbol.nonTerminal) <= Number(firstPositionOfNewSimbol));
  }

  private getExistingTerminals(): void {
    this.automato.simbols.forEach(simbol => {
      if (!this.terminals.includes(simbol.terminal) && simbol.terminal)
      this.terminals.push(simbol.terminal);
    });
  }
}

export default new DeterminizationService();