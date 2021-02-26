import fs from 'fs';
import { resolve } from 'path';

export class FileService {
  public readInputFiles(folderName: string): string[] {
    console.log('Lendo o arquivo de entrada...');
    const inputPath = resolve(__dirname, '..', '..', '..', folderName);
    const arrayNamesFile = fs.readdirSync(inputPath);
    const arrayOfReadFiles = this.getFilesFromPath(arrayNamesFile, inputPath);

    return arrayOfReadFiles;
  }

  public writeOnFile(input: string, fileName: string, isOverrideWanted: boolean): void {
    const folderName = process.env.OUTPUT_FOLDER as string;
    const outputPath = resolve(__dirname, '..', '..', '..', folderName, fileName);
    const flag = isOverrideWanted ? 'w+' : 'a+';
    
    try {
      fs.writeFileSync(outputPath, input, {flag});
    } catch (error) {
      console.log(`Error while trying to write ${input} on path: ${outputPath}\\${fileName}. Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  private getFilesFromPath(arrayNamesFile: string[], inputPath: string): string[] {
    let arrayOfReadFiles = [] as string[];

    try {
      arrayNamesFile.forEach(fileName => {
        const file = fs.readFileSync(resolve(inputPath, fileName)).toString('utf-8');
  
        if (file)
          arrayOfReadFiles.push(file);
      });
    } catch (error) {
      console.log(`Error while trying to read on files from path ${inputPath}. Error: ${JSON.stringify(error)}.`);
      throw error;
    }

    return arrayOfReadFiles;
  }
}