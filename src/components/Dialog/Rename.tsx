import React from "react"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import TextField from "@material-ui/core/TextField"
import EditIcon from "@material-ui/icons/Edit"
import { trackError } from "../../context/notifications"
import CloseButton from "./CloseButton"
import { ActionButton, DialogActionsBox } from "./Generic"

interface Props {
  onClose: () => void
  performRenaming: (newValue: string) => Promise<void>
  prevValue: string
  title: string
}

function RenameDialog(props: Props) {
  const [newName, setNewName] = React.useState(props.prevValue)

  const handleInput = (event: React.SyntheticEvent) => {
    setNewName((event.target as HTMLInputElement).value)
  }

  const handleSubmit = (event?: React.SyntheticEvent) => {
    if (event) {
      event.preventDefault()
    }
    props.performRenaming(newName).catch(error => trackError(error))
    props.onClose()
  }

  return (
    <>
      <CloseButton onClick={props.onClose} />
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <form style={{ minWidth: 300 }} onSubmit={handleSubmit}>
          <TextField label="Name" fullWidth autoFocus margin="dense" value={newName} onChange={handleInput} />
          <DialogActionsBox>
            <ActionButton onClick={props.onClose}>Cancel</ActionButton>
            <ActionButton icon={<EditIcon />} onClick={handleSubmit} type="primary">
              Rename
            </ActionButton>
          </DialogActionsBox>
        </form>
      </DialogContent>
    </>
  )
}

export default React.memo(RenameDialog)
