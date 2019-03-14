import React from "react"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"

export function PriceInput(props: TextFieldProps & { assetCode: string; readOnly?: boolean }) {
  return (
    <TextField
      {...props}
      InputProps={{
        endAdornment: (
          <InputAdornment disableTypography position="end" style={{ pointerEvents: "none" }}>
            {props.assetCode}
          </InputAdornment>
        ),
        readOnly: props.readOnly,
        ...props.InputProps
      }}
      style={{
        pointerEvents: props.readOnly ? "none" : undefined,
        ...props.style
      }}
    />
  )
}

export function ReadOnlyTextfield(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      style={{
        pointerEvents: "none",
        ...props.style
      }}
      tabIndex={-1}
      InputProps={{
        readOnly: true,
        ...props.InputProps
      }}
    />
  )
}
