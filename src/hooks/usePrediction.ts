import { useState, useCallback } from 'react'
import type { PredictionInput, PredictionResult, PredictionSession } from '../domain/types'
import { RuleBasedPredictor } from '../domain/predictor/RuleBasedPredictor'
import { DK_SIS_AVG_DAILY_MARGIN_YEN, DEFAULT_TARGET_RECOVERY_WEEKS, DEFAULT_MACHINE_PRICE_YEN } from '../config/defaults'

const predictor = new RuleBasedPredictor()

export function buildDefaultInput(): PredictionInput {
  return {
    machineSpec: {
      machineName: '',
      category: 'smart_slot',
      coinUnitYen: 3.3,
      pureIncrease: { lower: 3.0 },
      gameFlow: 'pseudo_bonus_at',
      firstHitDenominator: 319,
      maker: '',
      ipFame: 'mid',
    },
    marketSignal: {
      popularityScore: 3,
      popularityMemo: '',
      referenceMachines: [],
    },
    managerEval: {
      overall: 3,
      explosivePayout: 3,
      gameplayFun: 3,
      customerFit: 3,
      comment: '',
    },
    storeConstraints: {
      newMachineBudget: 10_000_000,
      machinePrice: DEFAULT_MACHINE_PRICE_YEN,
      availableSlots: 6,
      targetRecoveryWeeks: DEFAULT_TARGET_RECOVERY_WEEKS,
      avgDailyMachineMarginYen: DK_SIS_AVG_DAILY_MARGIN_YEN,
      competitorAdoption: 'normal',
    },
  }
}

export function usePrediction() {
  const [input, setInput] = useState<PredictionInput>(buildDefaultInput)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [session, setSession] = useState<PredictionSession | null>(null)

  const updateInput = useCallback((patch: Partial<PredictionInput>) => {
    setInput(prev => ({ ...prev, ...patch }))
    setResult(null)
  }, [])

  const runPrediction = useCallback(() => {
    const res = predictor.predict(input)
    setResult(res)
    const sess: PredictionSession = {
      id: crypto.randomUUID(),
      input,
      result: res,
    }
    setSession(sess)
    return sess
  }, [input])

  const resetAll = useCallback(() => {
    setInput(buildDefaultInput())
    setResult(null)
    setSession(null)
  }, [])

  return { input, updateInput, result, session, runPrediction, resetAll }
}
