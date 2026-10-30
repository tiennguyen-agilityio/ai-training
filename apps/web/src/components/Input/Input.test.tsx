import { createRef, useState } from 'react'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Mail, Search } from 'lucide-react'

import { Input } from '@/components/Input'

describe('shared Input', () => {
  it('associates label with the control', () => {
    render(<Input label="Email" id="email-field" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders helper text and wires aria-describedby', () => {
    render(<Input label="Name" text="Use your legal name" id="name-field" />)
    const input = screen.getByLabelText('Name')
    const descId = input.getAttribute('aria-describedby')
    expect(descId).not.toBeNull()
    if (descId === null) {
      throw new Error('expected aria-describedby')
    }
    const descriptionEl = document.getElementById(descId)
    expect(descriptionEl).toHaveTextContent('Use your legal name')
  })

  it('forwards ref to the inner input', () => {
    const ref = createRef<HTMLElement>()
    render(<Input ref={ref} aria-label="x" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('renders start and end icons', () => {
    render(
      <Input
        aria-label="search"
        startIcon={<Mail data-testid="start" />}
        endIcon={<Search data-testid="end" />}
      />,
    )
    expect(screen.getByTestId('start')).toBeInTheDocument()
    expect(screen.getByTestId('end')).toBeInTheDocument()
  })

  it('toggles password visibility with the eye control', async () => {
    const user = userEvent.setup()
    render(
      <Input
        label="Password"
        type="password"
        defaultValue="secret"
        id="pw-field"
      />,
    )
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')

    const toggle = screen.getByRole('button', { name: 'Show password' })
    await user.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
    expect(
      screen.getByRole('button', { name: 'Hide password' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('does not show password toggle when type is text', () => {
    render(<Input label="User" type="text" id="u" />)
    expect(
      screen.queryByRole('button', { name: 'Show password' }),
    ).not.toBeInTheDocument()
  })

  it('renders error message, aria-invalid, and describedby', () => {
    render(<Input label="Email" id="err-field" errorMessage="Invalid email" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const ids = input.getAttribute('aria-describedby')?.split(/\s+/) ?? []
    expect(ids.length).toBeGreaterThan(0)
    const errId = ids.find((id) => id.endsWith('-error'))
    expect(errId).toBeDefined()
    if (errId === undefined) {
      throw new Error('expected error id in aria-describedby')
    }
    const alert = document.getElementById(errId)
    expect(alert).toHaveAttribute('role', 'alert')
    expect(alert).toHaveTextContent('Invalid email')
  })

  it('includes helper and error ids in aria-describedby when both set', () => {
    render(
      <Input label="Field" id="both-field" text="Hint" errorMessage="Wrong" />,
    )
    const input = screen.getByLabelText('Field')
    const ids = input.getAttribute('aria-describedby')?.split(/\s+/) ?? []
    expect(ids.some((id) => id.endsWith('-description'))).toBe(true)
    expect(ids.some((id) => id.endsWith('-error'))).toBe(true)
  })

  it('ignores a typed number above max', async () => {
    const onChange = jest.fn()
    render(
      <Input
        label="Discount"
        type="number"
        max={99.99}
        maxDecimalPlaces={2}
        onChange={onChange}
      />,
    )
    const input = screen.getByLabelText('Discount')

    await userEvent.type(input, '100')

    expect(input).toHaveValue('10')
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('ignores a typed number above max when controlled', async () => {
    const received: string[] = []
    const ControlledInput = () => {
      const [value, setValue] = useState('')
      return (
        <Input
          label="Quantity"
          type="number"
          max={500}
          value={value}
          onValueChange={(next: string) => {
            received.push(next)
            setValue(next)
          }}
        />
      )
    }
    render(<ControlledInput />)
    const input = screen.getByLabelText('Quantity')

    await userEvent.type(input, '501')

    expect(input).toHaveValue('50')
    expect(received.every((next) => Number(next) <= 500)).toBe(true)
  })

  it('keeps the caret where it was when a keystroke is rejected', async () => {
    const user = userEvent.setup()
    render(<Input label="Quantity" type="number" max={500} />)
    const input = screen.getByLabelText('Quantity')
    if (!(input instanceof HTMLInputElement)) throw new Error('input')
    await user.type(input, '45')

    await user.type(input, '9', {
      initialSelectionStart: 0,
      initialSelectionEnd: 0,
    })

    expect(input).toHaveValue('45')
    expect(input.selectionStart).toBe(0)
  })
})
