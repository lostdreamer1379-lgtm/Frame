import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Film, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginFormValues } from '@/utils/authValidation';
import { notify } from '@/components/ui/Toast';
import { ROUTES } from '@/lib/routes';

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    const { error } = await signIn(values.email, values.password);
    if (error) {
      setFormError(error);
      return;
    }
    notify.success('Welcome back!');
    navigate(location.state?.from ?? ROUTES.HOME, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: 'var(--bg-main)' }}>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-5 pointer-events-none"
        style={{ background: 'var(--accent)' }}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl border border-[var(--accent)] flex items-center justify-center bg-[var(--accent-muted)]">
              <Film size={18} className="text-[var(--accent)]" />
            </div>
            <span className="font-display text-2xl font-semibold text-[var(--text-primary)]">FRAME</span>
          </Link>
          <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">Welcome back</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">Sign in to your cinema.</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-7">
          {!isConfigured && (
            <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-muted)] p-3.5 mb-5">
              <p className="text-xs font-medium text-[var(--accent)]">Supabase not configured</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable sign-in.
              </p>
            </div>
          )}

          {formError && (
            <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3.5 mb-5 flex items-start gap-2.5">
              <AlertCircle size={14} className="text-[var(--danger)] mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--danger)]">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-[var(--text-secondary)]">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  disabled={!isConfigured || isSubmitting}
                  className={[
                    'w-full pl-9 pr-3 py-2.5 h-10 rounded-lg border bg-[var(--input-bg)] text-sm text-[var(--text-primary)]',
                    'placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30',
                    errors.email ? 'border-[var(--danger)]' : 'border-[var(--border)] focus:border-[var(--accent)]',
                    (!isConfigured || isSubmitting) ? 'opacity-50 cursor-not-allowed' : '',
                  ].join(' ')}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-[var(--danger)]">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-[var(--text-secondary)]">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  disabled={!isConfigured || isSubmitting}
                  className={[
                    'w-full pl-9 pr-10 py-2.5 h-10 rounded-lg border bg-[var(--input-bg)] text-sm text-[var(--text-primary)]',
                    'placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30',
                    errors.password ? 'border-[var(--danger)]' : 'border-[var(--border)] focus:border-[var(--accent)]',
                    (!isConfigured || isSubmitting) ? 'opacity-50 cursor-not-allowed' : '',
                  ].join(' ')}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-[var(--danger)]">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-end -mt-1">
              <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs text-[var(--accent)] hover:underline">Forgot password?</Link>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              disabled={!isConfigured}
              icon={<ArrowRight size={15} />}
              iconPosition="right"
              className="mt-1"
            >
              Sign in
            </Button>
          </form>

          <p className="text-center text-xs text-[var(--text-secondary)] mt-5">
            No account?{' '}
            <Link to={ROUTES.SIGNUP} className="text-[var(--accent)] hover:underline font-medium">Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
