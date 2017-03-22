# Node module dependencies
child_process = require 'child_process'
{kill}        = require 'process'
path          = require 'path'
{EOL}         = require 'os'

# Atom dependencies
{Directory, Point} = require 'atom'

class CabalProcess
  # Spawn a process and log all messages
  constructor: (command, args, options, {onMsg, @onProgress, onDone, setCancelAction, @severity, @severityChangeRx}) ->
    @cwd = new Directory options.cwd
    @running = true
    # cabal returns failure when there are type errors _or_ when it can't
    # compile the code at all (i.e., when there are missing dependencies).
    # Since it's hard to distinguish between these two, we look at the
    # parsed errors;
    # @hasError is set if we find an error/warning, see parseMessage
    @hasError = false
    proc = child_process.spawn command, args, options

    buffered = (handleOutput) ->
      buffer = ''
      (data) ->
        output = data.toString('utf8')
        [first, mid..., last] = output.split(EOL)
        # ^ The only place where we get os-specific EOL (CR/CRLF/LF)
        # in the rest of the code we're using just LF (\n)
        buffer += first
        if last? # it means there's at least one newline
          lines = [buffer, mid...]
          buffer = last
          handleOutput lines

    blockBuffered = (handleOutput) ->
      # Start of a Cabal message
      startOfMessage = /\n(?=\S)/g
      buffer = []
      proc.on 'close', -> handleOutput(buffer.join('\n'))
      buffered (lines) ->
        buffer.push(lines...)
        # Could iterate over lines here, but this is easier, if not as effective
        [first, mid..., last] = buffer.join('\n').split(startOfMessage)
        if last?
          buffer = last.split('\n')
          for block in [first, mid...]
            handleOutput block

    setCancelAction? ->
      try kill -proc.pid
      try kill proc.pid
      try proc.kill()

    handleMessage = (msg) =>
      @checkProgress msg
      @checkSeverityChange msg
      parsed = @parseMessage(msg)
      if parsed? and onMsg?
        onMsg parsed

    # Note: blockBuffered used twice because we need separate buffers
    # for stderr and stdout
    proc.stdout.on 'data', blockBuffered handleMessage
    proc.stderr.on 'data', blockBuffered handleMessage

    proc.on 'close', (exitCode, signal) =>
      onDone? {exitCode, @hasError}
      @running = false

  unindentMessage: (lines) ->
    minIndent = Math.min((lines.map (line) -> line.match(/^\s*/)[0].length)...)
    lines.map (line) -> line.slice(minIndent)
    .join('\n')


  parseMessage: (raw) ->
    if raw.trim() != ""
      matchLoc = /^(.+):(\d+):(\d+):(?: (\w+):)?[ \t]*(\[[^\]]+\])?[ \t]*\n?([^]*)/
      matched = raw.trimRight().match(matchLoc)
      if matched?
        @hasError = true

        [file, line, col, rawTyp, context, msg] = matched.slice(1)
        typ = rawTyp?.toLowerCase?() ? 'error'

        uri:
          if path.isAbsolute(file)
            file
          else
            @cwd.getFile(file).getPath()
        position: new Point parseInt(line) - 1, parseInt(col) - 1
        context: context
        message:
          text: @unindentMessage(msg.split('\n'))
          highlighter: 'hint.message.haskell'
        severity: typ
      else
        message: raw
        severity: @severity

  checkSeverityChange: (data) ->
    for sev, rx of @severityChangeRx
      if data.match(rx)
        @severity = sev
        break

  checkProgress: (data) ->
    match = data.match /\[\s*([\d]+)\s+of\s+([\d]+)\s*\]/
    if match?
      [_, progress, total] = match
      @onProgress?(progress / total)

module.exports = runCabalProcess =
  (command, args, options, pars) ->
    newPars = {}
    newPars[k] = v for k, v of pars
    new Promise (resolve) ->
      newPars.onDone = resolve
      new CabalProcess(command, args, options, newPars)
