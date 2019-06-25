import React from "react"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import Radio from "@material-ui/core/Radio"
import withStyles, { ClassNameMap, StyleRules } from "@material-ui/core/styles/withStyles"
import { Account } from "../../context/accounts"
import AccountBalances from "./AccountBalances"

const isMobileDevice = process.env.PLATFORM === "android" || process.env.PLATFORM === "ios"

interface AccountSelectionListProps {
  accounts: Account[]
  disabled?: boolean
  testnet: boolean
  onChange?: (account: Account) => void
}

function AccountSelectionList(props: AccountSelectionListProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(-1)

  function handleListItemClick(event: React.MouseEvent, index: number) {
    setSelectedIndex(index)
    if (props.onChange) {
      props.onChange(props.accounts[index])
    }
  }

  return (
    <List style={{ background: "transparent", paddingLeft: 0, paddingRight: 0 }}>
      {props.accounts.map((account, index) => (
        <AccountSelectionListItem
          account={account}
          disabled={props.disabled}
          index={index}
          key={account.id}
          onClick={handleListItemClick}
          selected={index === selectedIndex}
        />
      ))}
    </List>
  )
}

const accountListItemStyles: StyleRules = {
  listItem: {
    background: "#FFFFFF",
    boxShadow: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",
    "&:focus": {
      backgroundColor: "#FFFFFF"
    },
    "&:hover": {
      backgroundColor: isMobileDevice ? "#FFFFFF" : "rgb(232, 232, 232)"
    }
  }
}

interface AccountSelectionListItemProps {
  account: Account
  classes: ClassNameMap<keyof typeof accountListItemStyles>
  disabled?: boolean
  index: number
  onClick: (event: React.MouseEvent, index: number) => void
  selected: boolean
  style?: React.CSSProperties
}

const AccountSelectionListItem = React.memo(
  // tslint:disable-next-line no-shadowed-variable
  withStyles(accountListItemStyles)(function AccountSelectionListItem(props: AccountSelectionListItemProps) {
    return (
      <ListItem
        button
        className={props.classes.listItem}
        component="li"
        disabled={props.disabled}
        selected={props.selected}
        onClick={event => props.onClick(event, props.index)}
      >
        <ListItemIcon style={{ marginRight: 0 }}>
          <Radio checked={props.selected && !props.disabled} color="default" />
        </ListItemIcon>
        <ListItemText
          primary={props.account.name}
          secondary={<AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />}
        />
      </ListItem>
    )
  } as React.ComponentType<AccountSelectionListItemProps>)
)

export default AccountSelectionList
