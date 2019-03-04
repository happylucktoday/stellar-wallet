import React from "react"
import { Keypair } from "stellar-sdk"
import { useRouter } from "../hooks"
import * as routes from "../routes"
import { Section } from "../components/Layout/Page"
import AccountCreationForm, { AccountCreationValues } from "../components/Form/CreateAccount"
import { Box } from "../components/Layout/Box"
import { AccountsContext } from "../context/accounts"
import { trackError } from "../context/notifications"

import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery"

function CreateAccountPage(props: { testnet: boolean }) {
  const { accounts, createAccount } = React.useContext(AccountsContext)
  const router = useRouter()

  const isSmallScreen = useMediaQuery("(max-device-width:600px)")

  const onCreateAccount = async (formValues: AccountCreationValues) => {
    try {
      const account = await createAccount({
        name: formValues.name,
        keypair: Keypair.fromSecret(formValues.privateKey),
        password: formValues.setPassword ? formValues.password : null,
        testnet: props.testnet
      })
      router.history.push(routes.account(account.id))
    } catch (error) {
      trackError(error)
    }
  }

  const onClose = () => router.history.push(routes.allAccounts())

  return (
    <Section top>
      <Box padding={isSmallScreen ? "12px 12px 0px 0px" : "16px 24px"} style={{ position: "relative" }}>
        <AccountCreationForm
          accounts={accounts}
          onCancel={onClose}
          onSubmit={onCreateAccount}
          testnet={props.testnet}
        />
      </Box>
    </Section>
  )
}

export default CreateAccountPage
