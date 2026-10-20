export const ERROR_MESSAGES = {
  IDENTIFIER_REQUIRED: 'Enter your email address',
  IDENTIFIER_EMAIL_INVALID: 'Enter a valid email address',
  PASSWORD_REQUIRED: 'Enter your password',
  EMAIL_ADDRESS_REQUIRED: 'Enter your email address',
  EMAIL_ADDRESS_INVALID: 'Enter a valid email address',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
  FIRST_NAME_REQUIRED: 'Enter your first name',
  LAST_NAME_REQUIRED: 'Enter your last name',
  SOMETHING_WENT_WRONG: 'Something went wrong',
  SIGN_OUT_FAILED: 'Logout failed. Something went wrong.',
  UNEXPECTED_PROFILE_RESPONSE: 'Unexpected profile response',
  NETWORK_ERROR: 'Network error',
  FIELD_REQUIRED: 'This field is required',
  // Exact text the API returns for this constraint (DiscountType.PERCENT) —
  // see ERROR_MESSAGES.PRODUCT_VARIANT.INVALID_DISCOUNT_PERCENT in
  // coffee-shop-api/src/common/constants/message.constant.ts.
  DISCOUNT_PERCENT_MAX:
    'DiscountValue must be less than 100 when DiscountType is PERCENT',
  DISCOUNT_FIXED_MUST_BE_LESS_THAN_PRICE:
    'Fixed discount must be less than base price',
  IMAGE_UPLOAD_NOT_CONFIGURED: 'Image upload is not configured',
  PRODUCT_AVATAR_REQUIRED: 'Main hero image is required',
  PRODUCT_GALLERY_REQUIRED: 'At least one gallery image is required',
  ADDRESS_REQUIRED: 'Enter your delivery address',
  PHONE_NUMBER_REQUIRED: 'Enter your phone number',
  CITY_REQUIRED: 'Enter your city',
  DISTRICT_REQUIRED: 'Enter your district',
  WARD_REQUIRED: 'Enter your ward',
  POSTAL_CODE_REQUIRED: 'Enter your postal code',
  CARD_NUMBER_REQUIRED: 'Enter your card number',
  CARD_NUMBER_INVALID: 'Enter a valid card number',
  EXPIRY_DATE_REQUIRED: 'Enter your expiry date',
  EXPIRY_DATE_INVALID: 'Enter expiry date as MM/YY',
  CVC_REQUIRED: 'Enter your CVC',
  CVC_INVALID: 'Enter a valid CVC',
  PROFILE_SYNC_DELAYED:
    'Saved, but syncing your profile is taking longer than expected. Refresh in a moment to confirm.',
} as const

// Mirrors VALIDATION_MESSAGES in
// coffee-shop-api/src/common/constants/message.constant.ts so field-level
// messages read identically whether they come from the API or client-side
// zod validation. `label` is the raw field name capitalized (first letter
// only, so e.g. "processingMethod" -> "ProcessingMethod"), matching how the
// API derives it in validation-error.util.ts.
export const VALIDATION_MESSAGES = {
  isNotEmpty: (label: string) => `${label} should not be empty`,
  isInt: (label: string) => `${label} must be an integer number`,
  isNumber: (label: string) =>
    `${label} must be a number conforming to the specified constraints`,
  isBoolean: (label: string) => `${label} must be a boolean value`,
  isArray: (label: string) => `${label} must be an array`,
  isString: (label: string) => `${label} must be a string`,
  isPositive: (label: string) => `${label} must be a positive number`,
  // `minimum`/`maximum` take a pre-formatted string (e.g. via
  // formatNumberThousands) to show a friendlier number than the raw API
  // value — the API itself always interpolates the raw number.
  min: (label: string, minimum?: number | string) =>
    `${label} must not be less than ${minimum}`,
  minLength: (label: string, minimum?: number) =>
    `${label} must be longer than or equal to ${minimum} characters`,
  max: (label: string, maximum?: number | string) =>
    `${label} must be less than ${maximum}`,
  arrayMinSize: (label: string, minimum?: number) =>
    `${label} must contain at least ${minimum} elements`,
  arrayMaxSize: (label: string, maximum?: number) =>
    `${label} must contain no more than ${maximum} elements`,
  maxLength: (label: string, maximum?: number) =>
    `${label} must be shorter than or equal to ${maximum} characters`,
  isUuid: (label: string) => `${label} must be a UUID`,
  isUrl: (label: string) => `${label} must be a URL address`,
  invalidFormat: (label: string) => `${label} has an invalid format`,
  isEnum: (label: string, values: unknown[]) =>
    `${label} must be one of the following values: ${values.join(', ')}`,
} as const

export const API_FALLBACK_ERRORS = {
  CATEGORY_CREATE: 'Could not create category',
  CATEGORY_DELETE: 'Could not delete category',
  CATEGORY_LOAD: 'Could not load category',
  CATEGORY_UPDATE: 'Could not update category',
  CATEGORIES_LOAD: 'Could not load categories',
  PRODUCT_CREATE: 'Could not create product',
  PRODUCT_DELETE: 'Could not delete product',
  PRODUCT_LOAD: 'Could not load product',
  PRODUCT_UPDATE: 'Could not update product',
  PRODUCTS_LOAD: 'Could not load products',
  IMAGE_UPLOAD: 'Could not upload image',
  USERS_LOAD: 'Could not load users',
  USER_DELETE: 'Could not delete user',
  USER_UPDATE: 'Could not update user',
  PROFILE_LOAD: 'Could not load profile',
  ORDER_CREATE: 'Could not place order',
  ORDER_DELETE: 'Could not delete order',
  ORDER_STATUS_UPDATE: 'Could not update order status',
  ORDER_SHIPPING_STATUS_UPDATE: 'Could not update shipping status',
  ORDERS_LOAD: 'Could not load orders',
} as const

export const SUCCESS_MESSAGES = {
  SIGNED_OUT: 'Signed out successfully',
  CATEGORY_CREATED: 'Category created',
  CATEGORY_UPDATED: 'Category updated',
  CATEGORY_DELETED: 'Category removed',
  PRODUCT_CREATED: 'Product created',
  PRODUCT_UPDATED: 'Product updated',
  PRODUCT_DELETED: 'Product removed',
  ORDER_DELETED: 'Order removed',
  ORDER_STATUS_UPDATED: 'Order status updated',
  ORDER_SHIPPING_STATUS_UPDATED: 'Shipping status updated',
  USER_ROLE_UPDATED: 'User role updated',
  USER_DELETED: 'User removed',
  PROFILE_UPDATED: 'Profile updated',
  DRAFT_DISCARDED: 'Draft discarded',
}

export const DIALOG_MESSAGES = {
  CATEGORY: {
    DELETE: {
      ACTION: 'Remove',
      DESCRIPTION: (name: string, slug: string) =>
        `This will remove ${name} (${slug}). It may still appear in this list with the Removed badge.`,
    },
  },
  PRODUCT: {
    DELETE: {
      ACTION: 'Delete Product',
      DESCRIPTION:
        'Are you sure you want to delete this product? This action cannot be undone.',
    },
  },
  ORDER: {
    DELETE: {
      ACTION: 'Delete order',
      DESCRIPTION: (orderLabel: string) =>
        `Are you sure you want to delete order ${orderLabel}? This action cannot be undone.`,
    },
  },
  USER: {
    DELETE: {
      ACTION: 'Delete user',
      DESCRIPTION: (userLabel: string) =>
        `Are you sure you want to delete ${userLabel}? This action cannot be undone.`,
    },
  },
}
