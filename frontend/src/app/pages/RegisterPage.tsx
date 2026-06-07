import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Checkbox } from '../components/ui/checkbox';
import { Package, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function RegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<'REGISTER' | 'OTP'>('REGISTER');

  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to send OTP');
        toast.error(data.message || 'Failed to send OTP');
        return;
      }

      toast.success('OTP has been sent to your email!');
      setStep('OTP');
    } catch (err) {
      setError('Cannot connect to server');
      toast.error('Cannot connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp) {
      setError('Please enter OTP');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: formData.userName,
          email: formData.email,
          password: formData.password,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Invalid OTP');
        toast.error(data.message || 'Invalid OTP');
        return;
      }

      toast.success('Account created successfully!');
      navigate('/login');
    } catch (err) {
      setError('Cannot connect to server');
      toast.error('OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-white" />
          </div>

          <CardTitle className="text-2xl font-bold">
            {step === 'REGISTER' ? 'Create Account' : 'Verify Email'}
          </CardTitle>

          <CardDescription>
            {step === 'REGISTER'
              ? 'Join SecondLife and start trading today'
              : `Enter the OTP sent to ${formData.email}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'REGISTER' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">User Name</Label>
                <Input
                  id="userName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Must be at least 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-600 dark:text-gray-400 leading-tight cursor-pointer"
                >
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                disabled={isLoading}
              >
                {isLoading ? 'Sending OTP...' : 'Create Account'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                />
                <p className="text-xs text-gray-500">
                  Please check your email and enter the OTP code.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying OTP...' : 'Verify OTP'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep('REGISTER')}
                disabled={isLoading}
              >
                Back to Register
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
              Sign in
            </Link>
          </div>

          <div className="text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
