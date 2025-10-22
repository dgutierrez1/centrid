import Link from 'next/link';
import { ForgotPasswordScreen } from '../../components/AccountFoundation';

export default function ForgotPasswordPage() {
  return (
    <div>
      <div className="absolute top-4 left-4 z-10">
        <Link href="/account-foundation" className="text-sm text-primary-600 hover:underline">
          ← Back to Account Foundation
        </Link>
      </div>
      <ForgotPasswordScreen />
    </div>
  );
}
