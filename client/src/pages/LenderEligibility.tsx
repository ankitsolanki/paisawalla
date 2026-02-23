import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertTriangle, Loader2, IndianRupee, Clock, Percent, ChevronDown, ChevronUp } from 'lucide-react';

interface EligibleLender {
  lender: string;
  displayName: string;
  maxLoanAmount: number;
  maxTenureMonths: number;
  minRoi: number;
  isFallback?: boolean;
}

interface IneligibleLender {
  lender: string;
  displayName: string;
  reason: string;
  declineCodes: string[];
}

interface EligibilityResult {
  eligible: EligibleLender[];
  ineligible: IneligibleLender[];
  decisionMode: string;
  applicantSummary: {
    age: number | null;
    employmentStatus: string;
    isValidEmployment: boolean;
    income: number;
    creditScore: number;
    pincode: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: EligibilityResult;
  message: string;
}

function formatCurrency(amount: number) {
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)} Lacs`;
  }
  return new Intl.NumberFormat('en-IN').format(amount);
}

export default function LenderEligibility() {
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    employmentStatus: '',
    grossIncome: '',
    creditScore: '',
    pincode: '',
  });
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showIneligible, setShowIneligible] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/lender-eligibility/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateOfBirth: formData.dateOfBirth || undefined,
          employmentStatus: formData.employmentStatus || undefined,
          grossIncome: formData.grossIncome ? parseFloat(formData.grossIncome) : undefined,
          creditScore: formData.creditScore ? parseInt(formData.creditScore) : undefined,
          pincode: formData.pincode,
        }),
      });

      const data: ApiResponse = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to check eligibility');
      }
      setResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      dateOfBirth: '',
      employmentStatus: '',
      grossIncome: '',
      creditScore: '',
      pincode: '',
    });
    setResult(null);
    setError('');
    setShowIneligible(false);
  };

  return (
    <div className="min-h-screen bg-secondary p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-page-title">
            Lender Eligibility Checker
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter applicant details to find eligible lenders based on ECV credit score and gating criteria.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Applicant Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="pincode">PIN Code *</Label>
                  <Input
                    id="pincode"
                    data-testid="input-pincode"
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 110001"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="creditScore">Credit Score (Experian) *</Label>
                  <Input
                    id="creditScore"
                    data-testid="input-credit-score"
                    type="number"
                    min={300}
                    max={900}
                    placeholder="e.g. 750"
                    value={formData.creditScore}
                    onChange={(e) => setFormData({ ...formData, creditScore: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    data-testid="input-dob"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="employmentStatus">Employment Status</Label>
                  <Select
                    value={formData.employmentStatus}
                    onValueChange={(val) => setFormData({ ...formData, employmentStatus: val })}
                  >
                    <SelectTrigger data-testid="select-employment">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">Salaried</SelectItem>
                      <SelectItem value="SE">Self Employed</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="grossIncome">Monthly Income (INR)</Label>
                  <Input
                    id="grossIncome"
                    data-testid="input-income"
                    type="number"
                    min={0}
                    placeholder="e.g. 50000"
                    value={formData.grossIncome}
                    onChange={(e) => setFormData({ ...formData, grossIncome: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={loading || !formData.pincode || !formData.creditScore}
                    data-testid="button-check-eligibility"
                    className="flex-1"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {loading ? 'Checking...' : 'Check Eligibility'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    data-testid="button-reset"
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-4">
            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p data-testid="text-error">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card>
                <CardContent className="pt-6 flex items-center justify-center gap-3 py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-muted-foreground">Evaluating lender criteria...</span>
                </CardContent>
              </Card>
            )}

            {result && !loading && (
              <>
                {result.applicantSummary && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" data-testid="badge-mode">
                          Mode: {result.decisionMode}
                        </Badge>
                        {result.applicantSummary.age && (
                          <Badge variant="secondary" data-testid="badge-age">
                            Age: {result.applicantSummary.age}
                          </Badge>
                        )}
                        <Badge variant="secondary" data-testid="badge-score">
                          Score: {result.applicantSummary.creditScore}
                        </Badge>
                        <Badge variant="secondary" data-testid="badge-income">
                          Income: {new Intl.NumberFormat('en-IN').format(result.applicantSummary.income)}
                        </Badge>
                        <Badge variant="secondary" data-testid="badge-pincode">
                          PIN: {result.applicantSummary.pincode}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result.eligible.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Eligible Lenders ({result.eligible.length})
                    </h3>
                    <div className="space-y-3">
                      {result.eligible.map((lender) => (
                        <Card key={lender.lender} data-testid={`card-eligible-${lender.lender}`}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-foreground text-lg">{lender.displayName}</h4>
                                  {lender.isFallback && (
                                    <Badge variant="outline" className="text-xs">Fallback</Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <IndianRupee className="w-3.5 h-3.5" />
                                    Up to {formatCurrency(lender.maxLoanAmount)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    Up to {lender.maxTenureMonths} months
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Percent className="w-3.5 h-3.5" />
                                    {lender.minRoi}% onwards
                                  </span>
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 no-default-hover-elevate no-default-active-elevate">
                                Eligible
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {result.eligible.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center py-8">
                      <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
                      <p className="text-foreground font-medium">No lenders eligible</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Based on the provided criteria, no primary lenders matched. Mpokket is available as a fallback.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {result.ineligible.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowIneligible(!showIneligible)}
                      data-testid="button-toggle-ineligible"
                      className="flex items-center gap-2 text-muted-foreground text-sm mb-3 bg-transparent border-none cursor-pointer p-0"
                    >
                      <XCircle className="w-4 h-4" />
                      Ineligible Lenders ({result.ineligible.length})
                      {showIneligible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showIneligible && (
                      <div className="space-y-2">
                        {result.ineligible.map((lender) => (
                          <Card key={lender.lender} className="opacity-70" data-testid={`card-ineligible-${lender.lender}`}>
                            <CardContent className="pt-4 pb-4">
                              <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div>
                                  <h4 className="font-medium text-foreground">{lender.displayName}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">{lender.reason}</p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {lender.declineCodes.map((code, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {code}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Badge variant="destructive" className="no-default-hover-elevate no-default-active-elevate">
                                  Declined
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {!result && !loading && !error && (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-muted-foreground">
                    Fill in the applicant details and click "Check Eligibility" to see matching lenders.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
