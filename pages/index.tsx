import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import "react-bootstrap-typeahead/css/Typeahead.css"
import ReactDatePicker from "react-datepicker"
import Select from "react-select"
import { Container, Button, Form } from "react-bootstrap"
import { Typeahead } from "react-bootstrap-typeahead"
import { useState, useEffect, ChangeEvent, useRef } from "react"
import { TickerInput } from "controls/input"

import { useForm, Controller } from "react-hook-form"
import type { SubmitHandler, DefaultValues } from "react-hook-form"
import { ErrorMessage } from "@hookform/error-message"
type FormValues = {
  openedDate: Date
  ticker: string[]
  strategy: string
  buySell: string
  expiration: string
  strike: number
  contracts: number
  premium: number
  curPrice: number
}
type Ticker = {
  ticker: string
  name: string
}
const defaultValues: DefaultValues<FormValues> = {
  openedDate: new Date(),
  ticker: ["XOM"],
  strategy: "put",
  buySell: "sell",
  contracts: 5,
  premium: 0,
  curPrice: 0,
}

export default function Home(this: any) {
  const [tickers, setTickers] = useState([])
  const [hasTickers, setHasTickers] = useState(false)
  const [optionDataFor, setOptionDataFor] = useState(new Map())
  const [activeTicker, setActiveTicker] = useState("")
  const renderCounter = useRef(0)
  renderCounter.current = renderCounter.current + 1
  useEffect(() => {
    getTickers()
  }, [])
  const tickerChanged = (e: ChangeEvent<HTMLInputElement>) => {
    const ticker = e.target.value
    console.log("tiker selected", ticker)
    if (!validTiker(ticker)) {
      setError("ticker", { message: "Not a valid Ticker Symbol!" }, { shouldFocus: true })
      return
    }
    if (ticker && !optionDataFor.has(ticker)) {
      resetField('strike')
      getOptionsDataFor(ticker)
      setActiveTicker(ticker)
    } else {
      resetField('strike')
      setActiveTicker(ticker)
      setValue("curPrice", optionDataFor.get(ticker).price)
    }
  }
  const getOptionsDataFor = async (ticker: string) => {
    try {
      const response = await fetch(`/api/getOptionsData?name=${ticker}`)
      const myJson = await response.json()
      if (typeof myJson === "string") {
        setError("ticker", { message: "Yahoo lookup failed!" }, { shouldFocus: true })
        console.log("Yahoo lookup failed")
        return
      }
      console.log("optionData", optionDataFor.size)
      optionDataFor.set(ticker, myJson)
      setValue("curPrice", myJson.price)
      console.log("optionData", optionDataFor.size)
      setOptionDataFor((prev) => new Map([...prev, [ticker, myJson]]))
      console.log(ticker, optionDataFor)
    } catch (e) {
      console.log("Ticker error", e)
    }
  }
  const getTickers = async () => {
    if (!hasTickers) {
      try {
        //console.log("store getDates called")
        const response = await fetch("/api/getTickerSymbols")
        const myJson = await response.json()
        //console.log("getDates called", myJson)

        setTickers(myJson.map((d) => d.ticker))
        setHasTickers(true)
        console.log("we have tickers!")
      } catch (e) {
        console.log("Can't get tickers", e)
      }
    }
  }
  const validTiker = (sym) => {
    return tickers.find((t) => t === sym)
  }
  const getExpirationsFor = (sym: string) => {
    const data: string[] = optionDataFor.get(sym).expirationDates
    const dates = data.map((d) => ({ label: d.substring(0, 10), value: d }))
    return dates
  }
  const getStikesFor = (sym: string) => {
    const data: string[] = optionDataFor.get(sym).strikes
    const dates = data.map((d) => ({ label: d, value: d }))
    return dates
  }
  const {
    handleSubmit,
    register,
    reset,
    control,
    setValue,
    resetField,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues,
  })
  const onSubmit: SubmitHandler<FormValues> = (data) => {
    alert(JSON.stringify(data))
  }
  console.log("optionDataFor", optionDataFor.size, errors)

  return hasTickers ? (
    <Container>
      <form onSubmit={handleSubmit(onSubmit)} className="form">
        <div className={styles.container}>
          <Head>
            <title>Manage Options</title>
            <meta name="description" content="Manage your option trades" />
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <section>
            <label>Date Opened {renderCounter.current}</label>
            <Controller
              control={control}
              name="openedDate"
              render={({ field: { value, ...fieldProps } }) => {
                return (
                  <ReactDatePicker
                    {...fieldProps}
                    className="input"
                    placeholderText="Select date"
                    selected={value}
                  />
                )
              }}
            />
          </section>
          <section>
            {/* <Controller
              control={control}
              name="ticker"
              render={({ field, fieldState }) => (
                <>
                  <label htmlFor="typeahead" className="form-label">
                    Ticker
                  </label>
                 <Typeahead
                    {...field}
                    id="typeahead"
                    className={styles.typehead}
                    options={tickers}
                  
                    style={{ maxWidth: "250px" }}
                    placeholder="Type/Select a Ticker symbol..."
                    onChange={tickerChanged}
                    defaultSelected={[activeTicker === "" ? "XOM" : activeTicker]}
                  />
                  <p id="typeaheadError" className="invalid-feedback">
                    {fieldState.error?.message}
                  </p> 
                  <TickerInput
                    {...field}
                    style={{ maxWidth: "250px" }}
                    placeholder="Type a Ticker symbol..."
                    tellMe={tickerChanged}
                    
                  />
                </>
              )}
            />*/}
            <div className="mb-3 row">
              <label htmlFor="ticker" className="col-sm-2 col-form-label">
                Ticker
              </label>
              <div className="col-sm-4">
                <input
                  className="form-control"
                  type={"text"}
                  id="ticker"
                  {...register("ticker", {
                    required: "required",
                    onBlur: (e) => tickerChanged(e),
                    onChange: (e) => {
                      clearErrors("ticker")
                      setValue("ticker", e.target.value.toUpperCase())
                    },
                  })}
                />
              </div>
              <ErrorMessage errors={errors} name="ticker" />
            </div>
          </section>
          <Form.Group className="mb-3">
            <label className="form-label">Strategy</label>
            <Form.Check type="radio" label="Put" value="put" {...register("strategy")} />
            <Form.Check type="radio" label="Call" value="call" {...register("strategy")} />
          </Form.Group>
          <Form.Group className="mb-3">
            <label className="form-label">Buy or Sell</label>
            <Form.Check type="radio" label="Sell" value="sell" {...register("buySell")} />
            <Form.Check type="radio" label="Buy" value="buy" {...register("buySell")} />
          </Form.Group>
          <Form.Group className="mb-3">
            <label>Expiration</label>
            {optionDataFor.get(activeTicker) ? (
              <Controller
                name="expiration"
                control={control}
                rules={{ required: "Expiration is required" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Expiration"
                    options={getExpirationsFor(activeTicker)}
                    value={field.value}
                  />
                )}
              />
            ) : null}
          </Form.Group>
          <Form.Group className="mb-3">
            <label>Strike</label>
            {optionDataFor.get(activeTicker) ? (
              <Controller
                name="strike"
                control={control}
                rules={{ required: "Strike is required" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Expiration"
                    options={getStikesFor(activeTicker)}
                  />
                )}
              />
            ) : null}
          </Form.Group>
          <Form.Group className="mb-3">
            <label># of Contracts</label>
            <input type="number" {...register("contracts", { min: 1, max: 99 })} />
          </Form.Group>
          <label htmlFor="premium" className="form-label">
            Premium
          </label>
          <div className="input-group mb-3">
            <span className="input-group-text">$</span>
            <input type="text" id="premium" {...register("premium")} />
          </div>
          <label htmlFor="premium" className="form-label">
            Current Stock Price
          </label>
          {optionDataFor.get(activeTicker) ? (
            <div className="input-group mb-3">
              <span className="input-group-text">$</span>
              <input type="text" {...register("curPrice")} />
            </div>
          ) : null}
        </div>
        <Button type="submit" className="btn btn-primary">
          Submit
        </Button>
      </form>
    </Container>
  ) : (
    <div>waiting on Ticker symbols</div>
  )
}
