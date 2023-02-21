import React, { useState, forwardRef } from "react"

const TickerInput = forwardRef((props, ref) => {
  const [ticker, setTicker] = useState("")
  return (
    <input
      type="text"
      value={ticker}
      ref={ref}
      onChange={(event) => {
        const val = event.target.value.toUpperCase()
        setTicker(val)
      }}
      onBlur={() => {
        props.tellMe(ticker)
      }}
    />
  )
})
//export const React.forwardRef(TickerInput)
export { TickerInput }
