import { useState, useEffect } from 'react';
import { UserPlus, Mail, RotateCcw, Eye, EyeOff, Check, AlertCircle, Clock } from 'lucide-react';
import type { Sponsor } from '@shared/types/sponsor.types';
import { UserAccountsService, type AccountStatus } from '@/services/user-accounts.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface UserAccountManagerProps {
  sponsor: Sponsor;
  onAccountCreated?: () => void;
}

export function UserAccountManager({ sponsor, onAccountCreated }: UserAccountManagerProps) {
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newAccountData, setNewAccountData] = useState<{
    temporaryPassword: string;
    activationLink: string;
  } | null>(null);

  useEffect(() => {
    fetchAccountStatus();
  }, [sponsor._id]);

  const fetchAccountStatus = async () => {
    if (!sponsor._id) return;

    try {
      setLoading(true);
      setError(null);
      const status = await UserAccountsService.getAccountStatus(sponsor._id);
      setAccountStatus(status);
    } catch (err) {
      console.error('Failed to fetch account status:', err);
      setError('Failed to load account status');
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    if (!sponsor._id) return;

    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const response = await UserAccountsService.createSponsorAccount({
        sponsorId: sponsor._id,
        adminEmail: sponsor.adminEmail,
        sponsorName: sponsor.name,
      });

      if (response.success) {
        setNewAccountData({
          temporaryPassword: response.data.temporaryPassword,
          activationLink: response.data.activationLink,
        });
        setSuccess(
          response.data.emailSent
            ? 'Account created and welcome email sent successfully!'
            : 'Account created successfully! Please note the temporary credentials below.'
        );
        await fetchAccountStatus();
        onAccountCreated?.();
      }
    } catch (err) {
      console.error('Failed to create account:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const resendWelcomeEmail = async () => {
    if (!accountStatus?.userId) return;

    try {
      setLoading(true);
      setError(null);
      await UserAccountsService.resendWelcomeEmail(accountStatus.userId);
      setSuccess('Welcome email sent successfully!');
    } catch (err) {
      console.error('Failed to resend email:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend email');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!accountStatus?.userId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await UserAccountsService.resetSponsorPassword(accountStatus.userId);

      if (response.success) {
        setNewAccountData({
          temporaryPassword: response.data.temporaryPassword,
          activationLink: response.data.activationLink,
        });
        setSuccess('Password reset successfully! New temporary credentials generated.');
        await fetchAccountStatus();
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccountStatus = async () => {
    if (!accountStatus?.userId) return;

    try {
      setLoading(true);
      setError(null);

      if (accountStatus.isActive) {
        await UserAccountsService.deactivateAccount(accountStatus.userId);
        setSuccess('Account deactivated successfully');
      } else {
        await UserAccountsService.activateAccount(accountStatus.userId);
        setSuccess('Account activated successfully');
      }

      await fetchAccountStatus();
    } catch (err) {
      console.error('Failed to toggle account status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update account status');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  if (loading && !accountStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            User Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            Loading account status...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          User Account
        </CardTitle>
        <CardDescription>
          Manage sponsor access to the content management system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive rounded p-3">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        {!accountStatus ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>No user account created yet</span>
            </div>
            <Button
              onClick={createAccount}
              disabled={creating}
              className="w-full"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User Account
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              This will create a login account for the sponsor and send welcome email with credentials.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="mt-1">
                  <Badge variant={accountStatus.isActive ? 'default' : 'secondary'}>
                    {accountStatus.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <div className="mt-1 text-sm text-muted-foreground">
                  {accountStatus.email}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Created</label>
                <div className="mt-1 text-sm text-muted-foreground">
                  {new Date(accountStatus.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Last Login</label>
                <div className="mt-1 text-sm text-muted-foreground">
                  {accountStatus.lastLogin
                    ? new Date(accountStatus.lastLogin).toLocaleDateString()
                    : 'Never'
                  }
                </div>
              </div>
            </div>

            {accountStatus.passwordChangeRequired && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-3 text-sm">
                Password change required on next login
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resendWelcomeEmail}
                disabled={loading}
              >
                <Mail className="h-4 w-4 mr-2" />
                Resend Email
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      This will generate a new temporary password and send it to the sponsor's email.
                      The old password will no longer work.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {}}>
                      Cancel
                    </Button>
                    <Button onClick={resetPassword} disabled={loading}>
                      Reset Password
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant={accountStatus.isActive ? 'destructive' : 'default'}
                size="sm"
                onClick={toggleAccountStatus}
                disabled={loading}
              >
                {accountStatus.isActive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {newAccountData && (
          <div className="border rounded p-4 bg-muted/50 space-y-3">
            <h4 className="font-medium text-sm">New Account Credentials</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Temporary Password</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-background px-2 py-1 rounded border flex-1">
                    {showPassword ? newAccountData.temporaryPassword : '••••••••••••'}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-8 w-8"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(newAccountData.temporaryPassword)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Activation Link</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-background px-2 py-1 rounded border flex-1 truncate">
                    {newAccountData.activationLink}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(newAccountData.activationLink)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Save these credentials securely. They will only be shown once.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}