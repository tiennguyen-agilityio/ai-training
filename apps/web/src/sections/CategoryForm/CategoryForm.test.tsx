import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'

import { CategoryForm, type CategoryFormProps } from '.'
import { ROUTES } from '@/constants/routes'
import { ServiceError } from '@/utils/query'

jest.mock('next/navigation', () => ({
  usePathname: () => ROUTES.DASHBOARD_CATEGORIES_ADD,
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

const baseProps: CategoryFormProps = {
  formId: 'test-form',
  title: 'Add Category',
  breadcrumbItems: [
    { label: 'Dashboard', href: ROUTES.DASHBOARD },
    { label: 'Categories', href: ROUTES.DASHBOARD_CATEGORIES },
  ],
  submitLabel: 'Create category',
  isPending: false,
  onSubmit: jest.fn(),
}

const renderForm = (props: Partial<CategoryFormProps> = {}) =>
  render(<CategoryForm {...baseProps} {...props} />)

const nameInput = () => screen.getByRole('textbox', { name: /category name/i })
const submitButton = () =>
  screen.getByRole('button', { name: /create category/i })

const nameConflict = new ServiceError('Conflict', [
  {
    errCode: 'CATEGORY_NAME_EXISTS',
    field: 'name',
    message: 'Category name already exists',
  },
])

describe('CategoryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the title, breadcrumb and submit button it is given', () => {
    const { container } = renderForm()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Add Category' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Categories' })).toHaveAttribute(
      'href',
      ROUTES.DASHBOARD_CATEGORIES,
    )
    expect(submitButton()).toBeInTheDocument()
    expect(container.querySelector('form')).toHaveAttribute('id', 'test-form')
  })

  it('shows a required error and does not submit when the name is empty', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    renderForm({ onSubmit })

    await user.click(submitButton())

    expect(
      await screen.findByText(/this field is required/i),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('passes the trimmed name and the form actions to onSubmit', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    renderForm({ onSubmit })

    await user.type(nameInput(), '  Espresso  ')
    await user.click(submitButton())

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      { name: 'Espresso' },
      expect.objectContaining({
        handleServerError: expect.any(Function),
        reset: expect.any(Function),
      }),
    )
  })

  it('shows a name server error under the input and focuses it', async () => {
    const user = userEvent.setup()
    renderForm({
      onSubmit: (_values, { handleServerError }) =>
        handleServerError(nameConflict),
    })

    await user.type(nameInput(), 'Espresso')
    await user.click(submitButton())

    expect(
      await screen.findByText('Category name already exists'),
    ).toBeInTheDocument()
    expect(nameInput()).toHaveAttribute('aria-invalid', 'true')
    expect(nameInput()).toHaveFocus()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows other server errors as a toast', async () => {
    const user = userEvent.setup()
    renderForm({
      onSubmit: (_values, { handleServerError }) =>
        handleServerError(
          new ServiceError('Bad Request', [
            { errCode: 'E', field: '', message: 'Something failed' },
          ]),
        ),
    })

    await user.type(nameInput(), 'Espresso')
    await user.click(submitButton())

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Something failed'),
    )
    expect(screen.queryByText('Something failed')).not.toBeInTheDocument()
  })

  it('clears the name error when the name changes', async () => {
    const user = userEvent.setup()
    renderForm({
      onSubmit: (_values, { handleServerError }) =>
        handleServerError(nameConflict),
    })

    await user.type(nameInput(), 'Espresso')
    await user.click(submitButton())
    await screen.findByText('Category name already exists')

    await user.type(nameInput(), 'X')

    expect(
      screen.queryByText('Category name already exists'),
    ).not.toBeInTheDocument()
  })

  it('disables the submit button and the input while pending', () => {
    renderForm({ isPending: true })

    expect(submitButton()).toBeDisabled()
    expect(nameInput()).toBeDisabled()
  })

  it('shows the loading state instead of the input', () => {
    renderForm({ isLoading: true })

    expect(screen.getByText('Loading category')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(submitButton()).toBeDisabled()
  })

  it('fills the name from defaultName when it arrives', () => {
    const { rerender } = renderForm()
    expect(nameInput()).toHaveValue('')

    rerender(<CategoryForm {...baseProps} defaultName="Espresso" />)

    expect(nameInput()).toHaveValue('Espresso')
  })

  it('does not reset typed text when defaultName is unchanged', async () => {
    const user = userEvent.setup()
    const { rerender } = renderForm({ defaultName: 'Espresso' })

    await user.type(nameInput(), 'X')
    expect(nameInput()).toHaveValue('EspressoX')

    rerender(
      <CategoryForm
        {...baseProps}
        defaultName="Espresso"
        onSubmit={jest.fn()}
      />,
    )

    expect(nameInput()).toHaveValue('EspressoX')
  })

  it('keeps submit disabled until the name changes when requireChange is set', async () => {
    const user = userEvent.setup()
    renderForm({ defaultName: 'Espresso', requireChange: true })

    expect(submitButton()).toBeDisabled()

    await user.type(nameInput(), 'X')
    expect(submitButton()).toBeEnabled()

    await user.type(nameInput(), '{backspace}')
    expect(submitButton()).toBeDisabled()
  })
})
