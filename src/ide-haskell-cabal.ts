import { Disposable, CompositeDisposable } from 'atom'
import { IdeBackend } from './ide-backend'
import * as UPI from 'atom-haskell-upi'

export { config } from './config'

let disposables: CompositeDisposable | undefined

export function activate() {
  /* noop */
}

export function deactivate() {
  if (disposables) {
    disposables.dispose()
  }
  disposables = undefined
}

export function consumeUPI(reg: UPI.IUPIRegistration) {
  const backend = new IdeBackend(reg)

  disposables = new CompositeDisposable()
  disposables.add(new Disposable(() => backend.destroy()))

  return disposables
}
