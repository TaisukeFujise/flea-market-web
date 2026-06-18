import { createContext, useContext, type Dispatch } from 'react'
import type { WsDamageDetectionCompleteEvent } from '../../utils/types'

type DamageResult = WsDamageDetectionCompleteEvent['payload']['damages'][number]

type DetectionStatus = 'waiting' | 'complete' | 'failed'

export type ListingFormData = {
  title: string
  description: string
  price: number
  categoryId: string
  categoryName: string
}

export type ListingState = {
  imageIds: string[]
  capturedUrls: string[]
  detectionStatus: DetectionStatus
  condition: 'good' | 'fair' | 'poor' | null
  conditionNote: string | null
  damages: DamageResult[]
  formData: ListingFormData | null
  createdProductId: string | null
  uploadedAt: number | null
}

export type ListingAction =
  | { type: 'UPLOAD_COMPLETE'; imageIds: string[]; capturedUrls: string[] }
  | { type: 'DETECTION_COMPLETE'; payload: WsDamageDetectionCompleteEvent['payload'] }
  | { type: 'DETECTION_FAILED' }
  | { type: 'FORM_SUBMIT'; formData: ListingFormData }
  | { type: 'LISTING_COMPLETE'; productId: string }
  | { type: 'RESET' }

const initialState: ListingState = {
  imageIds: [],
  capturedUrls: [],
  detectionStatus: 'waiting',
  condition: null,
  conditionNote: null,
  damages: [],
  formData: null,
  createdProductId: null,
  uploadedAt: null,
}

function listingReducer(state: ListingState, action: ListingAction): ListingState {
  switch (action.type) {
    case 'UPLOAD_COMPLETE':
      return {
        ...initialState,
        imageIds: action.imageIds,
        capturedUrls: action.capturedUrls,
        detectionStatus: 'waiting',
        uploadedAt: Date.now(),
      }
    case 'DETECTION_COMPLETE':
      return {
        ...state,
        detectionStatus: 'complete',
        condition: action.payload.condition,
        conditionNote: action.payload.condition_note,
        damages: action.payload.damages,
      }
    case 'DETECTION_FAILED':
      return { ...state, detectionStatus: 'failed' }
    case 'FORM_SUBMIT':
      return { ...state, formData: action.formData }
    case 'LISTING_COMPLETE':
      return { ...state, createdProductId: action.productId }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export type ListingContextValue = {
  state: ListingState
  dispatch: Dispatch<ListingAction>
}

export const ListingContext = createContext<ListingContextValue | null>(null)

export { listingReducer, initialState }

export function useListingContext() {
  const ctx = useContext(ListingContext)
  if (!ctx) throw new Error('useListingContext must be used within ListingProvider')
  return ctx
}
