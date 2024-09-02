import * as fs from 'node:fs'
import * as path from 'node:path'
import * as ts from 'typescript'

export function typecheckExample(code: string) {
  const projectRoot = process.cwd()
  const srcDir = path.join(projectRoot, 'src')
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json')

  // Read tsconfig.json
  const tsconfigFile = ts.readJsonConfigFile(tsconfigPath, ts.sys.readFile)

  // Parse the tsconfig
  const parsedCommandLine = ts.parseJsonSourceFileConfigFileContent(
    tsconfigFile,
    ts.sys,
    path.dirname(tsconfigPath),
  )

  // Merge compiler options
  const compilerOptions: ts.CompilerOptions = {
    ...parsedCommandLine.options,
    incremental: false,
    noEmit: true,
  }

  // Create a virtual file system
  const virtualFiles = new Map<string, string>()
  const virtualFilePath = path.join(srcDir, 'virtual-example.ts')
  virtualFiles.set(virtualFilePath, code)

  // Create a custom CompilerHost
  const compilerHost = ts.createCompilerHost(compilerOptions)
  compilerHost.getSourceFile = (
    fileName: string,
    languageVersion: ts.ScriptTarget,
  ) => {
    const sourceText =
      virtualFiles.get(fileName) || fs.readFileSync(fileName, 'utf-8')
    return ts.createSourceFile(fileName, sourceText, languageVersion)
  }
  compilerHost.fileExists = (fileName: string) => {
    return virtualFiles.has(fileName) || fs.existsSync(fileName)
  }
  compilerHost.readFile = (fileName: string) => {
    return virtualFiles.get(fileName) || fs.readFileSync(fileName, 'utf-8')
  }

  // Create program
  const program = ts.createProgram(
    [virtualFilePath],
    compilerOptions,
    compilerHost,
  )

  // Get diagnostics
  const diagnostics = ts.getPreEmitDiagnostics(program)
  for (const diagnostic of diagnostics) {
    if (diagnostic.file) {
      const { line, character } = ts.getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start!,
      )
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        '\n',
      )

      const error = ['\nError in code example:']
      error.push(`\`\`\`\n${code}\n\`\`\``)
      error.push(`(${line + 1},${character + 1}): ${message}`)
      error.push('')
      // biome-ignore lint/suspicious/noConsoleLog:
      console.log(error.join('\n\n'))
      process.exit(1)
    }

    // biome-ignore lint/suspicious/noConsoleLog:
    console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
  }
}
