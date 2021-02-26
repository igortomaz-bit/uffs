import { Automato } from "../interfaces/automato.interface";
import { Simbol } from "../interfaces/simbol.interface";
import { FileService } from "./file.service";
import { PrintService } from "./print.service";

class AutomatoService {
  private inputFolderName = process.env.INPUT_FOLDER as string;
  private inputOriginalString = [] as Array<string>;
  private inputString = [] as Array<string>;
  private automato: Automato;
  private fileService: FileService;
  private printService: PrintService;
  private regexGetRules = /\<.*?>/;

  constructor() {
    this.fileService = new FileService();
    this.printService = new PrintService();
    this.automato = {
      simbols: [],
      paths: [],
      finalNonTerminals: [],
      numberOfCreatedNonTerminals: 0
    };
  }


  public buildAutomato() {
    this.getInputFromFile();
    console.log('Construído o AFND...');
    let existingRules = [] as any[];

    this.inputString.forEach(string => {
      let isRuleString = this.regexGetRules.test(string);

      if (isRuleString) {
        let isNewGramar = string.replace(/ /g, '').includes('<S>::=');

        if (isNewGramar) {
          existingRules = [];
        }

        return this.buildAutomatoForNewRules(string, existingRules);
      }
        

      this.buildAutomatoForSimpleString(string);
    })
  
    this.sortSimbols();
    this.groupEqualOperations();
    this.automato.finalNonTerminals = this.getFinalSimbols().map(simbol => simbol.toString());
    this.fileService.writeOnFile(JSON.stringify(this.automato.simbols), 'afnd.json', true);
    this.printService.printAutomato(this.automato);
    return this.automato;
  }

  private getInputFromFile(): void {
    this.inputOriginalString = this.fileService.readInputFiles(this.inputFolderName);
    this.treatGotString();
  }

  private treatGotString(): void {
    this.inputOriginalString.forEach(string => {
      let arrayString = string.split('\n');

      arrayString = arrayString.map(string => {
        return string.replace(/\r|\n|\t/g, '');
      });

      this.inputString.push(...arrayString);
    })
  }

  private buildAutomatoForNewRules(string: string, existingRules: any[]) {
    const grammarRules = this.getTreatedGrammarLine(string);
    const nonTerminalSimbol = this.removeSpecialCharactersFromRule(grammarRules[0]);
    const nextRules = grammarRules.filter(rule => grammarRules.indexOf(rule) > 0);

    nextRules.forEach(rule => {
      if (rule.length === 1) {
        if (rule === 'ε') {
          let actualRule = existingRules.find((rules: any) => rules.nonTerminal === nonTerminalSimbol);
          let foundedTerminal = this.automato.simbols.find(simbol => simbol.nonTerminal === actualRule.generatedNumber);
          
          if (!foundedTerminal) {
            this.automato.simbols.push({
              terminal: '',
              nonTerminal: actualRule.generatedNumber,
              next: -1,
              isFinalSimbol: true
            })
          }

          return this.handleEpsilonOnGrammarLine(actualRule.generatedNumber);
        }
          
        rule += '<Ω>';
      }

      const targetNonTerminalSimbol = rule.substr(rule.indexOf('<') + 1, rule.indexOf('>') - 2);
      const actualTerminalSimbol = rule.substr(0, rule.indexOf('<'));
      let actualRule = existingRules.find((rules: any) => rules.nonTerminal === nonTerminalSimbol);

      if (!existingRules.length)
        actualRule = this.addFirstRuleToExistingRules(actualRule, nonTerminalSimbol, existingRules);

      if (targetNonTerminalSimbol === 'Ω')
        return this.handleFinalSimbolOfGrammarLine(targetNonTerminalSimbol, actualRule, actualTerminalSimbol);

      let findNextRule = existingRules.find((rules: any) => rules.nonTerminal === targetNonTerminalSimbol);

      if (!actualRule)
        actualRule = this.addNewRuleToExistingRules(actualRule, nonTerminalSimbol, existingRules);

      if (!findNextRule)
        findNextRule = this.addNewRuleToExistingRules(findNextRule, targetNonTerminalSimbol, existingRules);

      if (!actualRule.generatedNumber)
        return this.handleFirstOfGrammarLine(actualTerminalSimbol, findNextRule);

      this.handleNextOfGrammarLine(actualTerminalSimbol, actualRule, findNextRule);
    });
  }

  private handleFinalSimbolOfGrammarLine(targetNonTerminalSimbol: string, actualRule: any, actualTerminalSimbol: string) {
    const finalSimbol = {
      terminal: '',
      nonTerminal: this.getNextNonTerminal(),
      next: -1,
      isFinalSimbol: true
    };

    if (!actualRule.generatedNumber) {
      const nextRule = {
        nonTerminal: targetNonTerminalSimbol,
        generatedNumber: this.getNextNonTerminal()
      };
      this.handleFirstOfGrammarLine(actualTerminalSimbol, nextRule);
    }

    if (actualRule.generatedNumber) {
      const actualSimbol = {
        terminal: actualTerminalSimbol,
        nonTerminal: actualRule.generatedNumber,
        next: finalSimbol.nonTerminal,
        isFinalSimbol: false
      }

      this.automato.simbols.push(actualSimbol)
    }

    this.automato.simbols.push(finalSimbol);
    this.incrementNumberOfNonTerminals();
  }

  private handleEpsilonOnGrammarLine(nonTerminalSimbol: number) {
    let simbols = this.automato.simbols.filter(simb => simb.nonTerminal === nonTerminalSimbol);
    simbols.forEach(simb => simb.isFinalSimbol = true );
  }

  private handleNextOfGrammarLine(actualTerminalSimbol: string, actualRule: any, findNextRule: any) {
    const simbol = {
      terminal: actualTerminalSimbol,
      nonTerminal: actualRule.generatedNumber,
      next: findNextRule.generatedNumber,
      isFinalSimbol: false
    };

    this.automato.simbols.push(simbol);
  }

  private handleFirstOfGrammarLine(actualTerminalSimbol: string, findNextRule: any) {
    const foundExistingSimbol = this.automato.simbols.find(simbol => 
      ((simbol.terminal === actualTerminalSimbol) && !simbol.nonTerminal));

    if (!foundExistingSimbol) 
      return this.createFirstElementForGrammarLine(actualTerminalSimbol, findNextRule);

    this.updateExistingFirstElementOfGrammarLine(foundExistingSimbol, findNextRule);
  }

  private updateExistingFirstElementOfGrammarLine(foundExistingSimbol: Simbol, findNextRule: any) {
    if (Array.isArray(foundExistingSimbol.next))
      foundExistingSimbol.next.push(findNextRule.generatedNumber);
  }

  private createFirstElementForGrammarLine(actualTerminalSimbol: string, findNextRule: any) {
    const initialSimbol = {
      terminal: actualTerminalSimbol,
      nonTerminal: 0,
      next: [findNextRule.generatedNumber],
      isFinalSimbol: false
    };

    this.automato.simbols.push(initialSimbol);
    return;
  }

  private addFirstRuleToExistingRules(actualRule: any, nonTerminalSimbol: string, existingRules: any[]) {
    actualRule = {
      nonTerminal: nonTerminalSimbol,
      generatedNumber: 0
    };

    existingRules.push(actualRule);
    return actualRule;
  }

  private addNewRuleToExistingRules(actualRule: any, nonTerminalSimbol: string, existingRules: any[]) {
    actualRule = {
      nonTerminal: nonTerminalSimbol,
      generatedNumber: this.getNextNonTerminal()
    };

    existingRules.push(actualRule);
    this.incrementNumberOfNonTerminals();
    return actualRule;
  }

  private removeSpecialCharactersFromRule(rule: string) {
    return rule.replace(/\</g, '').replace(/\>/g, '');
  }

  private getTreatedGrammarLine(string: string) {
    return string.split(' ').filter(char => 
      char &&
      char !== '|' && 
      char !== '::='
    );
  }

  private buildAutomatoForSimpleString(string: string) {
    let arrayString = string.split('');

    arrayString.forEach((char, index) => {
      if (!index)
        return this.handleFirstElementOfString(char);

      this.handleNextElementOfString(char);

      if (index == (arrayString.length - 1)) {
        this.handleFinalElementOfString();
      }
    });
  }

  private handleFirstElementOfString(char: string) {
    const foundExistingSimbol = this.automato.simbols.find(simbol => 
      ((simbol.terminal === char) && !simbol.nonTerminal));

    if (foundExistingSimbol) 
      return this.addANewSimbolAlreadyExistingSimbol(foundExistingSimbol);
    
    this.createInitialSimbolForSimpleString(char);
  }
  
  private handleNextElementOfString(char: string) {
    this.createNextElementForSimpleString(char);
    this.incrementNumberOfNonTerminals();
  }

  private handleFinalElementOfString() {
    this.createFinalSimbolForSimpleString();
  }

  private addANewSimbolAlreadyExistingSimbol(foundExistingSimbol: Simbol) {
    if (Array.isArray(foundExistingSimbol.next)) {
      foundExistingSimbol.next.push(this.getNextNonTerminal());
      this.incrementNumberOfNonTerminals();
    }
    return;
  }

  private createInitialSimbolForSimpleString(char: string) {
    const simbol = {
      terminal: char,
      nonTerminal: 0,
      next: [this.getNextNonTerminal()],
      isFinalSimbol: false
    };
    this.automato.simbols.push(simbol);
    this.incrementNumberOfNonTerminals();
  }

  private createNextElementForSimpleString(char: string) {
    const newSimbol = {
      terminal: char,
      nonTerminal: this.getNonTerminal(),
      next: this.getNextNonTerminal(),
      isFinalSimbol: false
    };

    this.automato.simbols.push(newSimbol);
  }

  private createFinalSimbolForSimpleString() {
    const finalSimbol = {
      terminal: '',
      nonTerminal: this.getNonTerminal(),
      next: -1,
      isFinalSimbol: true
    };
    this.automato.simbols.push(finalSimbol);
  }

  private getNextNonTerminal() {
    return this.automato.numberOfCreatedNonTerminals + 1;
  }

  private getNonTerminal() {
    return this.automato.numberOfCreatedNonTerminals;
  }

  private incrementNumberOfNonTerminals() {
    this.automato.numberOfCreatedNonTerminals++;
  }

  private getFinalSimbols() {
    const finalSimbols = this.automato.simbols.filter(simbolo => simbolo.isFinalSimbol);
    let arrayFinalSimbols = [] as number[];

    finalSimbols.forEach(finalSimbol => {
      if (!arrayFinalSimbols.includes(finalSimbol.nonTerminal))
        arrayFinalSimbols.push(finalSimbol.nonTerminal);
    });

    return arrayFinalSimbols;
  }

  private groupEqualOperations() {
    const simbols = this.automato.simbols;
    let newSimbols = [] as any[];
    simbols.forEach(simbol => {
      const actualSimbol = newSimbols.find(nS => {
        if (
          nS.terminal === simbol.terminal &&
          nS.nonTerminal === simbol.nonTerminal
        )
          return true;
      });

      if (actualSimbol && (actualSimbol.next !== simbol.next)) {
        if (Array.isArray(actualSimbol.next)) {
          if (Array.isArray(simbol.next)) {
            actualSimbol.next = actualSimbol.next.concat(simbol.next);
            return;
          }
            
          actualSimbol.next.push(simbol.next);
          return;
        }

        if (Array.isArray(simbol.next)) {
          actualSimbol.next = [actualSimbol.next, ...simbol.next]
          return;
        } 
          
        actualSimbol.next = [actualSimbol.next, simbol.next]
      }

      if (!actualSimbol) {
        newSimbols.push({...simbol});
      }
    });

    this.automato.simbols = newSimbols;
  }

  private sortSimbols() {
    this.automato.simbols.sort((a, b) => {
      if (a.nonTerminal > b.nonTerminal)
        return 1;
    
      if (a.nonTerminal < b.nonTerminal)
        return -1;
    
      return 0;
    });
  }
}

export default new AutomatoService();