// src/app/auth/check-email/page.tsx
export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="mt-3 text-gray-600">
          We’ve sent a verification link to your email. 
          Please click the link in the message to verify your account.
        </p>
        <p className="mt-6 text-sm text-gray-500">
          Didn’t get an email? Check your spam folder, or try registering again.
        </p>
      </div>
    </main>
  );
}
