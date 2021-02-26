import { Automato } from "../interfaces/automato.interface";
import { FileService } from "./file.service";
import { PrintService } from "./print.service";

class ErrorStateService {
  private printService: PrintService;
  private fileService: FileService;
  private automato = {} as Automato;

  constructor() {
    this.printService = new PrintService();
    this.fileService = new FileService();
  }
  
  public setErrorStates(automato: Automato) {
    console.log('Gerando estado de erros...');
    this.automato = automato;
    const nonTerminalForErrors = `[${++automato.numberOfCreatedNonTerminals}]`;
    console.log(`Não terminal ${nonTerminalForErrors} será utilizado para os estados de erro.`);
    const existingTerminals = automato.terminals || this.getTerminals();
    const existingNonTerminals = [] as string[];
    let obtainedFinalSimbols = [] as string[];
    let backupLength = this.automato.simbols.length;

    if (!existingTerminals)
      return;

    this.fillArrayOfExistingFinalSimbols(obtainedFinalSimbols);

    this.fillArrayOfExistingNonTerminals(automato, existingNonTerminals, nonTerminalForErrors);

    existingNonTerminals.forEach(nonTerminal => {
      existingTerminals.forEach((terminal: any) => {
        const foundedSimbol = this.automato.simbols.find(simbol => simbol.nonTerminal === nonTerminal && simbol.terminal === terminal);

        if (!foundedSimbol) {
          this.automato.simbols.push({
            terminal,
            nonTerminal,
            next: nonTerminalForErrors,
            isFinalSimbol: (nonTerminal === nonTerminalForErrors)
          })
        }
      });
    });

    if (backupLength < this.automato.simbols.length) {
      existingTerminals.forEach((terminal: any) => {
        const foundedSimbol = this.automato.simbols.find(simbol => simbol.nonTerminal === nonTerminalForErrors && simbol.terminal === terminal);

        if (!foundedSimbol) {
          this.automato.simbols.push({
            terminal,
            nonTerminal: nonTerminalForErrors,
            next: nonTerminalForErrors,
            isFinalSimbol: true
          })
        }
      });
    }

    this.setEmptyStateWithError(nonTerminalForErrors);
    this.setFinalSimbolAsFinal(obtainedFinalSimbols);

    const newSimbols = this.automato.simbols.filter(simbol => simbol.next !== '[-1]');
    this.automato.simbols = newSimbols;
    this.printService.printAutomato(this.automato, true);
    this.fileService.writeOnFile(JSON.stringify(this.automato.simbols), 'afd_final.json', true);
  }

  private setEmptyStateWithError(nonTerminalForErrors: string) {
    this.automato.simbols.forEach(simbol => {
      if (simbol.next === '-') {
        simbol.next = nonTerminalForErrors;
      }
    });
  }

  private getTerminals() {
    const arrayTerminals = [] as string[];

    this.automato.simbols.forEach(simbol => {
      if (simbol.terminal && !arrayTerminals.includes(simbol.terminal))
        arrayTerminals.push(simbol.terminal);
    });

    return arrayTerminals;
  }

  private setFinalSimbolAsFinal(obtainedFinalSimbols: string[]) {
    this.automato.simbols.forEach(simbol => {
      if (obtainedFinalSimbols.includes(simbol.nonTerminal))
        simbol.isFinalSimbol = true;
    });
  }

  private fillArrayOfExistingNonTerminals(automato: Automato, existingNonTerminals: string[], nonTerminalForErrors: string) {
    automato.simbols.forEach(simbol => {
      if (!existingNonTerminals.includes(simbol.nonTerminal))
        existingNonTerminals.push(simbol.nonTerminal);
    });
  }

  private fillArrayOfExistingFinalSimbols(obtainedFinalSimbols: string[]) {
    const existingFinalSimbols = this.automato.simbols.filter(simbol => simbol.next === '[-1]');

    if (existingFinalSimbols.length) {
      existingFinalSimbols.forEach(simbol => {
        obtainedFinalSimbols.push(simbol.nonTerminal);
      });
    }
  }
}

export default new ErrorStateService();