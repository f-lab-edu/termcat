import { createIpcClient } from '@cli/ipc-client'
import { runPtyWrapper } from '@cli/pty-wrapper'

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv

  if (!command) {
    process.stderr.write('Usage: termcat <command> [args...]\n')
    process.exit(1)
  }

  const ipc = createIpcClient()
  await ipc.connect()

  runPtyWrapper(command, args, ipc)
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  process.stderr.write(`termcat: failed to connect to daemon (${message})\n`)
  process.exit(1)
})
