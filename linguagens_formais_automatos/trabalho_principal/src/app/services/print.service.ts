import { Automato } from "../interfaces/automato.interface";
import { Simbol } from "../interfaces/simbol.interface";

export class PrintService {
  automato = {} as Automato;

  public printAutomato(automato: Automato, isFinalAf = false) {
    this.automato = automato;
    const simbols = this.getExistingSimbols(automato.simbols);
    let matriz = [['δ', ...simbols]];
    let newLine = [] as string[];
    let naoTerminalSimbol = -1;

    if (isFinalAf) {
      automato.simbols.sort((a, b) => {
        let numA = Number(a.nonTerminal.replace(/\[/g, '').replace(/\]/g, '').replace(',', '.'));
        let numB = Number(b.nonTerminal.replace(/\[/g, '').replace(/\]/g, '').replace(',', '.'));
        
        if (numA < numB) 
          return -1;
  
        if (numA > numB) 
          return 1
  
        return 0;
      });
    }

    automato.simbols.forEach((simbol, index) => {
      if (simbol.nonTerminal != naoTerminalSimbol) {
        if (newLine.length) 
          this.insertLineOnMatriz(matriz, newLine);
          
        naoTerminalSimbol = simbol.nonTerminal;
        newLine = [naoTerminalSimbol.toString()];
      }

      if (index === (automato.simbols.length-1)){
        if ((this.countTheRealSizeOfArray(newLine) < matriz[0].length) && simbol.terminal) {

          if (Array.isArray(simbol.next))
            newLine[matriz[0].indexOf(simbol.terminal)] = simbol.next.join(', ');
          
          if (!Array.isArray(simbol.next))
            newLine[matriz[0].indexOf(simbol.terminal)] = simbol.next.toString();
        }

        this.insertLineOnMatriz(matriz, newLine);
        return;
      }

      if ((simbol.next === -1 ||  (typeof simbol.next === 'string' && simbol.next.includes('-1'))) && !simbol.terminal) {
        return;
      } 

      if (Array.isArray(simbol.next)) {
        let nextNaoTerminalString = simbol.next.join(', ');
        newLine[matriz[0].indexOf(simbol.terminal)] = nextNaoTerminalString;
        return;
      }

      if (newLine[matriz[0].indexOf(simbol.terminal)]) {
        newLine[matriz[0].indexOf(simbol.terminal)] += `, ${simbol.next.toString()}`;
        return;
      }

      newLine[matriz[0].indexOf(simbol.terminal)] = simbol.next.toString();
    })

    console.table(matriz);
  }

  private insertLineOnMatriz(matriz: string[][], newLine: string[]) {
    const isAfterDeterminization = !!newLine.find(nL => nL && nL.toString().includes('['));
    let finalSimbols = this.automato.simbols.filter(simbol => simbol.isFinalSimbol);
    const finalNonTerminals = finalSimbols.map(simbol => simbol.nonTerminal);

    if (isAfterDeterminization) {
        finalNonTerminals.forEach(fNT => {
          if (newLine[0].includes(fNT) && !newLine[0].includes('*'))
            newLine[0] = `*${newLine[0]}`;
        });
    }

    if (!isAfterDeterminization && this.automato.finalNonTerminals.includes(newLine[0]))
      newLine[0] = `*${newLine[0]}`;

    this.fillLineWithoutNextTerminal(matriz, newLine);
    matriz.push(newLine);
  }

  private fillLineWithoutNextTerminal(matriz: string[][], newLine: string[]) {
    for (let i = 1; i < (matriz[0].length); i++) {
      if (!newLine[i])
        newLine[i] = '-';
    }
  }

  private countTheRealSizeOfArray(array: any[]) {
    let count = 0;
    array.forEach((terminal) => {
      if (terminal) count++
    });
    return count;
  }

  getExistingSimbols(simbols: Array<Simbol>) {
    let arraySimbols = [] as string[];

    simbols.forEach(simbol => {
      if (
        simbol.terminal && 
        !['ε', 'Ω'].includes(simbol.terminal) &&
        !arraySimbols.includes(simbol.terminal)
        )
      arraySimbols.push(simbol.terminal);
    })

    return arraySimbols.sort();
  }
}