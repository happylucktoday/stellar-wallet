import { Observable } from "@andywer/observable-fns"
import { ServerSentEvent, SignatureRequest } from "../../lib/multisig-service"
import { manageStreamConnection, whenBackOnline, ServiceType } from "../../lib/stream"
import { joinURL } from "../../lib/url"

const dedupe = <T>(array: T[]) => Array.from(new Set(array))
const toArray = <T>(thing: T | T[]) => (Array.isArray(thing) ? thing : [thing])

export async function fetchSignatureRequests(serviceURL: string, accountIDs: string[]) {
  const url = joinURL(serviceURL, `/requests/${dedupe(accountIDs).join(",")}`)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Fetching signature requests failed: ${await response.text()}\nService: ${serviceURL}`)
  }

  return (await response.json()) as Array<Omit<SignatureRequest, "meta">>
}

interface NewSignatureRequest {
  type: "NewSignatureRequest"
  signatureRequest: SignatureRequest
}

interface SignatureRequestUpdate {
  type: "SignatureRequestUpdate"
  signatureRequest: SignatureRequest
}

interface SignatureRequestSubmitted {
  type: "SignatureRequestSubmitted"
  signatureRequest: SignatureRequest
}

type SignatureRequestEvent = NewSignatureRequest | SignatureRequestUpdate | SignatureRequestSubmitted

export function subscribeToSignatureRequests(serviceURL: string, accountIDs: string[]) {
  if (accountIDs.length === 0) {
    return new Observable<SignatureRequestEvent>(() => undefined)
  }

  const url = joinURL(serviceURL, `/stream/${dedupe(accountIDs).join(",")}`)

  return new Observable<SignatureRequestEvent>(observer => {
    let eventSource: EventSource
    let lastErrorTime = 0
    let unsubscribe: () => void

    const init = () => {
      unsubscribe = manageStreamConnection(ServiceType.MultiSigCoordinator, () => {
        eventSource = new EventSource(url)
        return () => eventSource.close()
      })

      eventSource.addEventListener(
        "signature-request",
        ((message: ServerSentEvent) => {
          for (const signatureRequest of toArray(message.data).map(data => JSON.parse(data))) {
            observer.next({
              type: "NewSignatureRequest",
              signatureRequest
            })
          }
        }) as any,
        false
      )

      eventSource.addEventListener(
        "signature-request:updated",
        ((message: ServerSentEvent) => {
          for (const signatureRequest of toArray(message.data).map(data => JSON.parse(data))) {
            observer.next({
              type: "SignatureRequestUpdate",
              signatureRequest
            })
          }
        }) as any,
        false
      )

      eventSource.addEventListener(
        "signature-request:submitted",
        ((message: ServerSentEvent) => {
          for (const signatureRequest of toArray(message.data).map(data => JSON.parse(data))) {
            observer.next({
              type: "SignatureRequestSubmitted",
              signatureRequest
            })
          }
        }) as any,
        false
      )

      const clearOnError = () => {
        eventSource.onerror = () => undefined
      }

      eventSource.onerror = () => {
        if (Date.now() - lastErrorTime > 10000) {
          // tslint:disable-next-line no-console
          console.error(Error("Multisig service event stream crashed."))
        }
        lastErrorTime = Date.now()

        if (navigator.onLine === false) {
          clearOnError()
          unsubscribe()
          whenBackOnline(() => init())
        } else if (eventSource.readyState === eventSource.CLOSED) {
          clearOnError()
          setTimeout(() => init(), 500)
        }
      }
    }

    init()

    return () => eventSource.close()
  })
}
