import * as child_process from 'child_process'
import { kill } from 'process'
import * as path from 'path'
import { EOL } from 'os'
import * as UPI from 'atom-haskell-upi'

// // Atom dependencies
import { Directory, Point } from 'atom'

export interface IParams {
  readonly onMsg?: (msg: UPI.IResultItem) => void
  readonly onProgress?: (progress: number) => void
  readonly onDone?: (done: { exitCode: number; hasError: boolean }) => void
  readonly setCancelAction?: (action: () => void) => void
  readonly severity: UPI.TSeverity
  readonly severityChangeRx?: { [K in UPI.TSeverity]: RegExp }
}

function unindentMessage(lines: string[]) {
  const minIndent = Math.min(
    ...lines.map((line) => {
      const match = line.match(/^\s*/)
      if (match) {
        return match[0].length
      } else {
        return 0
      }
    }),
  )
  return lines.map((line) => line.slice(minIndent)).join('\n')
}

function parseMessage(
  raw: string,
  cwd: Directory,
  defaultSeverity: UPI.TSeverity,
): [boolean, UPI.IResultItem?] {
  if (raw.trim() !== '') {
    const matchLoc = /^(.+):(\d+):(\d+):(?: (\w+):)?[ \t]*(\[[^\]]+\])?[ \t]*\n?([^]*)/
    const matched = raw.trimRight().match(matchLoc)
    if (matched) {
      const [file, line, col, rawTyp, context, msg] = matched.slice(1)
      const typ = rawTyp ? rawTyp.toLowerCase() : 'error'

      return [
        true,
        {
          uri: path.isAbsolute(file) ? file : cwd.getFile(file).getPath(),
          position: new Point(parseInt(line, 10) - 1, parseInt(col, 10) - 1),
          context,
          message: {
            text: unindentMessage(msg.split('\n')),
            highlighter: 'hint.message.haskell',
          },
          severity: typ,
        },
      ]
    } else {
      return [
        false,
        {
          message: raw,
          severity: defaultSeverity,
        },
      ]
    }
  }
  return [false, undefined]
}

function runBuilderProcess(
  command: string,
  args: string[],
  options: child_process.SpawnOptions,
  params: IParams,
) {
  const cwd = new Directory(options.cwd || '.')
  // cabal returns failure when there are type errors _or_ when it can't
  // compile the code at all (i.e., when there are missing dependencies).
  // Since it's hard to distinguish between these two, we look at the
  // parsed errors;
  // this.hasError is set if we find an error/warning, see parseMessage
  let hasError = false
  let severity: UPI.TSeverity = params.severity
  const proc = child_process.spawn(command, args, options)
  proc.on('error', function(err) {
    atom.notifications.addError(err.name, {
      detail: err.message,
      dismissable: true,
    })
  })

  const buffered = (handleOutput: (lines: string[]) => void) => {
    let buffer = ''
    return (data: Buffer) => {
      const output = data.toString('utf8')
      const [first, ...tail] = output.split(EOL)
      // ^ The only place where we get os-specific EOL (CR/CRLF/LF)
      // in the rest of the code we're using just LF (\n)
      buffer += first
      if (tail.length > 0) {
        // it means there's at least one newline
        const lines = [buffer, ...tail.slice(0, -1)]
        buffer = tail.slice(-1)[0]
        handleOutput(lines)
      }
    }
  }

  const blockBuffered = (handleOutput: (block: string) => void) => {
    // Start of a Cabal message
    const startOfMessage = /\n(?=\S)(?!\d+ \|)/g
    let buffer: string[] = []
    proc.on('close', () => handleOutput(buffer.join('\n')))
    return buffered((lines: string[]) => {
      buffer.push(...lines)
      // Could iterate over lines here, but this is easier, if not as effective
      const [first, ...tail] = buffer.join('\n').split(startOfMessage)
      if (tail.length > 0) {
        const last = tail.slice(-1)[0]
        buffer = last.split('\n')
        for (const block of [first, ...tail.slice(0, -1)]) {
          handleOutput(block)
        }
      }
    })
  }

  if (params.setCancelAction) {
    params.setCancelAction(() => {
      try {
        kill(-proc.pid)
      } catch (e) {
        /*noop*/
      }
      try {
        kill(proc.pid)
      } catch (e) {
        /*noop*/
      }
      try {
        proc.kill()
      } catch (e) {
        /*noop*/
      }
    })
  }

  const handleMessage = (msg: string) => {
    if (params.onProgress) {
      // check progress
      const match = msg.match(/\[\s*([\d]+)\s+of\s+([\d]+)\s*\]/)
      if (match) {
        const progress = match[1]
        const total = match[2]
        params.onProgress(parseInt(progress, 10) / parseInt(total, 10))
      }
    }
    if (params.severityChangeRx) {
      // check severity change
      for (const [sev, rx] of Object.entries(params.severityChangeRx)) {
        if (msg.match(rx)) {
          severity = sev
          break
        }
      }
    }
    let parsed: UPI.IResultItem | undefined
    ;[hasError, parsed] = parseMessage(msg, cwd, severity)
    if (parsed && params.onMsg) params.onMsg(parsed)
  }

  // Note: blockBuffered used twice because we need separate buffers
  // for stderr and stdout
  proc.stdout.on('data', blockBuffered(handleMessage))
  proc.stderr.on('data', blockBuffered(handleMessage))

  proc.on('close', (exitCode) => {
    if (params.onDone) {
      params.onDone({ exitCode, hasError: hasError })
    }
  })
}

export async function runProcess(
  command: string,
  args: string[],
  options: child_process.SpawnOptions,
  pars: IParams,
) {
  return new Promise<{ exitCode: number; hasError: boolean }>((resolve) => {
    const newPars: typeof pars = { ...pars, onDone: resolve }
    runBuilderProcess(command, args, options, newPars)
  })
}
