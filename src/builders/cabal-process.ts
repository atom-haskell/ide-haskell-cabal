import * as child_process from 'child_process'
import {kill} from 'process'
import * as path from 'path'
import {EOL} from 'os'

// // Atom dependencies
import {Directory, Point} from 'atom'

export interface IParams {
  onMsg?: (msg: UPI.IResultItem) => void
  onProgress?: (progress: number) => void
  onDone?: (done: {exitCode: number, hasError: boolean}) => void
  setCancelAction?: (action: () => void) => void
  severity: UPI.TSeverity
  severityChangeRx?: { [K in UPI.TSeverity]: RegExp }
}

class CabalProcess {
  private cwd: Directory
  private running: boolean
  private hasError: boolean

  constructor (command: string, args: string[], options: child_process.SpawnOptions, private params: IParams) {
    this.cwd = new Directory(options.cwd || '.')
    this.running = true
    // cabal returns failure when there are type errors _or_ when it can't
    // compile the code at all (i.e., when there are missing dependencies).
    // Since it's hard to distinguish between these two, we look at the
    // parsed errors;
    // this.hasError is set if we find an error/warning, see parseMessage
    this.hasError = false
    const proc = child_process.spawn(command, args, options)

    const buffered = (handleOutput: (lines: string[]) => void) => {
      let buffer = ''
      return (data: Buffer) => {
        const output = data.toString('utf8')
        const [first, ...tail] = output.split(EOL)
        // ^ The only place where we get os-specific EOL (CR/CRLF/LF)
        // in the rest of the code we're using just LF (\n)
        buffer += first
        if (tail.length > 0) { // it means there's at least one newline
          const lines = [buffer, ...(tail.slice(0, -1))]
          buffer = tail.slice(-1)[0]
          handleOutput(lines)
        }
      }
    }

    const blockBuffered = (handleOutput: (block: string) => void) => {
      // Start of a Cabal message
      const startOfMessage = /\n(?=\S)/g
      let buffer: string[] = []
      proc.on('close', () => handleOutput(buffer.join('\n')))
      return buffered((lines: string[]) => {
        buffer.push(...lines)
        // Could iterate over lines here, but this is easier, if not as effective
        const [first, ...tail] = buffer.join('\n').split(startOfMessage)
        if (tail.length > 0) {
          const last = tail.slice(-1)[0]
          buffer = last.split('\n')
          for (const block of [first, ...(tail.slice(0, -1))]) {
            handleOutput(block)
          }
        }
      })
    }

    if (this.params.setCancelAction) {
      this.params.setCancelAction(() => {
        try { kill(-proc.pid) } catch (e) { /*noop*/ }
        try { kill(proc.pid) } catch (e) { /*noop*/ }
        try { proc.kill() } catch (e) { /*noop*/ }
      })
    }

    const handleMessage = (msg: string) => {
      this.checkProgress(msg)
      this.checkSeverityChange(msg)
      const parsed = this.parseMessage(msg)
      if (parsed && this.params.onMsg) {
        this.params.onMsg(parsed)
      }
    }

    // Note: blockBuffered used twice because we need separate buffers
    // for stderr and stdout
    proc.stdout.on('data', blockBuffered(handleMessage))
    proc.stderr.on('data', blockBuffered(handleMessage))

    proc.on('close', (exitCode, signal) => {
      if (this.params.onDone) { this.params.onDone({exitCode, hasError: this.hasError}) }
      this.running = false
    })
  }

  private unindentMessage (lines: string[]) {
    const minIndent = Math.min(...(lines.map((line) => {
      const match = line.match(/^\s*/)
      if (match) {
        return match[0].length
      } else {
        return 0
      }
    })))
    return lines.map((line) => line.slice(minIndent)).join('\n')
  }

  private parseMessage (raw: string) {
    if (raw.trim() !== '') {
      const matchLoc = /^(.+):(\d+):(\d+):(?: (\w+):)?[ \t]*(\[[^\]]+\])?[ \t]*\n?([^]*)/
      const matched = (raw as any).trimRight().match(matchLoc)
      if (matched) {
        this.hasError = true

        const [file, line, col, rawTyp, context, msg] = matched.slice(1)
        const typ = rawTyp ? rawTyp.toLowerCase() : 'error'

        return {
          uri: path.isAbsolute(file) ? file : this.cwd.getFile(file).getPath(),
          position: new Point(parseInt(line, 10) - 1, parseInt(col, 10) - 1),
          context,
          message: {
            text: this.unindentMessage(msg.split('\n')),
            highlighter: 'hint.message.haskell'
          },
          severity: typ
        }
      } else {
        return {
          message: raw,
          severity: this.params.severity
        }
      }
    }
  }

  private checkSeverityChange (data: string) {
    if (! this.params.severityChangeRx) { return }
    for (const [sev, rx] of Object.entries(this.params.severityChangeRx)) {
      if (data.match(rx)) {
        this.params.severity = sev
        break
      }
    }
  }

  private checkProgress (data: string) {
    const match = data.match(/\[\s*([\d]+)\s+of\s+([\d]+)\s*\]/)
    if (match) {
      const progress = match[1], total = match[2]
      this.params.onProgress && this.params.onProgress(parseInt(progress, 10) / parseInt(total, 10))
    }
  }
}

export async function runCabalProcess (
  command: string, args: string[], options: child_process.SpawnOptions, pars: IParams
) {
  const newPars: IParams = {...pars}
  return new Promise<{exitCode: number, hasError: boolean}>((resolve) => {
    newPars.onDone = resolve
    // tslint:disable-next-line: no-unused-expression
    new CabalProcess(command, args, options, newPars)
  })
}
