import BigNumber from "big.js"
import React from "react"
import { Operation, Transaction } from "stellar-sdk"
import Divider from "@material-ui/core/Divider"
import List from "@material-ui/core/List"
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery"
import { useAccountDataSet, useSigningKeyDomainCache, ObservedAccountData } from "../../hooks"
import { Account, AccountsContext } from "../../context/accounts"
import { SignatureRequest } from "../../lib/multisig-service"
import { getAllSources } from "../../lib/stellar"
import { isPotentiallyDangerousTransaction } from "../../lib/transaction"
import { SingleBalance } from "../Account/AccountBalances"
import { AccountName } from "../Fetchers"
import { Address } from "../PublicKey"
import { SummaryDetailsField, SummaryItem } from "./SummaryItem"
import OperationListItem from "./Operations"
import { DangerousTransactionWarning, Signers, TransactionMemo } from "./Transaction"

type TransactionWithUndocumentedProps = Transaction & {
  created_at: string
}

function getTime(time: string | number) {
  const date = new Date(time)
  return date.toLocaleString()
}

function isStellarWebAuth(transaction: Transaction) {
  const firstOperation = transaction.operations[0]

  return (
    String(transaction.sequence) === "0" &&
    firstOperation &&
    firstOperation.type === "manageData" &&
    firstOperation.name.match(/ auth$/i)
  )
}

function makeOperationSourceExplicit(
  operation: Operation,
  transaction: Transaction,
  localAccountPubKey?: string
): Operation {
  const effectiveSource = operation.source || transaction.source

  // Don't show the source if the source === the tx source === this account (this is the default case)
  return effectiveSource === transaction.source && (effectiveSource === localAccountPubKey || !localAccountPubKey)
    ? operation
    : { ...operation, source: effectiveSource }
}

const noHPaddingStyle = {
  paddingLeft: 0,
  paddingRight: 0
}

interface DefaultTransactionSummaryProps {
  accountData: ObservedAccountData
  isDangerousSignatureRequest?: boolean
  showSigners?: boolean
  showSource?: boolean
  style?: React.CSSProperties
  testnet: boolean
  transaction: Transaction
}

function DefaultTransactionSummary(props: DefaultTransactionSummaryProps) {
  const localAccountPublicKey = props.accountData.id
  const { accounts } = React.useContext(AccountsContext)

  const fee = BigNumber(props.transaction.fee)
    .mul(props.transaction.operations.length)
    .div(1e7)

  const transaction = props.transaction as TransactionWithUndocumentedProps

  return (
    <List style={props.style}>
      {props.isDangerousSignatureRequest ? <DangerousTransactionWarning /> : null}
      {props.transaction.operations.map((operation, index) => (
        <OperationListItem
          key={index}
          accountData={props.accountData}
          operation={
            props.showSource
              ? makeOperationSourceExplicit(operation, props.transaction, localAccountPublicKey)
              : operation
          }
          style={noHPaddingStyle}
          testnet={props.testnet}
          transaction={props.transaction}
        />
      ))}
      <Divider style={{ marginTop: 11, marginBottom: 11 }} />
      <TransactionMemo memo={props.transaction.memo} style={noHPaddingStyle} />
      {props.showSigners ? (
        <Signers
          accounts={accounts}
          accountData={props.accountData}
          transaction={props.transaction}
          style={noHPaddingStyle}
        />
      ) : null}
      {props.showSource ? (
        <SummaryItem>
          <SummaryDetailsField
            label="Source Account"
            value={<Address address={props.transaction.source} variant="short" />}
          />
        </SummaryItem>
      ) : null}
      <SummaryItem>
        <SummaryDetailsField label="Fee" value={<SingleBalance assetCode="XLM" balance={fee.toString()} inline />} />
        {transaction.created_at ? (
          <SummaryDetailsField label="Submission" value={getTime(transaction.created_at)} />
        ) : null}
      </SummaryItem>
    </List>
  )
}

interface WebAuthTransactionSummaryProps {
  style?: React.CSSProperties
  testnet: boolean
  transaction: Transaction
}

function WebAuthTransactionSummary(props: WebAuthTransactionSummaryProps) {
  const signingKeyCache = useSigningKeyDomainCache()
  const { timeBounds } = props.transaction

  const domain = signingKeyCache.get(props.transaction.source)
  const manageDataOperation = props.transaction.operations.find(op => op.type === "manageData")
  const maxTime = timeBounds ? Math.round(Number.parseInt(timeBounds.maxTime) * 1000) : 0

  if (!manageDataOperation) {
    throw Error("Invariant violation: Stellar web auth transaction must contain a manage_data operation.")
  }

  return (
    <List style={props.style}>
      <SummaryItem heading="Web Authentication">
        <SummaryDetailsField
          label="Service"
          value={domain ? domain : <AccountName publicKey={props.transaction.source} testnet={props.testnet} />}
        />
        <SummaryDetailsField
          label="Authenticate"
          value={<Address address={manageDataOperation.source || ""} variant="short" />}
        />
      </SummaryItem>
      <Divider />
      {maxTime ? (
        <SummaryItem>
          <SummaryDetailsField label="Expiry" value={getTime(maxTime)} />
        </SummaryItem>
      ) : null}
    </List>
  )
}

interface TransactionSummaryProps {
  account: Account | null
  showSource?: boolean
  signatureRequest?: SignatureRequest
  testnet: boolean
  transaction: Transaction
}

function TransactionSummary(props: TransactionSummaryProps) {
  const allTxSources = getAllSources(props.transaction)
  const { accounts } = React.useContext(AccountsContext)
  const accountDataSet = useAccountDataSet(allTxSources, props.testnet)

  const accountData = accountDataSet.find(someAccountData => someAccountData.id === props.transaction.source)
  const showSigners = accountDataSet.some(someAccountData => someAccountData.signers.length > 1)

  if (!accountData) {
    throw new Error(
      "Invariant violation: " +
        "Cannot find the transaction source account's account data in set of account data subscriptions."
    )
  }

  const isDangerousSignatureRequest = React.useMemo(
    () => {
      const localAccounts = accountDataSet.filter(someAccountData =>
        accounts.some(account => account.publicKey === someAccountData.id)
      )
      return props.signatureRequest && isPotentiallyDangerousTransaction(props.transaction, localAccounts)
    },
    [accountDataSet, accounts, props.signatureRequest, props.transaction]
  )

  const wideScreen = useMediaQuery("(min-width:900px)")
  const widthStyling = wideScreen ? { maxWidth: 700, minWidth: 320 } : { minWidth: "66vw" }

  if (isStellarWebAuth(props.transaction)) {
    return (
      <WebAuthTransactionSummary
        style={{ paddingLeft: 0, paddingRight: 0, ...widthStyling }}
        testnet={props.testnet}
        transaction={props.transaction}
      />
    )
  } else {
    return (
      <DefaultTransactionSummary
        {...props}
        accountData={accountData}
        isDangerousSignatureRequest={isDangerousSignatureRequest}
        showSigners={showSigners}
        style={{ paddingLeft: 0, paddingRight: 0, ...widthStyling }}
      />
    )
  }
}

export default React.memo(TransactionSummary)
