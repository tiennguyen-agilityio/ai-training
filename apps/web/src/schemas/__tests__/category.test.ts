import { ERROR_MESSAGES, VALIDATION_MESSAGES } from '@/constants/messages'
import { VALIDATION_RULES } from '@/constants/validation'
import { parseCreateCategoryForm } from '@/schemas/category'

const { NAME } = VALIDATION_RULES

function formFrom(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v)
  }
  return fd
}

describe('parseCreateCategoryForm', () => {
  it('accepts valid trimmed name', () => {
    const result = parseCreateCategoryForm(formFrom({ name: 'Single Origin' }))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ name: 'Single Origin' })
    }
  })

  it('rejects empty name', () => {
    const result = parseCreateCategoryForm(formFrom({ name: '' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe(
        ERROR_MESSAGES.FIELD_REQUIRED,
      )
    }
  })

  it('rejects name longer than max', () => {
    const result = parseCreateCategoryForm(formFrom({ name: 'x'.repeat(121) }))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe(
        VALIDATION_MESSAGES.maxLength('Name', NAME.MAX_LENGTH),
      )
    }
  })

  it('rejects name shorter than min', () => {
    const result = parseCreateCategoryForm(formFrom({ name: 'x' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe(
        VALIDATION_MESSAGES.minLength('Name', NAME.MIN_LENGTH),
      )
    }
  })
})
