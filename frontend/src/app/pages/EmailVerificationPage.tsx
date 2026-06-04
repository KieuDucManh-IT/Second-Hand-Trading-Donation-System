import { Link, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Package, Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function EmailVerificationPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Simulate verification process
    const timer = setTimeout(() => {
      setStatus('success');
      toast.success('Email verified successfully!');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      navigate('/');
    }
  }, [status, countdown, navigate]);

  const handleResend = () => {
    setStatus('verifying');
    toast.success('Verification email resent!');
    setTimeout(() => {
      setStatus('success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          {status === 'verifying' && (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold">Verifying Your Email</CardTitle>
              <CardDescription>
                Please wait while we verify your email address...
              </CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
              <CardDescription>
                Your email has been successfully verified
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold">Verification Failed</CardTitle>
              <CardDescription>
                We couldn't verify your email address
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'verifying' && (
            <Alert>
              <Mail className="w-4 h-4" />
              <AlertDescription>
                This should only take a moment. Don't close this page.
              </AlertDescription>
            </Alert>
          )}

          {status === 'success' && (
            <>
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  You can now access all features of SecondLife. Redirecting in {countdown} seconds...
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => navigate('/')}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                Go to Home
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  The verification link may have expired or is invalid.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  onClick={handleResend}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  Resend Verification Email
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </>
          )}

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
