import { spawn, Thread } from "threads"
import { NetWorker } from "../workers/net-worker/worker"

export interface AssetRecord {
  code: string
  desc: string
  issuer: string
  issuer_detail: {
    name: string
    url: string
  }
  name: string
  num_accounts: number
  status: string
  type: string
}

export async function fetchAllAssets(testnet: boolean): Promise<AssetRecord[]> {
  const storageKey = testnet ? "known-assets:testnet" : "known-assets:mainnet"

  const cachedAssetsString = localStorage.getItem(storageKey)
  const timestamp = localStorage.getItem("known-assets:timestamp")

  if (cachedAssetsString && timestamp && +timestamp > Date.now() - 24 * 60 * 60 * 1000) {
    // use cached assets if they are not older than 24h
    return JSON.parse(cachedAssetsString)
  } else {
    const netWorker = await spawn<NetWorker>(new Worker("../workers/net-worker/worker.ts"))
    const allAssets = await netWorker.fetchAllAssets(testnet)
    await Thread.terminate(netWorker)

    localStorage.setItem(storageKey, JSON.stringify(allAssets))
    localStorage.setItem("known-assets:timestamp", Date.now().toString())

    return allAssets
  }
}
