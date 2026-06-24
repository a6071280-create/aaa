import { useState, useMemo, useCallback, useRef } from 'react'
import type { FeedbackEntry } from '../domain/types'
import type { PredictorWeights } from '../config/weights'
import { learnFromFeedback, type WeightAdjustment } from '../domain/learning/WeightLearner'

export interface LearningData {
  history: FeedbackEntry[]
  exportedAt: string
}

export function useWeights() {
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackEntry[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { weights, adjustments } = useMemo<{ weights: PredictorWeights; adjustments: WeightAdjustment[] }>(
    () => learnFromFeedback(feedbackHistory),
    [feedbackHistory]
  )

  const addFeedback = useCallback((entry: Omit<FeedbackEntry, 'feedbackAt'>) => {
    setFeedbackHistory(prev => [
      ...prev,
      { ...entry, feedbackAt: new Date().toISOString() },
    ])
  }, [])

  const exportLearningData = useCallback(() => {
    const data: LearningData = {
      history: feedbackHistory,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shiire_learning_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [feedbackHistory])

  const importLearningData = useCallback((data: LearningData) => {
    if (Array.isArray(data.history)) {
      setFeedbackHistory(data.history)
    }
  }, [])

  const resetLearning = useCallback(() => setFeedbackHistory([]), [])

  return {
    weights,
    feedbackHistory,
    adjustments,
    addFeedback,
    exportLearningData,
    importLearningData,
    resetLearning,
    fileInputRef,
  }
}
