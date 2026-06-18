import { useReducer, type ReactNode } from 'react'
import { ListingContext, listingReducer, initialState } from './ListingContext'

export function ListingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(listingReducer, initialState)
  return (
    <ListingContext.Provider value={{ state, dispatch }}>
      {children}
    </ListingContext.Provider>
  )
}
