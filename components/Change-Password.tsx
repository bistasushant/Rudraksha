"use client"
import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Shield,
  CheckCircle,
  AlertCircle,
  Key,
  Sparkles,
  Zap,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

const ChangePassword = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'current' | 'new' | 'confirm' | null>(null);

  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;

    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9!@#$%^&*(),.?":{}|<>]/.test(password)
    ];

    checks.forEach(check => {
      if (check) strength += 25;
    });

    return strength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setNewPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  const getStrengthText = () => {
    if (passwordStrength <= 25) return "Weak";
    if (passwordStrength <= 50) return "Fair";
    if (passwordStrength <= 75) return "Good";
    return "Strong";
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return "from-red-500 to-red-600";
    if (passwordStrength <= 50) return "from-yellow-500 to-orange-500";
    if (passwordStrength <= 75) return "from-blue-500 to-indigo-500";
    return "from-green-500 to-emerald-500";
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      setLoading(false);
      return;
    }

    if (passwordStrength < 100) {
      setError("Password does not meet all strength requirements");
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast("🔐 Password changed successfully! Your account is now more secure.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStrength(0);
    } catch {
      setError("An error occurred while updating your password");
    } finally {
      setLoading(false);
    }
  };

  const passwordChecks = [
    {
      text: "At least 8 characters",
      check: newPassword.length >= 8,
      icon: CheckCircle
    },
    {
      text: "Lowercase letters (a-z)",
      check: /[a-z]/.test(newPassword),
      icon: CheckCircle
    },
    {
      text: "Uppercase letters (A-Z)",
      check: /[A-Z]/.test(newPassword),
      icon: CheckCircle
    },
    {
      text: "Numbers or special characters",
      check: /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      icon: CheckCircle
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-6 md:py-8 md:mt-16">
        {/* Floating header */}
        <div className="relative mb-6 md:mb-8 overflow-hidden rounded-2xl md:rounded-3xl bg-[#600000]/20 backdrop-blur-xl border border-white/30 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B1A1A]/20 via-[#D4AF37]/20 to-[#B87333]/20"></div>
          <div className="relative p-6 md:p-8 text-center">
            <div className="inline-flex items-center gap-2 mb-3 md:mb-4 px-3 md:px-4 py-2 rounded-full bg-white/30 backdrop-blur-sm border border-white/40">
              <Shield className="h-4 w-4 md:h-5 md:w-5 text-green-300 animate-pulse" />
              <span className="text-xs md:text-sm font-medium text-ivoryWhite">Security Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#B87333] via-[#D4AF37] to-[#8B1A1A] bg-clip-text text-transparent mb-2">
              Change Password
            </h1>
            <p className="text-base md:text-lg text-ivoryWhite">Keep your account secure with a strong password</p>
          </div>
        </div>

        {/* Main password change card */}
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-charcoalBlack shadow-2xl border border-gray-100">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-bl from-green-100/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-gradient-to-tr from-red-100/50 to-transparent rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative p-6 md:p-8 lg:p-12">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 md:p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                  <Key className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-emerald-500">Password Settings</h2>
                  <p className="text-sm md:text-base text-emerald-600/70">Ensure your account uses a strong password</p>
                </div>
              </div>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-xl bg-red-50 border border-red-200 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-2 md:gap-3">
                  <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm md:text-base font-medium text-red-800">Error</h4>
                    <p className="text-xs md:text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-xl bg-green-50 border border-green-200 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-2 md:gap-3">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm md:text-base font-medium text-green-800">Success</h4>
                    <p className="text-xs md:text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Password Form */}
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                {/* Current Password */}
                <div className="space-y-2 md:space-y-3">
                  <label className="block text-sm font-medium text-ivoryWhite">
                    Current Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter your current password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      onFocus={() => setFocusedField('current')}
                      onBlur={() => setFocusedField(null)}
                      disabled={loading}
                      className={`w-full pl-10 md:pl-12 pr-10 md:pr-12 py-3 md:py-4 rounded-xl border-2 transition-all duration-300 bg-[#2A2A2A]/50 backdrop-blur-sm text-ivoryWhite font-medium ${focusedField === 'current'
                        ? 'border-indigo-500 ring-4 ring-indigo-100 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 md:h-5 md:w-5 text-ivoryWhite" />
                      ) : (
                        <Eye className="h-4 w-4 md:h-5 md:w-5 text-ivoryWhite" />
                      )}
                    </button>
                    <Lock className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-ivoryWhite" />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2 md:space-y-3">
                  <label className="block text-sm font-medium text-ivoryWhite">
                    New Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={handlePasswordChange}
                      onFocus={() => setFocusedField('new')}
                      onBlur={() => setFocusedField(null)}
                      disabled={loading}
                      className={`w-full pl-10 md:pl-12 pr-10 md:pr-12 py-3 md:py-4 rounded-xl text-ivoryWhite border-2 transition-all duration-300 bg-[#2A2A2A]/50 backdrop-blur-sm font-medium ${focusedField === 'new'
                        ? 'border-purple-500 ring-4 ring-purple-100 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}

                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 md:h-5 md:w-5 text-ivoryWhite" />
                      ) : (
                        <Eye className="h-4 w-4 md:h-5 md:w-5 text-ivoryWhite" />
                      )}
                    </button>
                    <Key className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-ivoryWhite" />
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="space-y-2 md:space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs md:text-sm font-medium text-ivoryWhite">Password strength:</span>
                        <span className={`text-xs md:text-sm font-bold ${passwordStrength <= 25 ? 'text-red-500' :
                          passwordStrength <= 50 ? 'text-yellow-500' :
                            passwordStrength <= 75 ? 'text-blue-500' : 'text-green-500'
                          }`}>
                          {getStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getStrengthColor()} transition-all duration-500 ease-out rounded-full relative`}
                          style={{ width: `${passwordStrength}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2 md:space-y-3">
                  <label className="block text-sm font-medium text-ivoryWhite">
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirm')}
                      onBlur={() => setFocusedField(null)}
                      disabled={loading}
                      className={`w-full pl-10 md:pl-12 pr-10 md:pr-12 py-3 md:py-4 rounded-xl text-ivoryWhite border-2 transition-all duration-300 bg-[#2A2A2A]/50 backdrop-blur-sm font-medium ${focusedField === 'confirm'
                        ? 'border-pink-500 ring-4 ring-pink-100 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                        } ${confirmPassword && newPassword !== confirmPassword
                          ? 'border-red-300 ring-2 ring-red-100'
                          : ''
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 md:h-5 md:w-5 text-ivoryWhite" />
                      ) : (
                        <Eye className="h-4 w-4 md:h-5 md:w-5 text-ivoryWhite" />
                      )}
                    </button>
                    <ShieldCheck className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-ivoryWhite" />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs md:text-sm text-red-500 flex items-center gap-1 md:gap-2 animate-in slide-in-from-left-2 duration-200">
                      <AlertCircle className="h-3 w-3 md:h-4 md:w-4" />
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>

              {/* Password Requirements Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 p-4 md:p-6 rounded-2xl bg-gradient-to-br from-[#1C1C1C] to-[#2A2A2A] border border-[#D4AF37]/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-[#D4AF37]" />
                    <h3 className="text-sm md:text-base font-semibold text-ivoryWhite">Password Requirements</h3>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    {passwordChecks.map((requirement, index) => {
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg transition-all duration-300 ${requirement.check
                            ? 'bg-green-100 border border-green-200'
                            : 'bg-white/50 border border-gray-200'
                            }`}
                        >
                          <div className={`flex-shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center transition-all duration-300 ${requirement.check
                            ? 'bg-green-500 scale-110'
                            : 'bg-gray-300'
                            }`}>
                            {requirement.check ? (
                              <CheckCircle className="h-2 w-2 md:h-3 md:w-3 text-white" />
                            ) : (
                              <div className="w-1 h-1 md:w-2 md:h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className={`text-xs md:text-sm font-medium ${requirement.check ? 'text-green-800' : 'text-gray-800'
                            }`}>
                            {requirement.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Security Tip */}
                  <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <div className="flex items-start gap-2 md:gap-3">
                      <Zap className="h-4 w-4 md:h-5 md:w-5 mt-0.5 flex-shrink-0 text-white" />
                      <div>
                        <h4 className="text-sm md:text-base font-medium mb-1 text-white">Security Tip</h4>
                        <p className="text-xs md:text-sm opacity-90 text-white">Use a unique password that you don&apos;t use anywhere else.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Action Button */}
          <div className="sticky bottom-0 bg-[#2A2A2A]/80 backdrop-blur-xl border-t border-gray-100 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
              <div className="flex items-center gap-2 text-xs md:text-sm text-ivoryWhite">
                <UserCheck className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
                <span>Last changed: 30 days ago</span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || passwordStrength < 100 || newPassword !== confirmPassword}
                className="w-full sm:w-auto px-6 md:px-8 py-2 md:py-3 rounded-xl bg-gradient-to-r from-green-500/70 via-amber-500/70 to-emerald-500/70 text-white text-sm md:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:via-amber-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3 md:h-4 md:w-4" />
                    Update Password
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;