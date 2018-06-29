import React from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import TextField from '@material-ui/core/TextField'
import { HorizontalLayout } from '../Layout/Box'
import { createOverlay, RenameOverlay, OverlayTypes } from '../../stores/overlays'

interface UIProps {
  open: boolean,
  title: string,
  value: string,
  onClose: () => void,
  onChange: (event: React.SyntheticEvent) => void,
  onSubmit: (event: React.SyntheticEvent) => void
}

const RenameDialogUI = (props: UIProps) => {
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <form style={{ minWidth: 300 }} onSubmit={props.onSubmit}>
          <TextField
            label='Name'
            fullWidth
            autoFocus
            margin='dense'
            value={props.value}
            onChange={props.onChange}
          />
          <HorizontalLayout margin='32px 0 0' justifyContent='end'>
            <Button variant='contained' color='primary' onClick={props.onSubmit} type='submit'>
              Rename
            </Button>
          </HorizontalLayout>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface Props {
  open: boolean,
  onClose: () => void,
  performRenaming: (newValue: string) => void,
  prevValue: string,
  title: string
}

interface State {
  value: string
}

class RenameDialog extends React.Component<Props, State> {
  state = {
    value: this.props.prevValue
  }

  handleInput = (event: React.SyntheticEvent) => {
    this.setState({ value: (event.target as HTMLInputElement).value })
  }

  handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault()
    this.props.performRenaming(this.state.value)
    this.props.onClose()
  }

  render () {
    return <RenameDialogUI {...this.props} onChange={this.handleInput} onSubmit={this.handleSubmit} value={this.state.value} />
  }
}

export default RenameDialog

export function create (title: string, prevValue: string, performRenaming: (newValue: string) => void): RenameOverlay {
  return createOverlay(OverlayTypes.Rename, { performRenaming, prevValue, title })
}
