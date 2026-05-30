import { createIpcClient } from '@cli/ipc'
import { runPtyWrapper } from '@cli/pty'

function main(): void {
  const [, , command, ...args] = process.argv

  if (!command) {
    process.stderr.write('Usage: termcat <command> [args...]\n')
    process.exit(1)
  }

  const ipc = createIpcClient()
  ipc.connect()

  runPtyWrapper(command, args, ipc)
}

main()
