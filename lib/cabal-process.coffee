# Node module dependencies
child_process = require 'child_process'
{kill}        = require 'process'
path          = require 'path'

# Atom dependencies
{Directory, Point} = require 'atom'

# Regular expression to match against a location in a cabal msg (Foo.hs:3:2)
# The [^] syntax basically means "anything at all" (including newlines)
matchLoc = /(\S+):(\d+):(\d+):( Warning:)?\n?([^]*)/

# Start of a Cabal message
startOfMessage = /\n\S/

class CabalProcess
  # Spawn a process and log all messages
  constructor: (command, args, options, {onMsg, @onProgress, onDone, setCancelAction, @severity, @severityChangeRx}) ->
    @cwd = new Directory options.cwd
    @running = true
    proc = child_process.spawn command, args, options

    setCancelAction? ->
      try kill -proc.pid
      try kill proc.pid
      try proc.kill()

    proc.stdout.on 'data', (data) =>
      @checkProgress(data.toString())
      @checkSeverityChange(data.toString())
      onMsg? [
        message: data.toString()
        severity: @severity
      ]

    # We collect stderr from the process as it comes in and split it into
    # individual errors/warnings. We also keep the unparsed error messages
    # to show in case of a cabal failure.
    @errBuffer = ""
    @rawErrors = ""

    hasError = false

    proc.stderr.on 'data', (data) =>
      @errBuffer += data.toString()
      @checkSeverityChange(data.toString())
      @checkProgress(data.toString())
      msgs = @splitErrBuffer false
      for msg in msgs
        continue unless msg?
        if msg.uri?
          hasError = true
      onMsg? msgs

    proc.on 'close', (exitCode, signal) =>
      msgs = @splitErrBuffer true
      for msg in msgs
        if msg.uri?
          hasError = true
      onMsg? msgs
      onDone? {exitCode, hasError}
      @running = false

  # Split the error buffer we have so far into messages
  splitErrBuffer: (isEOF) ->
    som = @errBuffer.search startOfMessage
    msgs = while som >= 0
      errMsg     = @errBuffer.substr(0, som + 1)
      @errBuffer = @errBuffer.substr(som + 1)
      som        = @errBuffer.search startOfMessage
      @parseMessage errMsg
    if isEOF
      # Try to parse whatever is left in the buffer
      msgs.push @parseMessage @errBuffer
    msgs.filter (msg) -> msg?

  unindentMessage: (message) ->
    lines = message.split('\n')
    minIndent = null
    for line in lines
      match = line.match /^[\t\s]*/
      lineIndent = match[0].length
      minIndent = lineIndent if lineIndent < minIndent or not minIndent?
    if minIndent?
      lines = for line in lines
        line.slice(minIndent)
    lines.join('\n')


  parseMessage: (raw) ->
    if raw.trim() != ""
      matched = raw.match(matchLoc)
      if matched?
        [file, line, col, rawTyp, msg] = matched.slice(1, 6)
        typ = if rawTyp? then "warning" else "error"

        uri:
          if path.isAbsolute(file)
            file
          else
            @cwd.getFile(file).getPath()
        position: new Point parseInt(line) - 1, parseInt(col) - 1
        message:
          text: @unindentMessage(msg.trimRight())
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
