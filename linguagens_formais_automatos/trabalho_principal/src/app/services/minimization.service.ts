import { Automato } from "../interfaces/automato.interface";
import { Simbol } from "../interfaces/simbol.interface";
import { PrintService } from "./print.service";
import { FileService } from "./file.service";

class MinizationService {
  private printService: PrintService;
  private fileService: FileService;
  private automato = {} as Automato;

  constructor() {
    this.printService = new PrintService();
    this.fileService = new FileService();
  }

  public minimize(automato: Automato) {
    this.automato = automato;
    this.deleteUnreachableSimbols();
    this.deleteDeadSimbols();
  }

  private deleteUnreachableSimbols() {
    console.log('Removendo os inalcançáveis...')
    const starterSimbols = this.automato.simbols.filter(simbol => simbol.nonTerminal === 0);
    const mainPath = [0];
    let pathlength: number;
    let backupLength: number;

    this.processFoundSimbols(starterSimbols, mainPath);

    pathlength = mainPath.length;

    do {
      backupLength = mainPath.length;

      mainPath.forEach(simbol => {
        if (simbol === 0)
          return;

        if (Array.isArray(simbol)) {
          simbol.forEach(mainSb => {
            const foundedSimbols = this.automato.simbols.filter(sb => sb.nonTerminal === mainSb);
            this.processFoundSimbols(foundedSimbols, mainPath);
          });

          return;
        }

        const foundedSimbols = this.automato.simbols.filter(sb => sb.nonTerminal === simbol);

        foundedSimbols.forEach(simbol => {
          this.fillMainPathWithSimbols(simbol, mainPath);
        })
      })

      pathlength = mainPath.length;
    }
     while (pathlength > backupLength);

     const unreachableSimbols = this.automato.simbols.filter(simbol => !mainPath.includes(simbol.nonTerminal));

     if (!unreachableSimbols.length) {
        console.log('Não existem incalçáveis a serem deletados.');
        return;
     }

     const newSimbols = this.automato.simbols.filter(simbol => !unreachableSimbols.includes(simbol))
     this.automato.simbols = newSimbols;
     this.printService.printAutomato(this.automato);
     this.fileService.writeOnFile(JSON.stringify(this.automato.simbols), 'afd_sem_inalcaveis.json', true);
  }

  private deleteDeadSimbols() {
    console.log('Removendo os mortos...');
    const finalSimbols = this.automato.simbols.filter(simbol => simbol.isFinalSimbol);
    const finalNonTerminals = [] as string[];
    let liveNonTerminals = [] as string[];
    finalSimbols.forEach(simbol => {
      if (!finalNonTerminals.includes(simbol.nonTerminal)) 
        finalNonTerminals.push(simbol.nonTerminal)
    });
    
    finalNonTerminals.forEach(nonTerminal => {
      let nonTerminalConnectedWithFinalSimbols  = this.automato.simbols.filter(simbol => {
        if (Array.isArray(simbol.next)) {
          return simbol.next.includes(nonTerminal);
        }
        
        return simbol.next === nonTerminal;
      });
      
      if (!liveNonTerminals.includes(nonTerminal))
        liveNonTerminals.push(nonTerminal)
      
      let backupLength: number;
      let pathLength: number;
      
      nonTerminalConnectedWithFinalSimbols.forEach(simbol => {
        if (!liveNonTerminals.includes(simbol.nonTerminal))
          liveNonTerminals.push(simbol.nonTerminal);
      });

      do {
        backupLength = liveNonTerminals.length;

        nonTerminalConnectedWithFinalSimbols = this.automato.simbols.filter(simbol => {
          if (Array.isArray(simbol.next)) {
            return !!simbol.next.find(sNxt => liveNonTerminals.includes(sNxt));
          }
          
          return liveNonTerminals.includes(simbol.next);
        });
        
        nonTerminalConnectedWithFinalSimbols.forEach(simbol => {
          if (!liveNonTerminals.includes(simbol.nonTerminal))
            liveNonTerminals.push(simbol.nonTerminal);
        });

        pathLength = liveNonTerminals.length;
      } while (pathLength > backupLength);
    });

    const deadSimbols = this.automato.simbols.filter(simbol => !liveNonTerminals.includes(simbol.nonTerminal) && !simbol.isFinalSimbol)
    let listDeletedSimbols = [] as any[];
    deadSimbols.forEach(dSimbols => listDeletedSimbols.push(dSimbols.nonTerminal));

    if (!deadSimbols.length) {
      console.log('Não existem mortos a serem deletados.');
      return;
    }

    const newSimbols = this.automato.simbols.filter(simbol => !deadSimbols.includes(simbol))

    newSimbols.forEach(nSimbol => {
      if (Array.isArray(nSimbol.next)) {
        nSimbol.next = nSimbol.next.filter(nSNext => !listDeletedSimbols.includes(nSNext));
      }
    })

     this.automato.simbols = newSimbols;
     this.printService.printAutomato(this.automato);
     this.fileService.writeOnFile(JSON.stringify(this.automato.simbols), 'afd_sem_mortos.json', true);
  }

  private fillUsedAutomatos(automato: Automato) {
    this.automato = automato;
  }

  private processFoundSimbols(foundedSimbols: Simbol[], mainPath: number[]) {
    foundedSimbols.forEach(simbol => {
      this.fillMainPathWithSimbols(simbol, mainPath);
    });
  }

  private fillMainPathWithSimbols(simbol: Simbol, mainPath: number[]) {
    if (Array.isArray(simbol.next)) 
        return this.fillPathIfSimbolNextIsArray(simbol, mainPath);
  
      this.insertSimpleSymbolOnMainPath(mainPath, simbol);
  }

  private insertSimpleSymbolOnMainPath(mainPath: number[], simbol: Simbol) {
    if (!mainPath.includes(simbol.next) && simbol.next >= 0)
      mainPath.push(simbol.next);
  }

  private fillPathIfSimbolNextIsArray(simbol: Simbol, mainPath: number[]) {
    simbol.next.forEach((sbNext: any) => {
      if (!mainPath.includes(sbNext) && sbNext >= 0)
        mainPath.push(sbNext);
    });
    return;
  }
}

export default new MinizationService();