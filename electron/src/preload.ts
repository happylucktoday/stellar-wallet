// tslint:disable-next-line: no-var-requires
const { ipcRenderer } = require("electron")
const electronProcess = process

function sendMessage<Message extends IPC.Messages>(
  messageType: Message,
  callID: number,
  ...args: IPC.MessageArgs<Message>
): Promise<IPC.MessageReturnType<Message>> {
  const responsePromise = new Promise<IPC.MessageReturnType<Message>>((resolve, reject) => {
    const listener = (event: Electron.Event, data: any) => {
      if (data.messageID === callID) {
        ipcRenderer.removeListener(messageType, listener)

        if (data.error) {
          const error = Object.assign(Error(data.error.message), {
            name: data.error.name || "Error",
            stack: data.error.stack
          })
          reject(error)
        } else if (data.result) {
          resolve(data.result)
        } else {
          resolve()
        }
      }
    }
    ipcRenderer.on(messageType, listener)
  })

  ipcRenderer.send(messageType, { callID, args })
  return responsePromise
}

async function sendIPCMessage<Message extends IPC.Messages>(
  messageType: Message,
  message: ElectronIPCCallMessage<Message>
) {
  const { args, callID } = message

  return sendMessage(messageType, callID, ...args)
}

function subscribeToIPCMessages<Message extends IPC.Messages>(
  messageType: Message,
  subscribeCallback: (event: Event, result: IPC.MessageReturnType<Message>) => void
) {
  ipcRenderer.on(messageType, subscribeCallback)
  const unsubscribe = () => ipcRenderer.removeListener(messageType, subscribeCallback)
  return unsubscribe
}

const electron: ElectronContext = {
  sendIPCMessage,
  subscribeToIPCMessages
}

global.electron = window.electron = electron

process.once("loaded", () => {
  const newProcess = {
    env: electronProcess.env,
    pid: electronProcess.pid,
    platform: electronProcess.platform
  }

  global.process = window.process = newProcess as NodeJS.Process
})
