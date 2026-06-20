const submittedOrderIds = new Set<string>()

export function markFeedbackSubmitted(orderId: string): void {
  submittedOrderIds.add(orderId)
}

export function isFeedbackSubmitted(orderId: string): boolean {
  return submittedOrderIds.has(orderId)
}
