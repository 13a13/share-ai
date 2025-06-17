
export interface CostConfig {
  dailyBudget: number;
  monthlyBudget: number;
  costPerModelCall: Record<string, number>;
  alertThresholds: {
    warning: number; // 80% of budget
    critical: number; // 95% of budget
  };
}

export interface UsageRecord {
  calls: number;
  cost: number;
  date: string;
  modelBreakdown: Record<string, { calls: number; cost: number }>;
}

export class CostController {
  private config: CostConfig;
  private dailyUsage: Map<string, UsageRecord> = new Map();
  private monthlyUsage: Map<string, UsageRecord> = new Map();

  constructor(config: CostConfig) {
    this.config = config;
    console.log(`💰 [COST CONTROLLER] Initialized with daily budget: $${config.dailyBudget}, monthly: $${config.monthlyBudget}`);
  }

  async checkBudgetBeforeCall(modelName: string, estimatedCost: number): Promise<{ 
    allowed: boolean; 
    reason?: string; 
    remainingBudget: number 
  }> {
    const today = this.getDateKey();
    const thisMonth = this.getMonthKey();
    
    const currentDailyUsage = this.dailyUsage.get(today) || this.createEmptyUsageRecord(today);
    const currentMonthlyUsage = this.monthlyUsage.get(thisMonth) || this.createEmptyUsageRecord(thisMonth);
    
    const projectedDailyCost = currentDailyUsage.cost + estimatedCost;
    const projectedMonthlyCost = currentMonthlyUsage.cost + estimatedCost;
    
    console.log(`💰 [COST CONTROLLER] Budget check for ${modelName}:`, {
      estimatedCost,
      currentDaily: currentDailyUsage.cost,
      projectedDaily: projectedDailyCost,
      dailyBudget: this.config.dailyBudget,
      currentMonthly: currentMonthlyUsage.cost,
      projectedMonthly: projectedMonthlyCost,
      monthlyBudget: this.config.monthlyBudget
    });
    
    // Check daily budget
    if (projectedDailyCost > this.config.dailyBudget) {
      console.warn(`❌ [COST CONTROLLER] Daily budget exceeded for ${modelName}`);
      return {
        allowed: false,
        reason: `Daily budget exceeded. Current: $${currentDailyUsage.cost.toFixed(3)}, Projected: $${projectedDailyCost.toFixed(3)}, Budget: $${this.config.dailyBudget}`,
        remainingBudget: Math.max(0, this.config.dailyBudget - currentDailyUsage.cost)
      };
    }
    
    // Check monthly budget
    if (projectedMonthlyCost > this.config.monthlyBudget) {
      console.warn(`❌ [COST CONTROLLER] Monthly budget exceeded for ${modelName}`);
      return {
        allowed: false,
        reason: `Monthly budget exceeded. Current: $${currentMonthlyUsage.cost.toFixed(3)}, Projected: $${projectedMonthlyCost.toFixed(3)}, Budget: $${this.config.monthlyBudget}`,
        remainingBudget: Math.max(0, this.config.monthlyBudget - currentMonthlyUsage.cost)
      };
    }
    
    // Check warning thresholds
    const dailyWarningThreshold = this.config.dailyBudget * this.config.alertThresholds.warning;
    const monthlyCriticalThreshold = this.config.monthlyBudget * this.config.alertThresholds.critical;
    
    if (projectedDailyCost > dailyWarningThreshold) {
      const percentage = ((projectedDailyCost / this.config.dailyBudget) * 100).toFixed(1);
      console.warn(`⚠️ [COST CONTROLLER] Approaching daily budget limit: ${percentage}%`);
    }
    
    if (projectedMonthlyCost > monthlyCriticalThreshold) {
      const percentage = ((projectedMonthlyCost / this.config.monthlyBudget) * 100).toFixed(1);
      console.warn(`🚨 [COST CONTROLLER] Critical monthly budget threshold: ${percentage}%`);
    }
    
    return {
      allowed: true,
      remainingBudget: Math.min(
        this.config.dailyBudget - currentDailyUsage.cost,
        this.config.monthlyBudget - currentMonthlyUsage.cost
      )
    };
  }

  recordUsage(modelName: string, actualCost: number): void {
    const today = this.getDateKey();
    const thisMonth = this.getMonthKey();
    
    console.log(`📊 [COST CONTROLLER] Recording usage: ${modelName} - $${actualCost.toFixed(4)}`);
    
    // Update daily usage
    const dailyUsage = this.dailyUsage.get(today) || this.createEmptyUsageRecord(today);
    dailyUsage.calls += 1;
    dailyUsage.cost += actualCost;
    dailyUsage.modelBreakdown[modelName] = dailyUsage.modelBreakdown[modelName] || { calls: 0, cost: 0 };
    dailyUsage.modelBreakdown[modelName].calls += 1;
    dailyUsage.modelBreakdown[modelName].cost += actualCost;
    this.dailyUsage.set(today, dailyUsage);
    
    // Update monthly usage
    const monthlyUsage = this.monthlyUsage.get(thisMonth) || this.createEmptyUsageRecord(thisMonth);
    monthlyUsage.calls += 1;
    monthlyUsage.cost += actualCost;
    monthlyUsage.modelBreakdown[modelName] = monthlyUsage.modelBreakdown[modelName] || { calls: 0, cost: 0 };
    monthlyUsage.modelBreakdown[modelName].calls += 1;
    monthlyUsage.modelBreakdown[modelName].cost += actualCost;
    this.monthlyUsage.set(thisMonth, monthlyUsage);
    
    // Clean up old records to prevent memory leaks
    this.cleanupOldRecords();
  }

  shouldUseCostOptimizedModel(
    imageCount: number, 
    complexity: 'low' | 'medium' | 'high',
    remainingBudget?: number
  ): string {
    console.log(`🤔 [COST CONTROLLER] Determining cost-optimized model:`, {
      imageCount,
      complexity,
      remainingBudget
    });
    
    // If budget is very low, always use cheapest model
    if (remainingBudget !== undefined && remainingBudget < 0.02) {
      console.log(`💸 [COST CONTROLLER] Low budget, forcing cost-optimized model`);
      return 'gemini-1.5-flash';
    }
    
    // Simple heuristic for model selection based on cost-effectiveness
    if (complexity === 'low' || imageCount <= 3) {
      return 'gemini-1.5-flash';
    }
    
    const today = this.getDateKey();
    const currentDailyUsage = this.dailyUsage.get(today) || this.createEmptyUsageRecord(today);
    
    // If we're close to daily budget, prefer cheaper model
    const dailyUsagePercentage = currentDailyUsage.cost / this.config.dailyBudget;
    if (dailyUsagePercentage > this.config.alertThresholds.warning) {
      console.log(`📊 [COST CONTROLLER] High daily usage (${(dailyUsagePercentage * 100).toFixed(1)}%), using cost-optimized model`);
      return 'gemini-1.5-flash';
    }
    
    // For high complexity with budget available, use pro model
    if (complexity === 'high' && dailyUsagePercentage < 0.5) {
      return 'gemini-2.5-pro-preview-0506';
    }
    
    return 'gemini-1.5-flash';
  }

  getUsageSummary(): {
    daily: UsageRecord | null;
    monthly: UsageRecord | null;
    budgetStatus: {
      dailyRemaining: number;
      monthlyRemaining: number;
      dailyPercentage: number;
      monthlyPercentage: number;
    };
  } {
    const today = this.getDateKey();
    const thisMonth = this.getMonthKey();
    
    const dailyUsage = this.dailyUsage.get(today);
    const monthlyUsage = this.monthlyUsage.get(thisMonth);
    
    const dailyRemaining = this.config.dailyBudget - (dailyUsage?.cost || 0);
    const monthlyRemaining = this.config.monthlyBudget - (monthlyUsage?.cost || 0);
    
    return {
      daily: dailyUsage || null,
      monthly: monthlyUsage || null,
      budgetStatus: {
        dailyRemaining: Math.max(0, dailyRemaining),
        monthlyRemaining: Math.max(0, monthlyRemaining),
        dailyPercentage: ((dailyUsage?.cost || 0) / this.config.dailyBudget) * 100,
        monthlyPercentage: ((monthlyUsage?.cost || 0) / this.config.monthlyBudget) * 100
      }
    };
  }

  private createEmptyUsageRecord(date: string): UsageRecord {
    return {
      calls: 0,
      cost: 0,
      date,
      modelBreakdown: {}
    };
  }

  private getDateKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getMonthKey(): string {
    const date = new Date();
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  private cleanupOldRecords(): void {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    
    // Clean up daily records older than 30 days
    for (const [key] of this.dailyUsage) {
      const recordDate = new Date(key);
      if (recordDate < thirtyDaysAgo) {
        this.dailyUsage.delete(key);
      }
    }
    
    // Clean up monthly records older than 6 months
    for (const [key] of this.monthlyUsage) {
      const [year, month] = key.split('-').map(Number);
      const recordDate = new Date(year, month - 1);
      if (recordDate < sixMonthsAgo) {
        this.monthlyUsage.delete(key);
      }
    }
  }
}
